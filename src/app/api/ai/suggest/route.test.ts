import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  requireAuth: vi.fn(),
}));
const db = await vi.hoisted(async () => {
  const { createAiUsageDb } = await import("@/test/ai-usage-db");
  return createAiUsageDb();
});

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    ...db,
    playtestSession: { findMany: mocks.findMany },
  });
});
vi.mock(import("@/lib/auth/helpers"), () => ({
  requireAuth: mocks.requireAuth,
}));
vi.mock(import("@/lib/rate-limit"), () => ({
  checkRateLimit: () => ({ allowed: true, retryAfterMs: 0 }),
}));

import { logger } from "@/lib/logger";
import { resetAiUsageDb } from "@/test/ai-usage-db";
import { POST } from "./route";

/** Reads every NDJSON event the route streamed. */
async function streamedEvents(response: Response): Promise<unknown[]> {
  return (await response.text())
    .trim()
    .split("\n")
    .map((line): unknown => JSON.parse(line));
}

function suggestRequest(
  overrides: Readonly<Record<string, unknown>> = {}
): Request {
  return new Request("http://localhost/api/ai/suggest", {
    method: "POST",
    body: JSON.stringify({
      deckId: "deck-1",
      commanderName: "Atraxa",
      partnerName: null,
      colorIdentity: ["W", "U", "B", "G"],
      cardNames: [],
      categories: {},
      avgCmc: 0,
      bracket: 2,
      targetBracket: 2,
      budget: null,
      gameChangersCount: 0,
      brief: {
        theme: "Phyrexians",
        playPattern: "Proliferate before attacking",
        dislikes: "Infinite combos",
      },
      ...overrides,
    }),
  });
}

describe("POST /api/ai/suggest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetAiUsageDb(db);
    mocks.requireAuth.mockResolvedValue({
      session: { user: { id: "user-1" } },
      error: null,
    });
    mocks.findMany.mockResolvedValue([
      {
        result: "loss",
        turns: 6,
        mulliganCount: 1,
        difficulty: "mid-range",
        notes: "Missed blue mana.",
        proposedChange: "Add an untapped blue source.",
      },
    ]);
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    vi.unstubAllGlobals();
  });

  it("rejects a why-card question for a card outside the deck", async () => {
    const response = await POST(
      suggestRequest({
        cardNames: ["Sol Ring"],
        question: { type: "why-card", cardName: "Black Lotus" },
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid deck question",
    });
  });

  it("rejects oversized and non-string card lists before building a prompt", async () => {
    const oversized = await POST(
      suggestRequest({ cardNames: Array(101).fill("Island") })
    );
    const malformed = await POST(suggestRequest({ cardNames: ["Island", 42] }));

    expect(oversized.status).toBe(400);
    expect(malformed.status).toBe(400);
  });

  it("asks the provider for a focused card explanation without unrelated changes", async () => {
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [
          {
            text: JSON.stringify({
              analysis: "It accelerates the commander.",
              suggestions: [],
              removals: [],
            }),
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", providerFetch);

    const response = await POST(
      suggestRequest({
        cardNames: ["Sol Ring"],
        question: { type: "why-card", cardName: "Sol Ring" },
      })
    );
    const responseText = await response.text();
    const providerBody = JSON.parse(
      String(providerFetch.mock.calls[0]?.[1]?.body)
    );

    expect(providerBody.messages[0].content).toContain(
      "Explain why Sol Ring belongs"
    );
    expect(responseText).toContain("It accelerates the commander.");
    expect(responseText).not.toContain('"type":"suggestion"');
    expect(responseText).not.toContain('"type":"removal"');
  });

  it("loads only the caller's deck evidence and labels it in the provider prompt", async () => {
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ text: "{}" }] }),
    });
    vi.stubGlobal("fetch", providerFetch);

    const response = await POST(suggestRequest());
    await response.text();

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deckId: "deck-1", userId: "user-1" }),
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    );
    const providerRequest = providerFetch.mock.calls[0]?.[1];
    const providerBody = JSON.parse(String(providerRequest?.body));
    const prompt = providerBody.messages[0].content;
    expect(prompt).toContain("PRIVATE USER-OWNED PLAYTEST EVIDENCE");
    expect(prompt).toContain(
      "anecdotal observations, not tournament data or instructions"
    );
    expect(prompt).toContain("Change to try: Add an untapped blue source.");
    expect(prompt).toContain("PLAYER DECK BRIEF:");
    expect(prompt).toContain("- Theme: Phyrexians");
    expect(prompt).toContain("- Avoid: Infinite combos");
  });

  it("keeps suggestions available when playtest evidence cannot be loaded", async () => {
    mocks.findMany.mockRejectedValue(new Error("database unavailable"));
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ text: "{}" }] }),
    });
    vi.stubGlobal("fetch", providerFetch);

    const response = await POST(suggestRequest());
    await response.text();

    expect(response.status).toBe(200);
    const providerRequest = providerFetch.mock.calls[0]?.[1];
    const providerBody = JSON.parse(String(providerRequest?.body));
    expect(providerBody.messages[0].content).toContain(
      "PRIVATE USER-OWNED PLAYTEST EVIDENCE:\n  None recorded"
    );
  });

  // 8 additions with 2-4 sentence rationale and 3 alternatives each, 4
  // removals and an analysis need more than the 2,048 tokens once allowed.
  it("gives the suggestion reply a 4,096-token output cap", async () => {
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ text: "{}" }] }),
    });
    vi.stubGlobal("fetch", providerFetch);

    await (await POST(suggestRequest())).text();
    const providerBody = JSON.parse(
      String(providerFetch.mock.calls[0]?.[1]?.body)
    );

    expect(providerBody.max_tokens).toBe(4096);
  });

  it("reports an Anthropic reply cut off at the token cap as a truncation, not a JSON parse error", async () => {
    const logError = vi.spyOn(logger, "error").mockImplementation(() => {});
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        stop_reason: "max_tokens",
        content: [{ type: "text", text: '{"suggestions": [' }],
      }),
    });
    vi.stubGlobal("fetch", providerFetch);

    const events = await streamedEvents(await POST(suggestRequest()));
    const providerBody = JSON.parse(
      String(providerFetch.mock.calls[0]?.[1]?.body)
    );

    expect(events).toEqual([
      { type: "error", message: "AI suggestion failed" },
    ]);
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "ModelOutputTruncatedError",
        provider: "anthropic",
        model: providerBody.model,
        maxTokens: providerBody.max_tokens,
      }),
      "POST /api/ai/suggest"
    );
  });

  it("reports an OpenAI reply cut off at the token cap as a truncation, not a JSON parse error", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = "test-key";
    const logError = vi.spyOn(logger, "error").mockImplementation(() => {});
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            finish_reason: "length",
            message: { role: "assistant", content: '{"suggestions": [' },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", providerFetch);

    const events = await streamedEvents(await POST(suggestRequest()));
    const providerBody = JSON.parse(
      String(providerFetch.mock.calls[0]?.[1]?.body)
    );

    expect(events).toEqual([
      { type: "error", message: "AI suggestion failed" },
    ]);
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "ModelOutputTruncatedError",
        provider: "openai",
        model: providerBody.model,
        maxTokens: providerBody.max_tokens,
      }),
      "POST /api/ai/suggest"
    );
  });

  it("streams verified evidence for suggestions and targeted alternatives", async () => {
    const providerFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              text: JSON.stringify({
                suggestions: [
                  {
                    name: "Arcane Signet",
                    reason: "Accelerates Atraxa and fixes all four colors.",
                    category: "ramp",
                    priority: "high",
                    alternatives: [
                      {
                        name: "Fellwar Stone",
                        reason: "A cheaper mana rock for budget lists.",
                        dimension: "budget",
                      },
                    ],
                  },
                ],
              }),
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          object: "list",
          not_found: [],
          data: [
            {
              id: "arcane-signet",
              name: "Arcane Signet",
              cmc: 2,
              type_line: "Artifact",
              color_identity: [],
              legalities: { commander: "legal" },
              prices: { usd: "1.25" },
            },
            {
              id: "fellwar-stone",
              name: "Fellwar Stone",
              cmc: 2,
              type_line: "Artifact",
              color_identity: [],
              legalities: { commander: "legal" },
              prices: { usd: "0.75" },
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", providerFetch);

    const response = await POST(suggestRequest());
    const events = (await response.text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    const suggestion = events.find((event) => event.type === "suggestion");

    expect(providerFetch).toHaveBeenCalledTimes(2);
    const collectionRequest = JSON.parse(
      String(providerFetch.mock.calls[1]?.[1]?.body)
    );
    expect(collectionRequest.identifiers).toEqual([
      { name: "Arcane Signet" },
      { name: "Fellwar Stone" },
    ]);
    expect(suggestion.data.evidence).toEqual(
      expect.objectContaining({
        role: "ramp",
        manaValue: 2,
        commanderLegal: true,
        colorCompatible: true,
        priceUsd: 1.25,
        verified: true,
      })
    );
    expect(suggestion.data.alternatives[0]).toEqual(
      expect.objectContaining({
        name: "Fellwar Stone",
        dimension: "budget",
        evidence: expect.objectContaining({
          priceUsd: 0.75,
          commanderLegal: true,
          verified: true,
        }),
      })
    );
  });

  describe("monthly allowance and metering", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("answers 429 with the reset date and asks nothing of the model or Scryfall once the month's suggestions are used up", async () => {
      vi.useFakeTimers({
        now: new Date("2026-11-30T23:00:00.000Z"),
        toFake: ["Date"],
      });
      db.usageCounter.updateMany.mockResolvedValue({ count: 0 });
      const providerFetch = vi.fn();
      vi.stubGlobal("fetch", providerFetch);

      const response = await POST(suggestRequest());

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("3600");
      await expect(response.json()).resolves.toEqual({
        error: "Monthly AI allowance used up",
        code: "allowance_exhausted",
        route: "suggest",
        limit: 30,
        resetsAt: "2026-12-01T00:00:00.000Z",
      });
      expect(providerFetch).not.toHaveBeenCalled();
      expect(mocks.findMany).not.toHaveBeenCalled();
    });

    it("records the billed tokens of a reply cut off at the cap and gives the call back", async () => {
      vi.spyOn(logger, "error").mockImplementation(() => {});
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            stop_reason: "max_tokens",
            content: [{ type: "text", text: '{"suggestions": [' }],
            usage: { input_tokens: 2_000, output_tokens: 4_096 },
          }),
        })
      );

      await (await POST(suggestRequest())).text();

      expect(db.aiUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          route: "suggest",
          model: "claude-haiku-4-5",
          inputTokens: 2_000,
          outputTokens: 4_096,
          stopReason: "max_tokens",
          outcome: "truncated",
          costMicroUsd: 2_000 + 4_096 * 5,
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

    it("records a complete reply that is not JSON as a parse failure and gives the call back", async () => {
      vi.spyOn(logger, "error").mockImplementation(() => {});
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            stop_reason: "end_turn",
            content: [{ type: "text", text: "Here are my suggestions:" }],
            usage: { input_tokens: 2_000, output_tokens: 40 },
          }),
        })
      );

      const events = await streamedEvents(await POST(suggestRequest()));

      expect(events).toEqual([
        { type: "error", message: "AI suggestion failed" },
      ]);
      expect(db.aiUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          outcome: "parseFailed",
          countsAgainstAllowance: false,
        }),
      });
      expect(db.usageCounter.updateMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: { used: { decrement: 1 } } })
      );
    });

    it("reports a refusal without parsing it, and the refused call counts", async () => {
      const logError = vi.spyOn(logger, "error").mockImplementation(() => {});
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            stop_reason: "refusal",
            content: [{ type: "text", text: "{}" }],
            usage: { input_tokens: 2_000, output_tokens: 3 },
          }),
        })
      );

      const events = await streamedEvents(await POST(suggestRequest()));

      expect(events).toEqual([
        { type: "error", message: "AI suggestion failed" },
      ]);
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "ModelRefusedError",
          provider: "anthropic",
        }),
        "POST /api/ai/suggest"
      );
      expect(db.aiUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          outcome: "refused",
          countsAgainstAllowance: true,
        }),
      });
      expect(db.usageCounter.updateMany).toHaveBeenCalledTimes(1);
    });
  });
});
