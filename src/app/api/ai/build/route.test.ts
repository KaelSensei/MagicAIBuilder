import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

/** The part of the Anthropic request body that carries the prompt. */
const PROVIDER_BODY = z.object({
  messages: z.array(z.object({ content: z.string() })).min(1),
});

/** The model and output-token cap the route sent to the provider. */
const SENT_CAP = z.object({ model: z.string(), max_tokens: z.number() });

const mocks = vi.hoisted(() => ({ requireAuth: vi.fn() }));
const db = await vi.hoisted(async () => {
  const { createAiUsageDb } = await import("@/test/ai-usage-db");
  return createAiUsageDb();
});

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => ({ allowed: true, retryAfterMs: 0 }),
}));
vi.mock("@/lib/db/prisma", () => ({ prisma: db }));

import { ALL_GENERATED_DECK_CARDS } from "@/lib/ai/fixtures/generated-deck-cards";
import { logger } from "@/lib/logger";
import {
  buildScryfallNameIndex,
  normalizeImportedName,
} from "@/lib/scryfall/name-index";
import { resetAiUsageDb } from "@/test/ai-usage-db";
import { POST } from "./route";

beforeEach(() => {
  resetAiUsageDb(db);
});

const SCRYFALL_COLLECTION = "https://api.scryfall.com/cards/collection";
const COLLECTION_REQUEST = z.object({
  identifiers: z.array(z.object({ name: z.string() })),
});
const CARD_DATA = buildScryfallNameIndex(ALL_GENERATED_DECK_CARDS);

/**
 * Answers Scryfall's collection endpoint with the fixture card data, as
 * Scryfall does: found cards in `data`, the rest in `not_found`.
 */
function answerCollection(init: RequestInit | undefined): Response {
  const { identifiers } = COLLECTION_REQUEST.parse(
    JSON.parse(String(init?.body))
  );
  const found = identifiers.flatMap(({ name }) => {
    const card = CARD_DATA.get(normalizeImportedName(name));
    return card ? [card] : [];
  });
  const notFound = identifiers.filter(
    ({ name }) => !CARD_DATA.has(normalizeImportedName(name))
  );
  return Response.json({ object: "list", not_found: notFound, data: found });
}

function buildRequest(bracket: number): Request {
  return new Request("http://localhost/api/ai/build", {
    method: "POST",
    body: JSON.stringify({
      budget: null,
      colors: ["G"],
      strategy: "Ramp",
      commanderName: null,
      bracket,
    }),
  });
}

/**
 * Posts a build request and returns the prompt the route sent to the model.
 * The provider answers 500, so the stream ends on an error event without a
 * decklist: only the prompt matters here.
 */
async function promptSentFor(bracket: number): Promise<string> {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response("{}", { status: 500 }));
  vi.stubGlobal("fetch", fetchMock);

  const response = await POST(buildRequest(bracket));
  await response.text();

  const body: unknown = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
  return PROVIDER_BODY.parse(body).messages.map(({ content }) => content).join("\n");
}

/**
 * Posts a build request answered by `reply` and returns the streamed events
 * with the model and output-token cap the route sent.
 */
async function buildAnsweredWith(
  reply: unknown
): Promise<{ events: unknown[]; sent: z.infer<typeof SENT_CAP> }> {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) =>
    String(input) === SCRYFALL_COLLECTION
      ? answerCollection(init)
      : Response.json(reply)
  );
  vi.stubGlobal("fetch", fetchMock);

  const response = await POST(buildRequest(2));
  const events = (await response.text())
    .trim()
    .split("\n")
    .map((line): unknown => JSON.parse(line));
  const body: unknown = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
  return { events, sent: SENT_CAP.parse(body) };
}

describe("POST /api/ai/build prompt", () => {
  beforeEach(() => {
    mocks.requireAuth.mockResolvedValue({
      session: { user: { id: "user-1" } },
      error: null,
    });
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.unstubAllGlobals();
  });

  it("tells the model that Bracket 2 allows no Game Changers", async () => {
    const prompt = await promptSentFor(2);

    expect(prompt).toContain("No Game Changers");
    expect(prompt).not.toMatch(/at most 1 game changer|0-1 game changers/i);
  });

  // WotC removed the tutor restriction from every bracket on 2025-10-21.
  it("does not forbid tutors at Bracket 1", async () => {
    const prompt = await promptSentFor(1);

    expect(prompt).not.toMatch(/no tutors/i);
    expect(prompt).toContain("Tutors are allowed unless they are Game Changers");
  });

  it.each([
    [1, "Exhibition", "at least 9 turns"],
    [2, "Core", "at least 8 turns"],
    [3, "Upgraded", "at least 6 turns"],
    [4, "Optimized", "at least 4 turns"],
    [5, "cEDH", "any turn"],
  ])("names Bracket %i as %s and states its turn floor", async (bracket, name, turns) => {
    const prompt = await promptSentFor(bracket);

    expect(prompt).toContain(`Bracket ${bracket} (${name})`);
    expect(prompt).toContain(turns);
  });

  it.each([
    [1, "No Game Changers"],
    [2, "No Game Changers"],
    [3, "Up to 3 Game Changers"],
    [4, "Unlimited Game Changers"],
    [5, "Unlimited Game Changers"],
  ])("states the Game Changer limit of Bracket %i", async (bracket, limit) => {
    expect(await promptSentFor(bracket)).toContain(limit);
  });

  it("keeps two-card combos out of Bracket 3 before turn 6, with no land denial or chained extra turns", async () => {
    const prompt = await promptSentFor(3);

    expect(prompt).toContain("No two-card combos (game-ending, lockout or infinite) before turn 6");
    expect(prompt).toContain("No mass land denial or chained extra turns");
  });
});

describe("POST /api/ai/build truncated reply", () => {
  beforeEach(() => {
    mocks.requireAuth.mockResolvedValue({
      session: { user: { id: "user-1" } },
      error: null,
    });
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports an Anthropic reply cut off at the token cap as a truncation, not a JSON parse error", async () => {
    const logError = vi.spyOn(logger, "error").mockImplementation(() => {});

    const { events, sent } = await buildAnsweredWith({
      stop_reason: "max_tokens",
      content: [{ type: "text", text: '{"commander": "Omnath", "cards": [' }],
    });

    expect(events).toEqual([
      { type: "status", message: "Thinking…" },
      { type: "status", message: "Consulting the AI oracle…" },
      { type: "error", message: "AI deck build failed" },
    ]);
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "ModelOutputTruncatedError",
        provider: "anthropic",
        model: sent.model,
        maxTokens: sent.max_tokens,
      }),
      "POST /api/ai/build"
    );
  });

  it("reports an OpenAI reply cut off at the token cap as a truncation, not a JSON parse error", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = "test-key";
    const logError = vi.spyOn(logger, "error").mockImplementation(() => {});

    const { events, sent } = await buildAnsweredWith({
      choices: [
        {
          finish_reason: "length",
          message: {
            role: "assistant",
            content: '{"commander": "Omnath", "cards": [',
          },
        },
      ],
    });

    expect(events).toEqual([
      { type: "status", message: "Thinking…" },
      { type: "status", message: "Consulting the AI oracle…" },
      { type: "error", message: "AI deck build failed" },
    ]);
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "ModelOutputTruncatedError",
        provider: "openai",
        model: sent.model,
        maxTokens: sent.max_tokens,
      }),
      "POST /api/ai/build"
    );
  });
});

describe("POST /api/ai/build card-data check", () => {
  /**
   * Answers the provider call with `reply` and Scryfall's collection endpoint
   * with the fixture card data, as Scryfall does: found cards in `data`, the
   * rest in `not_found`.
   */
  function stubProviderAndCardData(reply: unknown) {
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      if (String(input) === SCRYFALL_COLLECTION) {
        return answerCollection(init);
      }
      return Response.json({
        stop_reason: "end_turn",
        content: [{ type: "text", text: JSON.stringify(reply) }],
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  async function eventsFor(
    reply: unknown
  ): Promise<{ events: unknown[]; cardDataCalls: number }> {
    const fetchMock = stubProviderAndCardData(reply);
    const response = await POST(buildRequest(2));
    const events = (await response.text())
      .trim()
      .split("\n")
      .map((line): unknown => JSON.parse(line));
    const cardDataCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).startsWith("https://api.scryfall.com")
    ).length;
    return { events, cardDataCalls };
  }

  const STREAMED_CARD = z.object({ type: z.literal("card"), name: z.string() });

  beforeEach(() => {
    mocks.requireAuth.mockResolvedValue({
      session: { user: { id: "user-1" } },
      error: null,
    });
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("never streams an off-identity or unknown card, and flags each removal on the done event", async () => {
    const { events, cardDataCalls } = await eventsFor({
      commander: "Talrand, Sky Summoner",
      partner: null,
      cards: [
        { name: "Lightning Bolt", quantity: 1, category: "removal" },
        { name: "Totally Real Card", quantity: 1, category: "draw" },
        { name: "Counterspell", quantity: 1, category: "removal" },
        { name: "Island", quantity: 96, category: "land" },
      ],
    });

    const streamed = events.flatMap((event) => {
      const card = STREAMED_CARD.safeParse(event);
      return card.success ? [card.data.name] : [];
    });
    expect(streamed).toEqual(["Counterspell", "Island"]);
    expect(events.at(-1)).toEqual({
      type: "done",
      totalCards: 99,
      source: "ai",
      corrections: [
        {
          action: "removed",
          name: "Lightning Bolt",
          quantity: 1,
          reason: "outside_color_identity",
        },
        {
          action: "removed",
          name: "Totally Real Card",
          quantity: 1,
          reason: "unknown_card",
        },
        {
          action: "added",
          name: "Island",
          quantity: 2,
          reason: "fill_to_size",
        },
      ],
    });
    // One collection request resolves the whole list.
    expect(cardDataCalls).toBe(1);
  });

  it("rejects a reply whose commander cannot lead a deck, before any card is streamed", async () => {
    const logError = vi.spyOn(logger, "error").mockImplementation(() => {});

    const { events } = await eventsFor({
      commander: "Grizzly Bears",
      partner: null,
      cards: [{ name: "Forest", quantity: 99, category: "land" }],
    });

    expect(events).toEqual([
      { type: "status", message: "Thinking…" },
      { type: "status", message: "Consulting the AI oracle…" },
      { type: "error", message: "AI deck build failed" },
    ]);
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Grizzly Bears cannot be a commander"),
      }),
      "POST /api/ai/build"
    );
  });
});

/** A legal decklist: 99 basics behind a commander the fixture card data knows. */
const VALID_DECK = {
  commander: "Wilson, Refined Grizzly",
  partner: null,
  cards: [{ name: "Forest", quantity: 99, category: "land" }],
};

/** Usage of a typical build on Haiku 4.5: 8,700 micro-dollars. */
const BUILD_USAGE = {
  input_tokens: 1_200,
  output_tokens: 1_500,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
};

describe("POST /api/ai/build monthly allowance and metering", () => {
  beforeEach(() => {
    mocks.requireAuth.mockResolvedValue({
      session: { user: { id: "user-1" } },
      error: null,
    });
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("answers 429 with the reset date and never calls the model once the month's builds are used up", async () => {
    vi.useFakeTimers({
      now: new Date("2026-11-09T12:00:00.000Z"),
      toFake: ["Date"],
    });
    db.usageCounter.updateMany.mockResolvedValue({ count: 0 });
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(buildRequest(2));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("1857600");
    await expect(response.json()).resolves.toEqual({
      error: "Monthly AI allowance used up",
      code: "allowance_exhausted",
      route: "build",
      limit: 10,
      resetsAt: "2026-12-01T00:00:00.000Z",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 503 and never calls the model once the month's spend reached the ceiling", async () => {
    vi.useFakeTimers({
      now: new Date("2026-11-09T12:00:00.000Z"),
      toFake: ["Date"],
    });
    db.aiMonthlySpend.findUnique.mockResolvedValue({
      periodStart: new Date("2026-11-01T00:00:00.000Z"),
      spentMicroUsd: BigInt(20_000_000),
    });
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(buildRequest(2));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "AI is paused until the monthly budget resets",
      code: "ai_spend_ceiling_reached",
      resetsAt: "2026-12-01T00:00:00.000Z",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(db.usageCounter.updateMany).not.toHaveBeenCalled();
  });

  it("records the build's tokens and cost from the reply's usage and keeps the unit", async () => {
    const { events } = await buildAnsweredWith({
      stop_reason: "end_turn",
      content: [{ type: "text", text: JSON.stringify(VALID_DECK) }],
      usage: BUILD_USAGE,
    });

    expect(events.at(-1)).toEqual({
      type: "done",
      totalCards: 99,
      source: "ai",
      corrections: [],
    });
    expect(db.aiUsage.create).toHaveBeenCalledTimes(1);
    expect(db.aiUsage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        route: "build",
        provider: "anthropic",
        model: "claude-haiku-4-5",
        inputTokens: 1_200,
        outputTokens: 1_500,
        stopReason: "end_turn",
        outcome: "ok",
        costMicroUsd: 8_700,
        countsAgainstAllowance: true,
      }),
    });
    // The claim is the only counter write: nothing is given back.
    expect(db.usageCounter.updateMany).toHaveBeenCalledTimes(1);
    expect(db.usageCounter.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { used: { increment: 1 } } })
    );
  });

  it("records the billed tokens of a reply cut off at the cap and gives the build back", async () => {
    vi.spyOn(logger, "error").mockImplementation(() => {});

    const { events } = await buildAnsweredWith({
      stop_reason: "max_tokens",
      content: [{ type: "text", text: '{"commander": "Omnath", "cards": [' }],
      usage: { input_tokens: 900, output_tokens: 4_096 },
    });

    expect(events.at(-1)).toEqual({
      type: "error",
      message: "AI deck build failed",
    });
    expect(db.aiUsage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        outcome: "truncated",
        stopReason: "max_tokens",
        inputTokens: 900,
        outputTokens: 4_096,
        costMicroUsd: 900 + 4_096 * 5,
        countsAgainstAllowance: false,
      }),
    });
    expect(db.usageCounter.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { used: { decrement: 1 } } })
    );
  });

  it("records a deck the validator rejects and gives the build back", async () => {
    vi.spyOn(logger, "error").mockImplementation(() => {});

    await buildAnsweredWith({
      stop_reason: "end_turn",
      content: [
        {
          type: "text",
          text: JSON.stringify({
            ...VALID_DECK,
            // Deck size is checked later, with card data; the shape check
            // still rejects a quantity below one.
            cards: [{ name: "Forest", quantity: 0, category: "land" }],
          }),
        },
      ],
      usage: BUILD_USAGE,
    });

    expect(db.aiUsage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        outcome: "rejectedByValidator",
        costMicroUsd: 8_700,
        countsAgainstAllowance: false,
      }),
    });
    expect(db.usageCounter.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { used: { decrement: 1 } } })
    );
  });

  it("records a provider HTTP error at zero tokens and gives the build back", async () => {
    vi.spyOn(logger, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => new Response("{}", { status: 529 }))
    );

    await (await POST(buildRequest(2))).text();

    expect(db.aiUsage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        outcome: "providerError",
        inputTokens: 0,
        outputTokens: 0,
        costMicroUsd: 0,
        countsAgainstAllowance: false,
      }),
    });
    expect(db.usageCounter.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { used: { decrement: 1 } } })
    );
  });

  it("answers with the placeholder deck at zero cost without reserving a build when no provider key is set", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const events = (await (await POST(buildRequest(2))).text())
      .trim()
      .split("\n")
      .map((line): unknown => JSON.parse(line));

    expect(events.at(-1)).toEqual(
      expect.objectContaining({ type: "done", source: "demo" })
    );
    expect(db.usageCounter.updateMany).not.toHaveBeenCalled();
    expect(db.aiUsage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "placeholder",
        outcome: "ok",
        costMicroUsd: 0,
        countsAgainstAllowance: false,
      }),
    });
  });
});
