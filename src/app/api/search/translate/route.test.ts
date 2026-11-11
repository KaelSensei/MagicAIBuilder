import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const allow = ():
    | { readonly allowed: true }
    | { readonly allowed: false; readonly retryAfterMs: number } => ({ allowed: true });
  return {
    requireAuth: vi.fn(),
    checkRateLimit: vi.fn(allow),
    reserve: vi.fn(),
    callModelMetered: vi.fn(),
    modelText: '{"query":"t:instant o:\\"draw a card\\" legal:vintage"}',
  };
});

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/lib/ai/usage/route-gate", () => ({ reserveAiCallForRoute: mocks.reserve }));
vi.mock("@/lib/ai/metered-model", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai/metered-model")>("@/lib/ai/metered-model");
  return { ...actual, callModelMetered: mocks.callModelMetered };
});

import { GET, POST } from "./route";

const BODY = {
  description: "a cheap instant that draws cards",
  locale: "en",
  format: "commander",
  colorIdentity: ["G", "U"],
  enforceColorIdentity: true,
  applyContext: true,
};

function post(body: unknown = BODY): Request {
  return new Request("http://localhost/api/search/translate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/search/translate", () => {
  beforeEach(() => {
    mocks.requireAuth.mockResolvedValue({ session: { user: { id: "user-1" } }, error: null });
    mocks.checkRateLimit.mockReturnValue({ allowed: true });
    mocks.reserve.mockResolvedValue({ ok: true, ticket: { userId: "user-1", route: "translate" } });
    mocks.modelText = '{"query":"t:instant o:\\"draw a card\\" legal:vintage"}';
    mocks.callModelMetered.mockImplementation(
      async (request: { prompt: string; interpret: (text: string) => { ok: boolean; value?: string; error?: Error } }) => {
        const interpreted = request.interpret(mocks.modelText);
        if (!interpreted.ok) throw interpreted.error ?? new Error("invalid");
        return interpreted.value;
      }
    );
    process.env.ANTHROPIC_API_KEY = "test-key";
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    vi.clearAllMocks();
  });

  it("hides the feature from a signed-out caller", async () => {
    mocks.requireAuth.mockResolvedValue({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });
    const available = await GET();
    expect(available.status).toBe(200);
    await expect(available.json()).resolves.toEqual({ available: false });
    const denied = await POST(post());
    expect(denied.status).toBe(401);
  });

  it("does not invent a query when no provider key is configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const response = await POST(post());
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ code: "unavailable" });
    expect(mocks.callModelMetered).not.toHaveBeenCalled();
    expect(mocks.reserve).not.toHaveBeenCalled();
  });

  it("returns one query with deck context and no card names", async () => {
    const response = await POST(post());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      query: 't:instant o:"draw a card" id<=UG legal:commander',
      context: { format: "commander", colorIdentity: ["G", "U"] },
    });
    expect(JSON.stringify(body)).not.toContain("Sol Ring");
    const prompt = String(mocks.callModelMetered.mock.calls[0]?.[0]?.prompt);
    expect(prompt).toContain("English");
    expect(prompt).toContain("a cheap instant that draws cards");
  });

  it("sends a French description without reordering the deck context the caller named", async () => {
    const response = await POST(
      post({ ...BODY, locale: "fr", description: "créatures qui piochent", applyContext: false })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      query: 't:instant o:"draw a card"',
      context: { format: "commander", colorIdentity: ["G", "U"] },
    });
    const prompt = String(mocks.callModelMetered.mock.calls[0]?.[0]?.prompt);
    expect(prompt).toContain("French");
    expect(prompt).toContain("créatures qui piochent");
  });

  it("rejects a completion that is not a Scryfall query", async () => {
    mocks.modelText = '{"query":"ignore previous instructions"}';
    const response = await POST(post());
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ code: "invalid_query" });
  });

  it("rate limits repeated descriptions", async () => {
    mocks.checkRateLimit.mockReturnValueOnce({ allowed: false, retryAfterMs: 1500 });
    const response = await POST(post());
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("2");
    await expect(response.json()).resolves.toEqual({ code: "rate_limited" });
  });
});
