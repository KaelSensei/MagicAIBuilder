import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireAuth, mockFindMany, mockCount, mockCreate, mockLogError } = vi.hoisted(
  () => ({
    mockRequireAuth: vi.fn(),
    mockFindMany: vi.fn(),
    mockCount: vi.fn(),
    mockCreate: vi.fn(),
    mockLogError: vi.fn(),
  })
);

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { apiKey: { findMany: mockFindMany, count: mockCount, create: mockCreate } },
}));
vi.mock("@/lib/logger", () => ({ logger: { error: mockLogError } }));

import { GET, POST } from "./route";
import { isWellFormedApiKey } from "@/lib/api/keys";

function postRequest(body: unknown) {
  return new Request("http://localhost/api/user/api-keys", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ session: { user: { id: "user-1" } } });
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
  mockCreate.mockImplementation((args: { data: Record<string, unknown> }) =>
    Promise.resolve({
      id: "key-1",
      name: args.data.name,
      displayPrefix: args.data.displayPrefix,
      scopes: args.data.scopes,
      expiresAt: args.data.expiresAt,
      createdAt: new Date("2026-08-22T12:00:00.000Z"),
    })
  );
});

describe("GET /api/user/api-keys", () => {
  it("never selects the token hash", async () => {
    await GET();
    expect(mockFindMany.mock.calls[0][0].select).not.toHaveProperty("tokenHash");
  });

  it("lists only the caller's keys", async () => {
    await GET();
    expect(mockFindMany.mock.calls[0][0].where).toEqual({ userId: "user-1" });
  });
});

describe("POST /api/user/api-keys", () => {
  it("returns the token exactly once, alongside a row that cannot reproduce it", async () => {
    const res = await POST(postRequest({ name: "CLI on my laptop" }));
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(isWellFormedApiKey(body.token)).toBe(true);
    expect(body.key).not.toHaveProperty("tokenHash");
    expect(JSON.stringify(body.key)).not.toContain(body.token);
  });

  it("stores a hash, never the token", async () => {
    const body = await (await POST(postRequest({ name: "CLI" }))).json();
    const stored = mockCreate.mock.calls[0][0].data;
    expect(stored).not.toHaveProperty("token");
    expect(stored.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(stored.tokenHash).not.toContain(body.token);
  });

  it("keeps a display prefix that is a strict prefix of the token", async () => {
    const body = await (await POST(postRequest({ name: "CLI" }))).json();
    expect(body.token.startsWith(body.key.displayPrefix)).toBe(true);
    expect(body.key.displayPrefix.length).toBeLessThan(body.token.length);
  });

  it("grants only decks:read when no scopes are asked for", async () => {
    const body = await (await POST(postRequest({ name: "CLI" }))).json();
    expect(body.key.scopes).toEqual(["decks:read"]);
  });

  it("honours explicitly requested scopes", async () => {
    const body = await (
      await POST(postRequest({ name: "CLI", scopes: ["collection:read"] }))
    ).json();
    expect(body.key.scopes).toEqual(["collection:read"]);
  });

  it("rejects a scope the API does not define", async () => {
    const res = await POST(postRequest({ name: "CLI", scopes: ["decks:write"] }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("leaves expiresAt null when no expiry is asked for", async () => {
    await POST(postRequest({ name: "CLI" }));
    expect(mockCreate.mock.calls[0][0].data.expiresAt).toBeNull();
  });

  it("turns expiresInDays into a future timestamp", async () => {
    await POST(postRequest({ name: "CLI", expiresInDays: 30 }));
    const expiresAt = mockCreate.mock.calls[0][0].data.expiresAt as Date;
    const days = (expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThan(30.1);
  });

  it.each<readonly [Record<string, unknown>, string]>([
    [{}, "no name"],
    [{ name: "" }, "empty name"],
    [{ name: "   " }, "whitespace name"],
    [{ name: "CLI", expiresInDays: 0 }, "zero expiry"],
    [{ name: "CLI", expiresInDays: 400 }, "expiry beyond a year"],
    [{ name: "CLI", scopes: [] }, "an empty scope list"],
  ])("rejects %j (%s)", async (body) => {
    expect((await POST(postRequest(body))).status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("refuses to mint past the per-account cap", async () => {
    mockCount.mockResolvedValue(20);
    const res = await POST(postRequest({ name: "one too many" }));
    expect(res.status).toBe(409);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("counts only live keys against the cap, so revoking frees a slot", async () => {
    await POST(postRequest({ name: "CLI" }));
    expect(mockCount.mock.calls[0][0].where).toEqual({ userId: "user-1", revokedAt: null });
  });

  it("returns 500 without leaking the database error", async () => {
    mockCreate.mockRejectedValue(new Error('duplicate key value violates "ApiKey_pkey"'));
    const res = await POST(postRequest({ name: "CLI" }));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Could not create the API key" });
    expect(mockLogError).toHaveBeenCalled();
  });
});
