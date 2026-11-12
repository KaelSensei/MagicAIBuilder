// @vitest-environment node
/**
 * Golden event streams of `POST /api/ai/build` (master plan P1-18): the exact
 * NDJSON the deck wizard receives for recorded provider replies, the order in
 * which the route falls back from Anthropic to OpenAI to its placeholder
 * deck, and the replies that end the stream with an error.
 *
 * Each golden stream is approved as a file in `__streams__/`, one event per
 * line. The real route runs with only Auth.js's `auth()` and Prisma mocked
 * (ADR 0005 rule 5); MSW serves the providers and Scryfall, whose card data
 * decides what the server keeps of the model's list.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import {
  BUILD_REPLY_FENCED_TEXT_V1,
  BUILD_REPLY_TEXT_V1,
} from "@/lib/ai/fixtures/build-reply-v1";
import { ALL_GENERATED_DECK_CARDS } from "@/lib/ai/fixtures/generated-deck-cards";
import {
  anthropicMessage,
  openAIChatCompletion,
} from "@/lib/ai/fixtures/provider-envelopes-v1";
import { TALRAND_BUILD_REQUEST } from "@/lib/ai/fixtures/talrand-requests";
import { logger } from "@/lib/logger";
import type { ScryfallCard } from "@/lib/scryfall/types";
import {
  modelProviderServes,
  readNdjsonEvents,
  SCRYFALL_COLLECTION_URL,
  scryfallCollectionServes,
  type SentModelRequest,
} from "@/test/ai-route-msw";
import { resetAiUsageDb } from "@/test/ai-usage-db";
import { setupMsw } from "@/test/msw";
import { mockDeck } from "./mock-deck";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

const fake = vi.hoisted(() => ({ auth: vi.fn(), findUser: vi.fn() }));
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
  });
});

import { POST } from "./route";

/** The status lines every model build streams before the reply arrives. */
const MODEL_STATUS = [
  { type: "status", message: "Thinking…" },
  { type: "status", message: "Consulting the AI oracle…" },
] as const;

const BUILD_FAILED = {
  type: "error",
  message: "AI deck build failed",
} as const;

let player = 0;
const sent: SentModelRequest[] = [];

function buildRequest(
  body: unknown = TALRAND_BUILD_REQUEST,
  headers: Readonly<Record<string, string>> = {}
): Request {
  return new Request("http://localhost/api/ai/build", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

/** The provider answering every request with the model text `reply`. */
function anthropicAnswers(reply: string) {
  return modelProviderServes(ANTHROPIC_MESSAGES_URL, sent, () =>
    HttpResponse.json(anthropicMessage(reply))
  );
}

/**
 * Card data for the placeholder deck: the fixture cards, and every other
 * staple as a legal colourless artifact, since the fixture holds only the
 * cards the legality suites need.
 */
function placeholderCardData(): readonly ScryfallCard[] {
  const known = new Set(ALL_GENERATED_DECK_CARDS.map(({ name }) => name));
  const staples = mockDeck(TALRAND_BUILD_REQUEST)
    .cards.filter(({ name }) => !known.has(name))
    .map(({ name }) => ({
      id: name.toLowerCase().replaceAll(/\W+/g, "-"),
      name,
      cmc: 0,
      type_line: "Artifact",
      color_identity: [],
      legalities: { commander: "legal" },
    }));
  return [...ALL_GENERATED_DECK_CARDS, ...staples];
}

describe("POST /api/ai/build event stream", () => {
  const server = setupMsw(
    anthropicAnswers(BUILD_REPLY_FENCED_TEXT_V1),
    modelProviderServes(OPENAI_CHAT_URL, sent, () =>
      HttpResponse.json(openAIChatCompletion(BUILD_REPLY_TEXT_V1))
    ),
    scryfallCollectionServes(ALL_GENERATED_DECK_CARDS)
  );

  beforeEach(() => {
    // A new player per test keeps the real rate limiter's window empty.
    player += 1;
    const playerId = `player-${player}`;
    sent.length = 0;
    resetAiUsageDb(db);
    fake.auth.mockReset().mockResolvedValue({
      user: { id: playerId },
      expires: "2099-01-01T00:00:00.000Z",
    });
    fake.findUser.mockReset().mockResolvedValue({ id: playerId });
    vi.stubEnv("PLAYWRIGHT_TEST", "0");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
    vi.stubEnv("OPENAI_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("golden streams", () => {
    it("streams the recorded reply as status lines, the commander, the checked cards and done with every correction", async () => {
      const response = await POST(buildRequest());
      const body = await response.text();
      const events = await readNdjsonEvents(new Response(body));

      expect(events.slice(0, 2)).toEqual(MODEL_STATUS);
      expect(events.at(-1)).toEqual({
        type: "done",
        totalCards: 99,
        source: "ai",
        corrections: [
          {
            action: "removed",
            name: "Counterspell",
            quantity: 1,
            reason: "extra_copies",
          },
          {
            action: "removed",
            name: "Lightning Bolt",
            quantity: 1,
            reason: "outside_color_identity",
          },
          {
            action: "removed",
            name: "Mana Crypt",
            quantity: 1,
            reason: "banned",
          },
          {
            action: "removed",
            name: "Talrand's Invocation",
            quantity: 1,
            reason: "unknown_card",
          },
          {
            action: "added",
            name: "Island",
            quantity: 4,
            reason: "fill_to_size",
          },
        ],
      });
      await expect(body).toMatchFileSnapshot(
        "./__streams__/model-reply.ndjson"
      );
    });

    it("streams the same events for the Anthropic reply in a markdown fence and the OpenAI reply without one", async () => {
      const fromAnthropic = await readNdjsonEvents(await POST(buildRequest()));
      vi.stubEnv("ANTHROPIC_API_KEY", "");
      vi.stubEnv("OPENAI_API_KEY", "test-openai-key");

      const fromOpenAI = await readNdjsonEvents(await POST(buildRequest()));

      expect(sent.map(({ url, credential }) => [url, credential])).toEqual([
        [ANTHROPIC_MESSAGES_URL, "test-anthropic-key"],
        [OPENAI_CHAT_URL, "Bearer test-openai-key"],
      ]);
      expect(fromOpenAI).toEqual(fromAnthropic);
    });

    it("streams the placeholder deck as a demo, without the oracle status line, when no provider key is set", async () => {
      vi.stubEnv("ANTHROPIC_API_KEY", "");
      server.use(scryfallCollectionServes(placeholderCardData()));

      const body = await (await POST(buildRequest())).text();
      const events = await readNdjsonEvents(new Response(body));

      expect(sent).toEqual([]);
      expect(events.slice(0, 3)).toEqual([
        { type: "status", message: "Thinking…" },
        { type: "commander", name: "Talrand, Sky Summoner" },
        { type: "status", message: "Building card list…" },
      ]);
      expect(events.at(-1)).toEqual({
        type: "done",
        totalCards: 99,
        source: "demo",
        corrections: [],
      });
      await expect(body).toMatchFileSnapshot(
        "./__streams__/placeholder.ndjson"
      );
    });

    it("asks Anthropic and never OpenAI when both keys are set", async () => {
      vi.stubEnv("OPENAI_API_KEY", "test-openai-key");

      await (await POST(buildRequest())).text();

      expect(sent.map(({ url }) => url)).toEqual([ANTHROPIC_MESSAGES_URL]);
    });

    it("currently streams the partner after every card, as a card in the commander category (pinned)", async () => {
      server.use(
        anthropicAnswers(
          JSON.stringify({
            commander: "Tymna the Weaver",
            partner: "Thrasios, Triton Hero",
            cards: [
              { name: "Sol Ring", quantity: 1, category: "ramp" },
              { name: "Island", quantity: 97, category: "land" },
            ],
          })
        )
      );

      const events = await readNdjsonEvents(await POST(buildRequest()));

      expect(events).toEqual([
        ...MODEL_STATUS,
        { type: "commander", name: "Tymna the Weaver" },
        { type: "status", message: "Building card list…" },
        { type: "card", name: "Sol Ring", category: "ramp", quantity: 1 },
        { type: "card", name: "Island", category: "land", quantity: 97 },
        {
          type: "card",
          name: "Thrasios, Triton Hero",
          category: "commander",
          quantity: 1,
        },
        { type: "done", totalCards: 99, source: "ai", corrections: [] },
      ]);
    });

    it("currently streams English status lines to a French interface (pinned; see B2-55)", async () => {
      const events = await readNdjsonEvents(
        await POST(
          buildRequest(TALRAND_BUILD_REQUEST, {
            "accept-language": "fr-FR,fr;q=0.9",
            cookie: "NEXT_LOCALE=fr",
          })
        )
      );

      expect(events.slice(0, 2)).toEqual(MODEL_STATUS);
      expect(events).toContainEqual({
        type: "status",
        message: "Building card list…",
      });
    });
  });

  describe("replies that end the stream with one error", () => {
    it.each([
      ["Anthropic", "max_tokens", "ModelOutputTruncatedError"],
      ["Anthropic", "refusal", "ModelRefusedError"],
      ["OpenAI", "length", "ModelOutputTruncatedError"],
      ["OpenAI", "content_filter", "ModelRefusedError"],
    ] as const)(
      "streams the status lines then the generic error for an %s reply that stopped with %s",
      async (provider, stopReason, errorName) => {
        const logError = vi
          .spyOn(logger, "error")
          .mockImplementation(() => undefined);
        if (provider === "OpenAI") {
          vi.stubEnv("ANTHROPIC_API_KEY", "");
          vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
        }
        const cutReply = BUILD_REPLY_TEXT_V1.slice(0, 300);
        server.use(
          provider === "Anthropic"
            ? modelProviderServes(ANTHROPIC_MESSAGES_URL, sent, () =>
                HttpResponse.json(
                  anthropicMessage(
                    cutReply,
                    stopReason === "refusal" ? "refusal" : "max_tokens"
                  )
                )
              )
            : modelProviderServes(OPENAI_CHAT_URL, sent, () =>
                HttpResponse.json(
                  openAIChatCompletion(
                    cutReply,
                    stopReason === "length" ? "length" : "content_filter"
                  )
                )
              )
        );

        const events = await readNdjsonEvents(await POST(buildRequest()));

        expect(events).toEqual([...MODEL_STATUS, BUILD_FAILED]);
        expect(logError).toHaveBeenCalledWith(
          expect.objectContaining({ name: errorName }),
          "POST /api/ai/build"
        );
      }
    );

    it("streams the status lines then the generic error for a list with a zero quantity", async () => {
      const logError = vi
        .spyOn(logger, "error")
        .mockImplementation(() => undefined);
      server.use(
        anthropicAnswers(
          JSON.stringify({
            commander: "Talrand, Sky Summoner",
            partner: null,
            cards: [{ name: "Island", quantity: 0, category: "land" }],
          })
        )
      );

      const events = await readNdjsonEvents(await POST(buildRequest()));

      expect(events).toEqual([...MODEL_STATUS, BUILD_FAILED]);
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Generated deck rejected: Island has an invalid quantity.",
        }),
        "POST /api/ai/build"
      );
    });

    it("never streams a list Scryfall could not check", async () => {
      vi.spyOn(logger, "error").mockImplementation(() => undefined);
      server.use(
        http.post(SCRYFALL_COLLECTION_URL, () =>
          HttpResponse.json({ object: "error" }, { status: 503 })
        )
      );

      const events = await readNdjsonEvents(await POST(buildRequest()));

      expect(events).toEqual([...MODEL_STATUS, BUILD_FAILED]);
    });
  });
});
