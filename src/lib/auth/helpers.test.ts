import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const { mockDeckFindUnique } = vi.hoisted(() => ({
  mockDeckFindUnique: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
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

    const result = await requireAuth();

    expect(result.error).toBeUndefined();
    expect(result.session?.user.id).toBe("user-1");
    expect(result.session?.user.name).toBe("Kael");
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

  it("returns 401 error when user has no id", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { name: "Kael", email: "kael@test.com" },
    });

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
    mockDeckFindUnique.mockResolvedValueOnce({
      id: "deck-1",
      userId: "user-1",
    });

    const result = await requireDeckOwner("deck-1");

    expect(result.error).toBeUndefined();
    expect(result.userId).toBe("user-1");
    expect(result.deck?.id).toBe("deck-1");
  });

  it("allows access to legacy decks (userId is null)", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
    });
    mockDeckFindUnique.mockResolvedValueOnce({
      id: "deck-legacy",
      userId: null,
    });

    const result = await requireDeckOwner("deck-legacy");

    expect(result.error).toBeUndefined();
    expect(result.userId).toBe("user-1");
  });

  it("returns 403 when user does not own the deck", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
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
