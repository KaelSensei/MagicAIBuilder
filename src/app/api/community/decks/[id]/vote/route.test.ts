import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const { mockDeckFindUnique, mockVoteFindMany, mockVoteUpsert, mockVoteDeleteMany } =
  vi.hoisted(() => ({
    mockDeckFindUnique: vi.fn(),
    mockVoteFindMany: vi.fn(),
    mockVoteUpsert: vi.fn(),
    mockVoteDeleteMany: vi.fn(),
  }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deck: { findUnique: mockDeckFindUnique },
    deckVote: {
      findMany: mockVoteFindMany,
      upsert: mockVoteUpsert,
      deleteMany: mockVoteDeleteMany,
    },
  },
}));

// ─── Mock NextAuth auth() ─────────────────────────────────────────────────────

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { GET, POST, DELETE } from "./route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PUBLIC_DECK = { id: "deck-1", userId: "owner-1", isPublic: true };
const PRIVATE_DECK = { id: "deck-1", userId: "owner-1", isPublic: false };

function params() {
  return { params: Promise.resolve({ id: "deck-1" }) };
}

function voteRequest(body: unknown) {
  return new Request("http://localhost/api/community/decks/deck-1/vote", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function signedInAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}

describe("GET /api/community/decks/[id]/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
  });

  it("tallies votes for an anonymous viewer", async () => {
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockVoteFindMany.mockResolvedValue([
      { userId: "a", deckId: "deck-1", value: 1 },
      { userId: "b", deckId: "deck-1", value: 1 },
      { userId: "c", deckId: "deck-1", value: -1 },
    ]);

    const body = await (await GET(new Request("http://localhost"), params())).json();

    expect(body).toMatchObject({ score: 1, upvotes: 2, downvotes: 1, viewerVote: null });
  });

  it("reports the viewer's own vote when signed in", async () => {
    signedInAs("voter-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);
    mockVoteFindMany.mockResolvedValue([{ userId: "voter-1", deckId: "deck-1", value: -1 }]);

    const body = await (await GET(new Request("http://localhost"), params())).json();

    expect(body.viewerVote).toBe(-1);
  });

  it("404s a private deck for anyone but its owner", async () => {
    mockDeckFindUnique.mockResolvedValue(PRIVATE_DECK);

    const response = await GET(new Request("http://localhost"), params());

    expect(response.status).toBe(404);
  });
});

describe("POST /api/community/decks/[id]/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVoteFindMany.mockResolvedValue([]);
  });

  it("rejects an anonymous caller", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(voteRequest({ value: 1 }), params());

    expect(response.status).toBe(401);
    expect(mockVoteUpsert).not.toHaveBeenCalled();
  });

  it("stores an upvote", async () => {
    signedInAs("voter-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);

    const response = await POST(voteRequest({ value: 1 }), params());

    expect(response.status).toBe(201);
    expect(mockVoteUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_deckId: { userId: "voter-1", deckId: "deck-1" } },
        update: { value: 1 },
      })
    );
  });

  it("upserts so flipping a vote replaces it instead of stacking a second row", async () => {
    signedInAs("voter-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);

    await POST(voteRequest({ value: 1 }), params());
    await POST(voteRequest({ value: -1 }), params());

    expect(mockVoteUpsert).toHaveBeenCalledTimes(2);
    expect(mockVoteUpsert.mock.calls[1][0].update).toEqual({ value: -1 });
  });

  it("rejects a value that is neither 1 nor -1", async () => {
    signedInAs("voter-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);

    for (const value of [0, 2, -5]) {
      const response = await POST(voteRequest({ value }), params());
      expect(response.status).toBe(400);
    }
    expect(mockVoteUpsert).not.toHaveBeenCalled();
  });

  it("forbids voting on your own deck", async () => {
    signedInAs("owner-1");
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);

    const response = await POST(voteRequest({ value: 1 }), params());

    expect(response.status).toBe(403);
    expect(mockVoteUpsert).not.toHaveBeenCalled();
  });

  it("404s a deck the caller cannot see", async () => {
    signedInAs("voter-1");
    mockDeckFindUnique.mockResolvedValue(PRIVATE_DECK);

    const response = await POST(voteRequest({ value: 1 }), params());

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/community/decks/[id]/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVoteFindMany.mockResolvedValue([]);
  });

  it("rejects an anonymous caller", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await DELETE(new Request("http://localhost"), params());

    expect(response.status).toBe(401);
  });

  it("clears only the caller's own vote", async () => {
    signedInAs("voter-1");

    await DELETE(new Request("http://localhost"), params());

    expect(mockVoteDeleteMany).toHaveBeenCalledWith({
      where: { userId: "voter-1", deckId: "deck-1" },
    });
  });

  it("is idempotent when no vote exists", async () => {
    signedInAs("voter-1");
    mockVoteDeleteMany.mockResolvedValue({ count: 0 });

    const response = await DELETE(new Request("http://localhost"), params());

    expect(response.status).toBe(200);
  });
});
