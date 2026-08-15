import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const { mockDeckFindMany } = vi.hoisted(() => ({ mockDeckFindMany: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { deck: { findMany: mockDeckFindMany } },
}));

// ─── Mock NextAuth auth() ─────────────────────────────────────────────────────

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { GET } from "./route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

interface DeckOptions {
  readonly id: string;
  readonly commander: string;
  readonly votes?: readonly { userId: string; value: number }[];
  readonly ratings?: readonly number[];
  readonly updatedAt?: string;
}

function deckRow({
  id,
  commander,
  votes = [],
  ratings = [],
  updatedAt = "2026-01-01",
}: DeckOptions) {
  return {
    id,
    name: `${commander} list`,
    format: "commander",
    updatedAt: new Date(updatedAt),
    user: { name: "Builder", username: "builder", image: null },
    cards: [{ name: commander, imageUri: "", artCropUri: "" }],
    votes: votes.map((v) => ({ ...v, deckId: id })),
    ratings: ratings.map((rating, i) => ({
      id: `${id}-r${i}`,
      userId: `u${i}`,
      deckId: id,
      rating,
      title: null,
      body: null,
      helpfulCount: 0,
      createdAt: new Date("2026-01-01"),
    })),
    _count: { cards: 100 },
  };
}

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

async function get(slug: string) {
  return (await GET(new Request("http://localhost"), params(slug))).json();
}

describe("GET /api/community/commanders/[slug]/decks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
  });

  it("returns only decks whose commander matches the slug", async () => {
    mockDeckFindMany.mockResolvedValue([
      deckRow({ id: "a", commander: "Atraxa, Praetors' Voice" }),
      deckRow({ id: "b", commander: "The Ur-Dragon" }),
    ]);

    const body = await get("atraxa-praetors-voice");

    expect(body.decks).toHaveLength(1);
    expect(body.decks[0].id).toBe("a");
    expect(body.commanderName).toBe("Atraxa, Praetors' Voice");
  });

  it("returns an empty listing for a commander nobody has published", async () => {
    mockDeckFindMany.mockResolvedValue([deckRow({ id: "a", commander: "Atraxa" })]);

    const body = await get("kenrith-the-returned-king");

    expect(body.decks).toEqual([]);
    expect(body.commanderName).toBeNull();
  });

  it("ranks by vote score, highest first", async () => {
    mockDeckFindMany.mockResolvedValue([
      deckRow({ id: "low", commander: "Atraxa", votes: [{ userId: "u1", value: -1 }] }),
      deckRow({
        id: "high",
        commander: "Atraxa",
        votes: [
          { userId: "u2", value: 1 },
          { userId: "u3", value: 1 },
        ],
      }),
    ]);

    const body = await get("atraxa");

    expect(body.decks.map((d: { id: string }) => d.id)).toEqual(["high", "low"]);
    expect(body.decks[0]).toMatchObject({ score: 2, upvotes: 2, downvotes: 0 });
  });

  it("carries the star average alongside the vote score", async () => {
    mockDeckFindMany.mockResolvedValue([
      deckRow({ id: "a", commander: "Atraxa", ratings: [5, 4, 3] }),
    ]);

    const body = await get("atraxa");

    expect(body.decks[0].averageRating).toBeCloseTo(4, 5);
    expect(body.decks[0].ratingCount).toBe(3);
  });

  it("reports no viewer vote for an anonymous visitor", async () => {
    mockDeckFindMany.mockResolvedValue([
      deckRow({ id: "a", commander: "Atraxa", votes: [{ userId: "someone", value: 1 }] }),
    ]);

    const body = await get("atraxa");

    expect(body.decks[0].viewerVote).toBeNull();
  });

  it("reports the signed-in viewer's own vote", async () => {
    mockAuth.mockResolvedValue({ user: { id: "me" } });
    mockDeckFindMany.mockResolvedValue([
      deckRow({ id: "a", commander: "Atraxa", votes: [{ userId: "me", value: -1 }] }),
    ]);

    const body = await get("atraxa");

    expect(body.decks[0].viewerVote).toBe(-1);
  });

  it("queries only public decks that have a commander", async () => {
    mockDeckFindMany.mockResolvedValue([]);

    await get("atraxa");

    expect(mockDeckFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublic: true, cards: { some: { isCommander: true } } },
      })
    );
  });

  it("returns a 500 envelope rather than throwing when the query fails", async () => {
    mockDeckFindMany.mockRejectedValue(new Error("db down"));

    const response = await GET(new Request("http://localhost"), params("atraxa"));

    expect(response.status).toBe(500);
  });
});
