// @vitest-environment node
/**
 * Golden event streams of `POST /api/ai/suggest` (master plan P1-18): the
 * exact NDJSON a browser receives for recorded provider replies, the order
 * in which the route falls back from Anthropic to OpenAI to its built-in
 * suggestions, and what it does today with replies it does not check.
 *
 * Each golden stream is approved as a file in `__streams__/`, one event per
 * line, so a change to an event shows up in review as a line diff. The real
 * route runs with only Auth.js's `auth()` and Prisma mocked (ADR 0005 rule
 * 5); MSW serves the providers and Scryfall. Vitest's fake clock drives the
 * route's per-event delay, so the delay is pinned exactly and costs no time.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import {
  anthropicMessage,
  openAIChatCompletion,
} from "@/lib/ai/fixtures/provider-envelopes-v1";
import {
  SUGGEST_REPLY_CARDS_V1,
  SUGGEST_REPLY_TEXT_V1,
} from "@/lib/ai/fixtures/suggest-reply-v1";
import { TALRAND_SUGGEST_REQUEST } from "@/lib/ai/fixtures/talrand-requests";
import { processStream } from "@/lib/ai/suggestion-stream";
import { getSuggestionLegality } from "@/lib/ai/suggestion-review";
import { logger } from "@/lib/logger";
import {
  modelProviderServes,
  readNdjsonOnFakeClock,
  SCRYFALL_COLLECTION_URL,
  scryfallCollectionServes,
  type SentModelRequest,
} from "@/test/ai-route-msw";
import { resetAiUsageDb } from "@/test/ai-usage-db";
import { setupMsw } from "@/test/msw";
import { z } from "zod";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

const fake = vi.hoisted(() => ({
  auth: vi.fn(),
  findUser: vi.fn(),
  playtestSessions: vi.fn(),
}));
const db = await vi.hoisted(async () => {
  const { createAiUsageDb } = await import("@/test/ai-usage-db");
  return createAiUsageDb();
});

vi.mock(import("@/lib/auth/config"), () => ({ auth: fake.auth }));
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    ...db,
    user: { findUnique: fake.findUser },
    playtestSession: { findMany: fake.playtestSessions },
  });
});

import { POST } from "./route";

/** The evidence the route attaches to a suggestion (`SuggestionEvidence`). */
const EVIDENCE = z.object({
  role: z.string(),
  synergy: z.string(),
  manaValue: z.number().nullable(),
  curveImpact: z.string(),
  colorIdentity: z.array(z.string()),
  colorCompatible: z.boolean().nullable(),
  commanderLegal: z.boolean().nullable(),
  priceUsd: z.number().nullable(),
  verified: z.boolean(),
});

/** The fields of a streamed suggestion these tests read. */
const SUGGESTION_EVENT = z.object({
  type: z.literal("suggestion"),
  data: z.object({ name: z.string(), evidence: EVIDENCE }),
});

const REMOVAL_EVENT = z.object({
  type: z.literal("removal"),
  data: z.object({ name: z.string() }),
});

const EVENT_TYPE = z.object({ type: z.string() });

let player = 0;
const sent: SentModelRequest[] = [];
const scryfallAsked: string[][] = [];

function suggestRequest(body: unknown = TALRAND_SUGGEST_REQUEST): Request {
  return new Request("http://localhost/api/ai/suggest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Posts `body` and reads the whole stream on the fake clock. */
async function streamFor(body: unknown = TALRAND_SUGGEST_REQUEST) {
  return readNdjsonOnFakeClock(await POST(suggestRequest(body)));
}

/** The provider answering every request with the model text `reply`. */
function anthropicAnswers(reply: string) {
  return modelProviderServes(ANTHROPIC_MESSAGES_URL, sent, () =>
    HttpResponse.json(anthropicMessage(reply))
  );
}

function typesOf(events: readonly { readonly event: unknown }[]): string[] {
  return events.map(({ event }) => EVENT_TYPE.parse(event).type);
}

function suggestionsOf(events: readonly { readonly event: unknown }[]) {
  return events.flatMap(({ event }) => {
    const suggestion = SUGGESTION_EVENT.safeParse(event);
    return suggestion.success ? [suggestion.data.data] : [];
  });
}

/** Reads `body` the way the suggestions panel does. */
async function readAsPanel(body: string) {
  const reader = new Response(body).body?.getReader();
  if (!reader) throw new Error("No body to read.");
  const updates: number[] = [];
  const result = await processStream(reader, (acc) =>
    updates.push(acc.suggestions.length + acc.removals.length)
  );
  return { result, updates };
}

describe("POST /api/ai/suggest event stream", () => {
  const server = setupMsw(
    anthropicAnswers(SUGGEST_REPLY_TEXT_V1),
    modelProviderServes(OPENAI_CHAT_URL, sent, () =>
      HttpResponse.json(openAIChatCompletion(SUGGEST_REPLY_TEXT_V1))
    ),
    scryfallCollectionServes(SUGGEST_REPLY_CARDS_V1, scryfallAsked)
  );

  beforeEach(() => {
    // A new player per test keeps the real rate limiter's window empty.
    player += 1;
    const playerId = `player-${player}`;
    sent.length = 0;
    scryfallAsked.length = 0;
    resetAiUsageDb(db);
    fake.auth.mockReset().mockResolvedValue({
      user: { id: playerId },
      expires: "2099-01-01T00:00:00.000Z",
    });
    fake.findUser.mockReset().mockResolvedValue({ id: playerId });
    fake.playtestSessions.mockReset().mockResolvedValue([]);
    vi.stubEnv("PLAYWRIGHT_TEST", "0");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.useFakeTimers({
      now: new Date("2026-11-11T09:00:00.000Z"),
      toFake: ["setTimeout", "Date"],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("golden streams", () => {
    it("streams the recorded Anthropic reply as its analysis, 8 suggestions with evidence, 4 removals, then done", async () => {
      const { body, events } = await streamFor();

      expect(typesOf(events)).toEqual([
        "analysis",
        ...Array(8).fill("suggestion"),
        ...Array(4).fill("removal"),
        "done",
      ]);
      // One Scryfall request resolves every suggested and alternative name.
      expect(scryfallAsked).toEqual([
        [
          "Archmage Emeritus",
          "Fierce Guardianship",
          "Dispel",
          "Force of Will",
          "Narset's Reversal",
          "Swan Song",
          "Mystic Sanctuary",
          "Mind Stone",
          "Thousand-Year Storm",
          "Lorien Revealed",
          "Talrand's Insight",
        ],
      ]);
      await expect(body).toMatchFileSnapshot(
        "./__streams__/anthropic-reply.ndjson"
      );
    });

    it("streams the recorded OpenAI reply as the same events, labelled openai", async () => {
      vi.stubEnv("ANTHROPIC_API_KEY", "");
      vi.stubEnv("OPENAI_API_KEY", "test-openai-key");

      const { body, events } = await streamFor();

      expect(sent).toEqual([
        expect.objectContaining({
          url: OPENAI_CHAT_URL,
          credential: "Bearer test-openai-key",
          model: "gpt-4o-mini",
        }),
      ]);
      expect(events[0]?.event).toMatchObject({ provider: "openai" });
      await expect(body).toMatchFileSnapshot(
        "./__streams__/openai-reply.ndjson"
      );
    });

    it("streams the built-in suggestions without calling a model when no provider key is set", async () => {
      vi.stubEnv("ANTHROPIC_API_KEY", "");

      const { body, events } = await streamFor();

      expect(sent).toEqual([]);
      expect(events[0]?.event).toMatchObject({ provider: "mock" });
      await expect(body).toMatchFileSnapshot(
        "./__streams__/placeholder.ndjson"
      );
    });

    it("currently has the built-in suggestions add cards outside the deck's colours and cut its first four cards, Sol Ring first (pinned)", async () => {
      vi.stubEnv("ANTHROPIC_API_KEY", "");

      const { events } = await streamFor();

      expect(
        suggestionsOf(events)
          .filter(({ evidence }) => evidence.colorCompatible === false)
          .map(({ name }) => name)
      ).toEqual(["Swords to Plowshares", "Cultivate"]);
      expect(
        events.flatMap(({ event }) => {
          const removal = REMOVAL_EVENT.safeParse(event);
          return removal.success ? [removal.data.data.name] : [];
        })
      ).toEqual(["Sol Ring", "Arcane Signet", "Brainstorm", "Ponder"]);
    });

    it("asks Anthropic and never OpenAI when both keys are set", async () => {
      vi.stubEnv("OPENAI_API_KEY", "test-openai-key");

      await streamFor();

      expect(sent.map(({ url, credential }) => [url, credential])).toEqual([
        [ANTHROPIC_MESSAGES_URL, "test-anthropic-key"],
      ]);
    });

    it("currently drips each suggestion and removal 80 ms apart after the whole reply has arrived (pinned; see B2-53)", async () => {
      const { events } = await streamFor();

      expect(events.map(({ at }) => at)).toEqual([
        0, 80, 160, 240, 320, 400, 480, 560, 640, 720, 800, 880, 960, 960,
      ]);
    });

    it("reads, through the panel's stream reader, as the reply's analysis, suggestions and removals", async () => {
      const { body } = await streamFor();

      const { result, updates } = await readAsPanel(body);

      expect(result.provider).toBe("anthropic");
      expect(result.analysis).toMatch(/^Talrand wants a dense stream/);
      expect(result.suggestions.map(({ name }) => name)).toHaveLength(8);
      expect(result.removals).toHaveLength(4);
      // Published once for the analysis and once per suggestion and removal.
      expect(updates).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });
  });

  describe("replies the route does not check", () => {
    it("currently streams a removal the deck does not hold (pinned; see B2-32)", async () => {
      const { events } = await streamFor();

      const removed = events.flatMap(({ event }) => {
        const removal = REMOVAL_EVENT.safeParse(event);
        return removal.success ? [removal.data.data.name] : [];
      });
      expect(removed).toContain("Opt");
      expect(TALRAND_SUGGEST_REQUEST.cardNames).not.toContain("Opt");
    });

    it("currently leaves a suggestion unverified when its name differs from Scryfall's only by an accent (pinned)", async () => {
      const { events } = await streamFor();

      const lorien = suggestionsOf(events).find(
        ({ name }) => name === "Lorien Revealed"
      );
      expect(lorien?.evidence).toMatchObject({
        verified: false,
        colorCompatible: null,
      });
    });

    it("currently lets the client-sent colour identity decide whether a suggestion is blocked (pinned; see B2-32)", async () => {
      server.use(
        anthropicAnswers(
          JSON.stringify({
            analysis: "Copy every spell.",
            suggestions: [
              {
                name: "Thousand-Year Storm",
                reason: "Copies every later spell.",
                category: "winCondition",
                priority: "medium",
              },
            ],
            removals: [],
          })
        )
      );

      const monoBlue = suggestionsOf((await streamFor()).events);
      const claimedRed = suggestionsOf(
        (
          await streamFor({
            ...TALRAND_SUGGEST_REQUEST,
            colorIdentity: ["U", "R"],
          })
        ).events
      );

      expect(getSuggestionLegality(monoBlue[0]?.evidence)).toEqual({
        status: "blocked",
        reasons: ["colorIdentity"],
      });
      expect(getSuggestionLegality(claimedRed[0]?.evidence)).toEqual({
        status: "valid",
        reasons: [],
      });
    });

    it("currently streams a suggestion with no category or priority, which the panel's reader then drops (pinned; see B2-50)", async () => {
      server.use(
        anthropicAnswers(
          JSON.stringify({
            analysis: "One card.",
            suggestions: [{ name: "Swan Song", reason: "Protects Talrand." }],
            removals: [],
          })
        )
      );

      const { body, events } = await streamFor();

      expect(events[1]?.event).toEqual({
        type: "suggestion",
        data: {
          name: "Swan Song",
          reason: "Protects Talrand.",
          evidence: {
            synergy: "Protects Talrand.",
            manaValue: 1,
            curveImpact: "Below the deck average (1.91)",
            colorIdentity: ["U"],
            colorCompatible: true,
            commanderLegal: true,
            priceUsd: 9.8,
            verified: true,
          },
        },
      });
      expect((await readAsPanel(body)).result.suggestions).toEqual([]);
    });

    it("streams an empty analysis and done for a reply that is an empty object", async () => {
      server.use(anthropicAnswers("{}"));

      const { events } = await streamFor();

      expect(events.map(({ event }) => event)).toEqual([
        { type: "analysis", content: "", provider: "anthropic" },
        { type: "done" },
      ]);
    });

    it("keeps streaming with unverified evidence when Scryfall cannot be reached", async () => {
      vi.spyOn(logger, "error").mockImplementation(() => undefined);
      server.use(
        http.post(SCRYFALL_COLLECTION_URL, () =>
          HttpResponse.json({ object: "error" }, { status: 503 })
        )
      );

      const { events } = await streamFor();

      expect(typesOf(events).at(-1)).toBe("done");
      expect(
        suggestionsOf(events).every(({ evidence }) => !evidence.verified)
      ).toBe(true);
    });
  });

  // I-30 requirement 4.4: a reply the player cannot use gives the unit back.
  describe("replies with the wrong shape or without a usable entry", () => {
    it("gives the call back and streams the error when the reply's suggestions are not a list", async () => {
      const logError = vi
        .spyOn(logger, "error")
        .mockImplementation(() => undefined);
      server.use(anthropicAnswers(JSON.stringify({ suggestions: "Sol Ring" })));

      const { events } = await streamFor();

      expect(events.map(({ event }) => event)).toEqual([
        { type: "error", message: "AI suggestion failed" },
      ]);
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "Suggestion reply rejected: The AI returned suggestions that are not a list.",
        }),
        "POST /api/ai/suggest"
      );
      expect(scryfallAsked).toEqual([]);
      expect(db.aiUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          outcome: "rejectedByValidator",
          countsAgainstAllowance: false,
        }),
      });
      expect(db.usageCounter.updateMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ key: "ai.suggest" }),
          data: { used: { decrement: 1 } },
        })
      );
    });

    it("drops the suggestions and removals that name no card, streams the rest and counts the call", async () => {
      server.use(
        anthropicAnswers(
          JSON.stringify({
            analysis: "One card.",
            suggestions: [
              { reason: "Lost its name.", category: "draw", priority: "high" },
              {
                name: "",
                reason: "Blank.",
                category: "draw",
                priority: "high",
              },
              "Swan Song",
              {
                name: "Swan Song",
                reason: "Protects Talrand.",
                category: "protection",
                priority: "high",
                alternatives: [
                  { reason: "Nameless alternative.", dimension: "budget" },
                  { name: "Dispel", reason: "Cheaper.", dimension: "budget" },
                ],
              },
            ],
            removals: [
              { reason: "Nameless cut." },
              { name: "Opt", reason: "Low impact." },
            ],
          })
        )
      );

      const { events } = await streamFor();

      expect(typesOf(events)).toEqual([
        "analysis",
        "suggestion",
        "removal",
        "done",
      ]);
      expect(suggestionsOf(events).map(({ name }) => name)).toEqual([
        "Swan Song",
      ]);
      expect(scryfallAsked).toEqual([["Swan Song", "Dispel"]]);
      expect(db.aiUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          outcome: "ok",
          countsAgainstAllowance: true,
        }),
      });
    });

    it("gives the call back when no entry names a card and the reply has no analysis", async () => {
      vi.spyOn(logger, "error").mockImplementation(() => undefined);
      server.use(
        anthropicAnswers(
          JSON.stringify({
            suggestions: [{ reason: "Lost its name." }],
            removals: [],
          })
        )
      );

      const { events } = await streamFor();

      expect(events.map(({ event }) => event)).toEqual([
        { type: "error", message: "AI suggestion failed" },
      ]);
      expect(db.aiUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          outcome: "rejectedByValidator",
          countsAgainstAllowance: false,
        }),
      });
    });

    it("counts a reply that answers a why-card question with analysis alone", async () => {
      server.use(
        anthropicAnswers(
          JSON.stringify({
            analysis: "Sol Ring accelerates Talrand.",
            suggestions: [],
            removals: [],
          })
        )
      );

      const { events } = await streamFor({
        ...TALRAND_SUGGEST_REQUEST,
        question: { type: "why-card", cardName: "Sol Ring" },
      });

      expect(typesOf(events)).toEqual(["analysis", "done"]);
      expect(db.aiUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          outcome: "ok",
          countsAgainstAllowance: true,
        }),
      });
    });

    it("counts the recorded reply and streams every entry of it", async () => {
      const { events } = await streamFor();

      expect(typesOf(events)).toEqual([
        "analysis",
        ...Array(8).fill("suggestion"),
        ...Array(4).fill("removal"),
        "done",
      ]);
      expect(db.aiUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          outcome: "ok",
          countsAgainstAllowance: true,
        }),
      });
      // The reservation is the only counter write: nothing was given back.
      expect(db.usageCounter.updateMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("replies that end the stream with one error", () => {
    it.each([
      ["Anthropic", "max_tokens", "ModelOutputTruncatedError"],
      ["Anthropic", "refusal", "ModelRefusedError"],
      ["OpenAI", "length", "ModelOutputTruncatedError"],
      ["OpenAI", "content_filter", "ModelRefusedError"],
    ] as const)(
      "streams only the generic error for an %s reply that stopped with %s",
      async (provider, stopReason, errorName) => {
        const logError = vi
          .spyOn(logger, "error")
          .mockImplementation(() => undefined);
        if (provider === "OpenAI") {
          vi.stubEnv("ANTHROPIC_API_KEY", "");
          vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
        }
        server.use(
          provider === "Anthropic"
            ? modelProviderServes(ANTHROPIC_MESSAGES_URL, sent, () =>
                HttpResponse.json(
                  anthropicMessage(
                    SUGGEST_REPLY_TEXT_V1.slice(0, 400),
                    stopReason === "refusal" ? "refusal" : "max_tokens"
                  )
                )
              )
            : modelProviderServes(OPENAI_CHAT_URL, sent, () =>
                HttpResponse.json(
                  openAIChatCompletion(
                    SUGGEST_REPLY_TEXT_V1.slice(0, 400),
                    stopReason === "length" ? "length" : "content_filter"
                  )
                )
              )
        );

        const { events } = await streamFor();

        expect(events.map(({ event }) => event)).toEqual([
          { type: "error", message: "AI suggestion failed" },
        ]);
        expect(logError).toHaveBeenCalledWith(
          expect.objectContaining({ name: errorName }),
          "POST /api/ai/suggest"
        );
      }
    );
  });
});
