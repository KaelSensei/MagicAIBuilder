import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

/** The part of the Anthropic request body that carries the prompt. */
const PROVIDER_BODY = z.object({
  messages: z.array(z.object({ content: z.string() })).min(1),
});

const mocks = vi.hoisted(() => ({ requireAuth: vi.fn() }));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => ({ allowed: true, retryAfterMs: 0 }),
}));

import { POST } from "./route";

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
