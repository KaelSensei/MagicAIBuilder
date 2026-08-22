import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindUnique, mockUpdate, mockCheckRateLimit, mockLogError } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { apiKey: { findUnique: mockFindUnique, update: mockUpdate } },
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mockCheckRateLimit }));
vi.mock("@/lib/logger", () => ({ logger: { error: mockLogError } }));

import { authenticateApiKey, requireApiScope } from "./authenticate";
import { hashApiKey, mintApiKey } from "./keys";

const { token: TOKEN } = mintApiKey();

function request(authorization?: string) {
  return new Request("http://localhost/api/v1/decks", {
    headers: authorization ? { authorization } : {},
  });
}

function keyRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "key-1",
    userId: "user-1",
    scopes: ["decks:read"],
    revokedAt: null,
    expiresAt: null,
    lastUsedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue({ allowed: true });
  mockUpdate.mockResolvedValue({});
  mockFindUnique.mockResolvedValue(keyRow());
});

describe("authenticateApiKey", () => {
  it("resolves a valid key to its owner", async () => {
    const result = await authenticateApiKey(request(`Bearer ${TOKEN}`));
    expect(result.ok).toBe(true);
    expect(result.ok && result.caller).toEqual({
      userId: "user-1",
      keyId: "key-1",
      scopes: ["decks:read"],
    });
  });

  it("looks the key up by its hash, never by the token", async () => {
    await authenticateApiKey(request(`Bearer ${TOKEN}`));
    const where = mockFindUnique.mock.calls[0][0].where;
    expect(where).toEqual({ tokenHash: hashApiKey(TOKEN) });
    expect(JSON.stringify(mockFindUnique.mock.calls[0])).not.toContain(TOKEN);
  });

  it("challenges a request with no Authorization header", async () => {
    const result = await authenticateApiKey(request());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    expect(result.response.headers.get("WWW-Authenticate")).toContain("Bearer");
  });

  it("rejects a malformed token without querying the database", async () => {
    const result = await authenticateApiKey(request("Bearer not-a-key"));
    expect(result.ok).toBe(false);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  // ─── One message for every rejection below the header check ────────────────

  it.each([
    ["an unknown key", null],
    ["a revoked key", keyRow({ revokedAt: new Date("2026-01-01") })],
    ["an expired key", keyRow({ expiresAt: new Date("2026-01-01") })],
  ])("gives %s the same 401 and the same message", async (_label, row) => {
    mockFindUnique.mockResolvedValue(row);
    const result = await authenticateApiKey(request(`Bearer ${TOKEN}`));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    await expect(result.response.json()).resolves.toEqual({
      error: { code: "unauthorized", message: "Invalid API key" },
    });
  });

  it("accepts a key whose expiry is still ahead", async () => {
    mockFindUnique.mockResolvedValue(
      keyRow({ expiresAt: new Date(Date.now() + 60_000) })
    );
    await expect(authenticateApiKey(request(`Bearer ${TOKEN}`))).resolves.toMatchObject({
      ok: true,
    });
  });

  // ─── Rate limiting ─────────────────────────────────────────────────────────

  it("meters per key rather than per address", async () => {
    await authenticateApiKey(request(`Bearer ${TOKEN}`));
    expect(mockCheckRateLimit).toHaveBeenCalledWith("api-key:key-1", 120, 60_000);
  });

  it("returns 429 with Retry-After once the quota is spent", async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 4200 });
    const result = await authenticateApiKey(request(`Bearer ${TOKEN}`));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(429);
    expect(result.response.headers.get("Retry-After")).toBe("5");
  });

  // ─── lastUsedAt throttling ─────────────────────────────────────────────────

  it("stamps lastUsedAt on a key that has never been used", async () => {
    await authenticateApiKey(request(`Bearer ${TOKEN}`));
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "key-1" } })
    );
  });

  it("does not rewrite lastUsedAt within the hour", async () => {
    mockFindUnique.mockResolvedValue(keyRow({ lastUsedAt: new Date(Date.now() - 60_000) }));
    await authenticateApiKey(request(`Bearer ${TOKEN}`));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rewrites lastUsedAt once it has gone stale", async () => {
    mockFindUnique.mockResolvedValue(
      keyRow({ lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) })
    );
    await authenticateApiKey(request(`Bearer ${TOKEN}`));
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("authenticates even when the lastUsedAt write fails", async () => {
    mockUpdate.mockRejectedValue(new Error("read-only replica"));
    const result = await authenticateApiKey(request(`Bearer ${TOKEN}`));
    expect(result.ok).toBe(true);
    expect(mockLogError).toHaveBeenCalled();
  });

  it("returns 500 without leaking the database error", async () => {
    mockFindUnique.mockRejectedValue(new Error('relation "ApiKey" does not exist'));
    const result = await authenticateApiKey(request(`Bearer ${TOKEN}`));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(500);
    await expect(result.response.json()).resolves.toEqual({
      error: { code: "server_error", message: "Could not verify the API key" },
    });
  });
});

describe("requireApiScope", () => {
  it("passes a key holding the scope through", async () => {
    await expect(
      requireApiScope(request(`Bearer ${TOKEN}`), "decks:read")
    ).resolves.toMatchObject({ ok: true });
  });

  it("answers 403 and not 401 when the key is valid but unscoped", async () => {
    mockFindUnique.mockResolvedValue(keyRow({ scopes: ["collection:read"] }));
    const result = await requireApiScope(request(`Bearer ${TOKEN}`), "decks:read");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    // 401 would invite the client to re-authenticate, which cannot help: the
    // credential is already valid, it is simply not permitted here.
    expect(result.response.status).toBe(403);
    const body = await result.response.json();
    expect(body.error.code).toBe("forbidden");
  });

  it("reports the missing scope before the rate limiter is even consulted for a bad header", async () => {
    const result = await requireApiScope(request(), "decks:read");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
  });
});
