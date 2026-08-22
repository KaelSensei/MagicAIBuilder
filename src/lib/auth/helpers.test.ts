import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const { mockDeckFindUnique, mockUserFindUnique, mockUserUpsert } = vi.hoisted(() => ({
  mockDeckFindUnique: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserUpsert: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      upsert: mockUserUpsert,
    },
    deck: {
      findUnique: mockDeckFindUnique,
    },
  },
}));

// ─── Mock NextAuth auth() ─────────────────────────────────────────────────────

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({
  auth: mockAuth,
}));

// ─── Import after mocks ──────────────────────────────────────────────────────

import { requireAuth, requireDeckOwner } from "./helpers";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns session when user is authenticated", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1", name: "Kael", email: "kael@test.com" },
    });
    mockUserFindUnique.mockResolvedValueOnce({
      id: "user-1",
      name: "Kael",
      email: "kael@test.com",
      image: null,
    });

    const result = await requireAuth();

    expect(result.error).toBeUndefined();
    expect(result.session?.user.id).toBe("user-1");
    expect(result.session?.user.name).toBe("Kael");
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { id: true, name: true, email: true, image: true },
    });
  });

  it("returns 401 error when session is null", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await requireAuth();

    expect(result.session).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
  });

  it("returns 401 error when session has no user", async () => {
    mockAuth.mockResolvedValueOnce({ user: null });

    const result = await requireAuth();

    expect(result.error?.status).toBe(401);
  });

  it("falls back to resolving by email when the session carries no id", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { name: "Kael", email: "kael@test.com" },
    });
    mockUserUpsert.mockResolvedValueOnce({
      id: "user-1",
      name: "Kael",
      email: "kael@test.com",
      image: null,
    });

    const result = await requireAuth();

    expect(result.error).toBeUndefined();
    expect(result.session?.user.id).toBe("user-1");
  });

  it("verifies the JWT session ID against the database", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "oauth-user", name: "Kael", email: "Kael@Test.com", image: "https://example.com/avatar.png" },
    });
    mockUserFindUnique.mockResolvedValueOnce({
      id: "oauth-user",
      name: "Kael",
      email: "kael@test.com",
      image: "https://example.com/avatar.png",
    });

    const result = await requireAuth();

    expect(result.error).toBeUndefined();
    expect(result.session?.user.id).toBe("oauth-user");
    expect(mockUserFindUnique).toHaveBeenCalledOnce();
    expect(mockUserUpsert).not.toHaveBeenCalled();
  });

  // A signed JWT outlives the row it points at. Handing that id straight to a
  // write produced a foreign-key violation — a 500 on every deck creation.
  it("re-resolves by email when the JWT's user row no longer exists", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "deleted-user", name: "Kael", email: "Kael@Test.com" },
    });
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserUpsert.mockResolvedValueOnce({
      id: "rebuilt-user",
      name: "Kael",
      email: "kael@test.com",
      image: null,
    });

    const result = await requireAuth();

    expect(result.error).toBeUndefined();
    // The caller gets the id that actually exists, not the stale one.
    expect(result.session?.user.id).toBe("rebuilt-user");
    expect(mockUserUpsert).toHaveBeenCalledOnce();
  });

  it("returns 401 when the stale id has no email to recover from", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "deleted-user" } });
    mockUserFindUnique.mockResolvedValueOnce(null);

    const result = await requireAuth();

    expect(result.session).toBeUndefined();
    expect(result.error?.status).toBe(401);
    expect(mockUserUpsert).not.toHaveBeenCalled();
  });

  it("returns 401 when the session has neither an id nor an email to resolve", async () => {
    mockAuth.mockResolvedValueOnce({ user: { name: "Nameless" } });

    const result = await requireAuth();

    expect(result.session).toBeUndefined();
    expect(result.error?.status).toBe(401);
    expect(mockUserUpsert).not.toHaveBeenCalled();
  });
});

// The bypass hands out a session to an unauthenticated caller, so the two
// conditions guarding it are security boundaries, not conveniences.
describe("requireAuth — Playwright test bypass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("authenticates an anonymous caller as the Playwright user when enabled", async () => {
    vi.stubEnv("PLAYWRIGHT_TEST", "1");
    vi.stubEnv("NODE_ENV", "test");
    mockAuth.mockResolvedValueOnce(null);
    mockUserUpsert.mockResolvedValueOnce({
      id: "pw-user",
      name: "Playwright",
      email: "playwright@test.local",
      image: null,
    });

    const result = await requireAuth();

    expect(result.error).toBeUndefined();
    expect(result.session?.user.id).toBe("pw-user");
    expect(mockUserUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "playwright@test.local" } })
    );
  });

  // Eight Playwright workers hit the bypass at once against an empty database.
  // They all miss, all try to INSERT, and Postgres rejects every loser on
  // User_email_key — which surfaced as 7 e2e failures and a cascade of 500s.
  it("recovers the row when a concurrent insert wins the race", async () => {
    vi.stubEnv("PLAYWRIGHT_TEST", "1");
    vi.stubEnv("NODE_ENV", "test");
    mockAuth.mockResolvedValueOnce(null);
    mockUserUpsert.mockRejectedValueOnce(
      Object.assign(new Error("Unique constraint failed"), { code: "P2002" })
    );
    mockUserFindUnique.mockResolvedValueOnce({
      id: "pw-user",
      name: "Playwright",
      email: "playwright@test.local",
      image: null,
    });

    const result = await requireAuth();

    expect(result.error).toBeUndefined();
    expect(result.session?.user.id).toBe("pw-user");
  });

  it("propagates database errors that are not a unique-constraint race", async () => {
    vi.stubEnv("PLAYWRIGHT_TEST", "1");
    vi.stubEnv("NODE_ENV", "test");
    mockAuth.mockResolvedValueOnce(null);
    mockUserUpsert.mockRejectedValueOnce(
      Object.assign(new Error("connection refused"), { code: "P1001" })
    );

    await expect(requireAuth()).rejects.toThrow("connection refused");
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("returns 401 when the race recovery finds no row either", async () => {
    vi.stubEnv("PLAYWRIGHT_TEST", "1");
    vi.stubEnv("NODE_ENV", "test");
    mockAuth.mockResolvedValueOnce(null);
    mockUserUpsert.mockRejectedValueOnce(
      Object.assign(new Error("Unique constraint failed"), { code: "P2002" })
    );
    mockUserFindUnique.mockResolvedValueOnce(null);

    const result = await requireAuth();

    expect(result.error?.status).toBe(401);
  });

  it("REFUSES the bypass in production even when the flag is set", async () => {
    vi.stubEnv("PLAYWRIGHT_TEST", "1");
    vi.stubEnv("NODE_ENV", "production");
    mockAuth.mockResolvedValueOnce(null);

    const result = await requireAuth();

    expect(result.session).toBeUndefined();
    expect(result.error?.status).toBe(401);
    expect(mockUserUpsert).not.toHaveBeenCalled();
  });

  it("ignores the bypass when the flag is any value other than exactly '1'", async () => {
    vi.stubEnv("PLAYWRIGHT_TEST", "true");
    vi.stubEnv("NODE_ENV", "test");
    mockAuth.mockResolvedValueOnce(null);

    const result = await requireAuth();

    expect(result.error?.status).toBe(401);
    expect(mockUserUpsert).not.toHaveBeenCalled();
  });

  it("never overrides a real session with the Playwright user", async () => {
    vi.stubEnv("PLAYWRIGHT_TEST", "1");
    vi.stubEnv("NODE_ENV", "test");
    mockAuth.mockResolvedValueOnce({ user: { id: "real-user", email: "real@test.com" } });
    mockUserFindUnique.mockResolvedValueOnce({
      id: "real-user",
      name: null,
      email: "real@test.com",
      image: null,
    });

    const result = await requireAuth();

    expect(result.session?.user.id).toBe("real-user");
    expect(mockUserUpsert).not.toHaveBeenCalled();
  });

  it("returns 401 when the Playwright user cannot be resolved", async () => {
    vi.stubEnv("PLAYWRIGHT_TEST", "1");
    vi.stubEnv("NODE_ENV", "test");
    mockAuth.mockResolvedValueOnce(null);
    mockUserUpsert.mockResolvedValueOnce(null);

    const result = await requireAuth();

    expect(result.error?.status).toBe(401);
  });
});

describe("requireDeckOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns userId and deck when user owns the deck", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
    });
    mockUserFindUnique.mockResolvedValueOnce({
      id: "user-1",
      name: null,
      email: "kael@test.com",
      image: null,
    });
    mockDeckFindUnique.mockResolvedValueOnce({
      id: "deck-1",
      userId: "user-1",
    });

    const result = await requireDeckOwner("deck-1");

    expect(result.error).toBeUndefined();
    expect(result.userId).toBe("user-1");
    expect(result.deck?.id).toBe("deck-1");
  });

  it("denies access to ownerless legacy decks (userId is null)", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
    });
    mockUserFindUnique.mockResolvedValueOnce({
      id: "user-1",
      name: null,
      email: "kael@test.com",
      image: null,
    });
    mockDeckFindUnique.mockResolvedValueOnce({
      id: "deck-legacy",
      userId: null,
    });

    const result = await requireDeckOwner("deck-legacy");

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(403);
  });

  it("returns 403 when user does not own the deck", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
    });
    mockUserFindUnique.mockResolvedValueOnce({
      id: "user-1",
      name: null,
      email: "kael@test.com",
      image: null,
    });
    mockDeckFindUnique.mockResolvedValueOnce({
      id: "deck-2",
      userId: "user-other",
    });

    const result = await requireDeckOwner("deck-2");

    expect(result.userId).toBeUndefined();
    expect(result.error?.status).toBe(403);
  });

  it("returns 404 when deck is not found", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
    });
    mockUserFindUnique.mockResolvedValueOnce({
      id: "user-1",
      name: null,
      email: "kael@test.com",
      image: null,
    });
    mockDeckFindUnique.mockResolvedValueOnce(null);

    const result = await requireDeckOwner("nonexistent");

    expect(result.error?.status).toBe(404);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await requireDeckOwner("deck-1");

    expect(result.error?.status).toBe(401);
    // Should not query DB if not authenticated
    expect(mockDeckFindUnique).not.toHaveBeenCalled();
  });

  it("queries Prisma with correct deck id and select fields", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
    });
    mockUserFindUnique.mockResolvedValueOnce({
      id: "user-1",
      name: null,
      email: "kael@test.com",
      image: null,
    });
    mockDeckFindUnique.mockResolvedValueOnce({
      id: "deck-1",
      userId: "user-1",
    });

    await requireDeckOwner("deck-1");

    expect(mockDeckFindUnique).toHaveBeenCalledWith({
      where: { id: "deck-1" },
      select: { id: true, userId: true },
    });
  });
});
