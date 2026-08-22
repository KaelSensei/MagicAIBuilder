import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const {
  mockDeckFindUnique,
  mockRatingFindMany,
  mockRatingUpsert,
  mockRatingDeleteMany,
} = vi.hoisted(() => ({
  mockDeckFindUnique: vi.fn(),
  mockRatingFindMany: vi.fn(),
  mockRatingUpsert: vi.fn(),
  mockRatingDeleteMany: vi.fn(),
}));

// requireAuth resolves the session id against the database, so authenticated
// route tests need that row to exist. These routes never query prisma.user
// themselves, so one persistent echo stub covers every case.
const { mockUserFindUnique } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(async ({ where }: { where: { id?: string } }) => ({
    id: where.id ?? "user-1",
    name: null,
    email: null,
    image: null,
  })),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
    deck: { findUnique: mockDeckFindUnique },
    deckRating: {
      findMany: mockRatingFindMany,
      upsert: mockRatingUpsert,
      deleteMany: mockRatingDeleteMany,
    },
  },
}));

// ─── Mock NextAuth auth() ─────────────────────────────────────────────────────

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

// ─── Import after mocks ──────────────────────────────────────────────────────

import { GET, POST, DELETE } from "./route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PUBLIC_DECK = { id: "deck-1", userId: "owner-1", isPublic: true };
const PRIVATE_DECK = { id: "deck-1", userId: "owner-1", isPublic: false };

function params() {
  return { params: Promise.resolve({ id: "deck-1" }) };
}

function ratingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "r-1",
    userId: "voter-1",
    deckId: "deck-1",
    rating: 4,
    title: null,
    body: null,
    helpfulCount: 0,
    createdAt: new Date("2026-08-14T00:00:00Z"),
    user: { name: "Voter", username: "voter", image: null },
    ...overrides,
  };
}

function authedAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId, email: `${userId}@test.com` } });
}

function unauthed() {
  mockAuth.mockResolvedValue(null);
}

function postRequest(body: unknown) {
  return new Request("http://localhost/api/community/decks/deck-1/ratings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET /api/community/decks/[id]/ratings", () => {
  it("returns aggregate ratings for a public deck without a session", async () => {
    unauthed();
    mockDeckFindUnique.mockResolvedValueOnce(PUBLIC_DECK);
    mockRatingFindMany.mockResolvedValueOnce([
      ratingRow({ id: "r-1", rating: 5 }),
      ratingRow({ id: "r-2", rating: 3, userId: "voter-2" }),
    ]);

    const res = await GET(new Request("http://localhost"), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.count).toBe(2);
    expect(json.average).toBe(4);
    expect(json.histogram[5]).toBe(1);
    expect(json.histogram[3]).toBe(1);
    expect(json.viewerRating).toBeNull();
  });

  it("returns only written reviews in the reviews list", async () => {
    unauthed();
    mockDeckFindUnique.mockResolvedValueOnce(PUBLIC_DECK);
    mockRatingFindMany.mockResolvedValueOnce([
      ratingRow({ id: "r-1", title: "Great", body: "Nice curve" }),
      ratingRow({ id: "r-2", userId: "voter-2", title: null }),
    ]);

    const json = await (await GET(new Request("http://localhost"), params())).json();

    expect(json.reviews).toHaveLength(1);
    expect(json.reviews[0].title).toBe("Great");
    expect(json.reviews[0].author.username).toBe("voter");
  });

  it("exposes the viewer's own rating when signed in", async () => {
    authedAs("voter-2");
    mockDeckFindUnique.mockResolvedValueOnce(PUBLIC_DECK);
    mockRatingFindMany.mockResolvedValueOnce([
      ratingRow({ id: "r-1", rating: 5 }),
      ratingRow({ id: "r-2", rating: 2, userId: "voter-2" }),
    ]);

    const json = await (await GET(new Request("http://localhost"), params())).json();

    expect(json.viewerRating).toBe(2);
  });

  it("returns a quality badge once thresholds are met", async () => {
    unauthed();
    mockDeckFindUnique.mockResolvedValueOnce(PUBLIC_DECK);
    mockRatingFindMany.mockResolvedValueOnce(
      Array.from({ length: 10 }, (_, i) =>
        ratingRow({ id: `r-${i}`, userId: `voter-${i}`, rating: 5 })
      )
    );

    const json = await (await GET(new Request("http://localhost"), params())).json();

    expect(json.badge).toBe("highly_rated");
  });

  it("404s for a private deck viewed by a non-owner", async () => {
    unauthed();
    mockDeckFindUnique.mockResolvedValueOnce(PRIVATE_DECK);

    const res = await GET(new Request("http://localhost"), params());

    expect(res.status).toBe(404);
    expect(mockRatingFindMany).not.toHaveBeenCalled();
  });

  it("lets the owner read ratings on their own private deck", async () => {
    authedAs("owner-1");
    mockDeckFindUnique.mockResolvedValueOnce(PRIVATE_DECK);
    mockRatingFindMany.mockResolvedValueOnce([]);

    const res = await GET(new Request("http://localhost"), params());

    expect(res.status).toBe(200);
  });

  it("404s when the deck does not exist", async () => {
    unauthed();
    mockDeckFindUnique.mockResolvedValueOnce(null);

    expect((await GET(new Request("http://localhost"), params())).status).toBe(404);
  });

  it("returns a zeroed aggregate when nobody has rated yet", async () => {
    unauthed();
    mockDeckFindUnique.mockResolvedValueOnce(PUBLIC_DECK);
    mockRatingFindMany.mockResolvedValueOnce([]);

    const json = await (await GET(new Request("http://localhost"), params())).json();

    expect(json).toMatchObject({ average: 0, count: 0, badge: null, reviews: [] });
  });
});

// ─── POST ─────────────────────────────────────────────────────────────────────

describe("POST /api/community/decks/[id]/ratings", () => {
  it("401s without a session", async () => {
    unauthed();

    const res = await POST(postRequest({ rating: 4 }), params());

    expect(res.status).toBe(401);
    expect(mockRatingUpsert).not.toHaveBeenCalled();
  });

  it("upserts a star-only rating", async () => {
    authedAs("voter-1");
    mockDeckFindUnique.mockResolvedValueOnce(PUBLIC_DECK);
    mockRatingUpsert.mockResolvedValueOnce(ratingRow());

    const res = await POST(postRequest({ rating: 4 }), params());

    expect(res.status).toBe(201);
    expect(mockRatingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_deckId: { userId: "voter-1", deckId: "deck-1" } },
      })
    );
  });

  it("re-rating updates the existing row instead of creating a second one", async () => {
    authedAs("voter-1");
    mockDeckFindUnique.mockResolvedValueOnce(PUBLIC_DECK);
    mockRatingUpsert.mockResolvedValueOnce(ratingRow({ rating: 2 }));

    await POST(postRequest({ rating: 2 }), params());

    const call = mockRatingUpsert.mock.calls[0][0];
    expect(call.update).toMatchObject({ rating: 2 });
    expect(call.create).toMatchObject({ rating: 2, userId: "voter-1", deckId: "deck-1" });
  });

  it("stores title and body when a written review is supplied", async () => {
    authedAs("voter-1");
    mockDeckFindUnique.mockResolvedValueOnce(PUBLIC_DECK);
    mockRatingUpsert.mockResolvedValueOnce(ratingRow({ title: "Solid", body: "Good ramp" }));

    await POST(postRequest({ rating: 5, title: "Solid", body: "Good ramp" }), params());

    expect(mockRatingUpsert.mock.calls[0][0].create).toMatchObject({
      title: "Solid",
      body: "Good ramp",
    });
  });

  it("403s when the deck owner tries to rate their own deck", async () => {
    authedAs("owner-1");
    mockDeckFindUnique.mockResolvedValueOnce(PUBLIC_DECK);

    const res = await POST(postRequest({ rating: 5 }), params());

    expect(res.status).toBe(403);
    expect(mockRatingUpsert).not.toHaveBeenCalled();
  });

  it("404s when rating a private deck", async () => {
    authedAs("voter-1");
    mockDeckFindUnique.mockResolvedValueOnce(PRIVATE_DECK);

    expect((await POST(postRequest({ rating: 5 }), params())).status).toBe(404);
  });

  it("400s on an out-of-range rating", async () => {
    authedAs("voter-1");
    mockDeckFindUnique.mockResolvedValueOnce(PUBLIC_DECK);

    expect((await POST(postRequest({ rating: 6 }), params())).status).toBe(400);
    expect(mockRatingUpsert).not.toHaveBeenCalled();
  });

  it("400s on a non-integer rating", async () => {
    authedAs("voter-1");
    mockDeckFindUnique.mockResolvedValueOnce(PUBLIC_DECK);

    expect((await POST(postRequest({ rating: 3.5 }), params())).status).toBe(400);
  });

  it("400s when a review title exceeds the domain limit", async () => {
    authedAs("voter-1");
    mockDeckFindUnique.mockResolvedValueOnce(PUBLIC_DECK);

    const res = await POST(
      postRequest({ rating: 4, title: "x".repeat(101), body: "ok" }),
      params()
    );

    expect(res.status).toBe(400);
    expect(mockRatingUpsert).not.toHaveBeenCalled();
  });

  it("400s when a title is given without a body", async () => {
    authedAs("voter-1");
    mockDeckFindUnique.mockResolvedValueOnce(PUBLIC_DECK);

    expect(
      (await POST(postRequest({ rating: 4, title: "Missing body" }), params())).status
    ).toBe(400);
  });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────

describe("DELETE /api/community/decks/[id]/ratings", () => {
  it("401s without a session", async () => {
    unauthed();

    expect((await DELETE(new Request("http://localhost"), params())).status).toBe(401);
    expect(mockRatingDeleteMany).not.toHaveBeenCalled();
  });

  it("deletes only the caller's own rating", async () => {
    authedAs("voter-1");
    mockRatingDeleteMany.mockResolvedValueOnce({ count: 1 });

    const res = await DELETE(new Request("http://localhost"), params());

    expect(res.status).toBe(200);
    expect(mockRatingDeleteMany).toHaveBeenCalledWith({
      where: { userId: "voter-1", deckId: "deck-1" },
    });
  });

  it("is idempotent when no rating exists", async () => {
    authedAs("voter-1");
    mockRatingDeleteMany.mockResolvedValueOnce({ count: 0 });

    expect((await DELETE(new Request("http://localhost"), params())).status).toBe(200);
  });
});
