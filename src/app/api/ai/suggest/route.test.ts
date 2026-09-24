import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { playtestSession: { findMany: mocks.findMany } },
}));
vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => ({ allowed: true, retryAfterMs: 0 }),
}));

import { POST } from "./route";

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
});
