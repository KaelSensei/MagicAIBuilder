import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const { mockUserFindFirst, mockFollowCount, mockFollowFindUnique, mockRatingFindMany } =
  vi.hoisted(() => ({
    mockUserFindFirst: vi.fn(),
    mockFollowCount: vi.fn(),
    mockFollowFindUnique: vi.fn(),
    mockRatingFindMany: vi.fn(),
  }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findFirst: mockUserFindFirst },
    userFollow: { count: mockFollowCount, findUnique: mockFollowFindUnique },
    deckRating: { findMany: mockRatingFindMany },
  },
}));

// ─── Mock NextAuth auth() ─────────────────────────────────────────────────────

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

// ─── Import after mocks ──────────────────────────────────────────────────────

import { GET } from "./route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function params(username = "kael") {
  return { params: Promise.resolve({ username }) };
}

function profile(deckCount = 1) {
  return {
    id: "target-1",
    name: "Kael",
    username: "kael",
    image: null,
    createdAt: new Date("2026-01-01"),
    decks: Array.from({ length: deckCount }, (_, i) => ({
      id: `deck-${i}`,
      name: `Deck ${i}`,
      description: null,
      format: "commander",
      targetBracket: 3,
      commanderId: null,
      isAIGenerated: false,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
      cards: [],
    })),
  };
}

function request() {
  return new Request("http://localhost/api/users/kael");
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(null);
  mockFollowCount.mockResolvedValue(0);
  mockFollowFindUnique.mockResolvedValue(null);
  mockRatingFindMany.mockResolvedValue([]);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/users/[username]", () => {
  it("returns the profile with follow counts for an anonymous viewer", async () => {
    mockUserFindFirst.mockResolvedValueOnce(profile());
    mockFollowCount.mockResolvedValueOnce(12).mockResolvedValueOnce(4);

    const res = await GET(request(), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.username).toBe("kael");
    expect(json.followerCount).toBe(12);
    expect(json.followingCount).toBe(4);
    expect(json.isFollowing).toBe(false);
  });

  it("reports isFollowing for a signed-in viewer who follows the profile", async () => {
    mockAuth.mockResolvedValue({ user: { id: "viewer-1" } });
    mockUserFindFirst.mockResolvedValueOnce(profile());
    mockFollowFindUnique.mockResolvedValueOnce({ id: "f-1" });

    const json = await (await GET(request(), params())).json();

    expect(json.isFollowing).toBe(true);
    expect(mockFollowFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          followerId_followingId: { followerId: "viewer-1", followingId: "target-1" },
        },
      })
    );
  });

  it("never reports a viewer as following their own profile", async () => {
    mockAuth.mockResolvedValue({ user: { id: "target-1" } });
    mockUserFindFirst.mockResolvedValueOnce(profile());

    const json = await (await GET(request(), params())).json();

    expect(json.isFollowing).toBe(false);
    expect(mockFollowFindUnique).not.toHaveBeenCalled();
  });

  it("awards the community_builder badge at 10 public decks", async () => {
    mockUserFindFirst.mockResolvedValueOnce(profile(10));

    const json = await (await GET(request(), params())).json();

    expect(json.badges).toContain("community_builder");
  });

  it("awards the highly_rated badge from the average across the user's decks", async () => {
    mockUserFindFirst.mockResolvedValueOnce(profile(1));
    mockRatingFindMany.mockResolvedValueOnce([
      { id: "r-1", userId: "v-1", deckId: "deck-0", rating: 5, createdAt: new Date() },
      { id: "r-2", userId: "v-2", deckId: "deck-0", rating: 5, createdAt: new Date() },
    ]);

    const json = await (await GET(request(), params())).json();

    expect(json.badges).toContain("highly_rated");
  });

  it("returns no badges for a new profile", async () => {
    mockUserFindFirst.mockResolvedValueOnce(profile(1));

    const json = await (await GET(request(), params())).json();

    expect(json.badges).toEqual([]);
  });

  it("404s for an unknown username", async () => {
    mockUserFindFirst.mockResolvedValueOnce(null);

    expect((await GET(request(), params())).status).toBe(404);
  });

  it("400s on a malformed username", async () => {
    expect((await GET(request(), params("bad name!"))).status).toBe(400);
    expect(mockUserFindFirst).not.toHaveBeenCalled();
  });
});
