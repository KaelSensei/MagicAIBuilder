import { describe, expect, it } from "vitest";

import type { StoredRating } from "./deck-interaction-ports";
import {
  rateDeck,
  readDeckRatings,
  removeRating,
  type RatingUseCasePorts,
} from "./deck-rating-use-cases";
import type { DeckVisibilityFacts } from "./deck-visibility-policy";
import {
  FAKE_AUTHOR,
  inMemoryDeckVisibilityReader,
  inMemoryRatingStore,
  voterKey,
} from "./testing/deck-interaction-fakes";

const OWNER = "owner-1";
const RATER = "voter-1";
const PUBLIC_DECK: DeckVisibilityFacts = {
  ownerId: OWNER,
  isPublic: true,
  shareEnabled: false,
};
const PRIVATE_DECK: DeckVisibilityFacts = {
  ownerId: OWNER,
  isPublic: false,
  shareEnabled: false,
};

function storedRating(overrides: Partial<StoredRating> = {}): StoredRating {
  return {
    id: "r-1",
    userId: RATER,
    deckId: "deck-1",
    rating: 4,
    title: null,
    body: null,
    helpfulCount: 0,
    createdAt: new Date("2026-08-14T00:00:00Z"),
    user: FAKE_AUTHOR,
    ...overrides,
  };
}

function ports(
  decks: Readonly<Record<string, DeckVisibilityFacts>>,
  ratings: readonly StoredRating[] = []
): {
  readonly ports: RatingUseCasePorts;
  readonly ratings: ReturnType<typeof inMemoryRatingStore>;
} {
  const store = inMemoryRatingStore(ratings);
  return {
    ports: { decks: inMemoryDeckVisibilityReader(decks), ratings: store },
    ratings: store,
  };
}

describe("readDeckRatings", () => {
  it("aggregates a public deck's ratings for an anonymous viewer", async () => {
    const { ports: p } = ports({ "deck-1": PUBLIC_DECK }, [
      storedRating({ id: "r-1", rating: 5 }),
      storedRating({ id: "r-2", rating: 3, userId: "voter-2" }),
    ]);

    const result = await readDeckRatings(
      { deckId: "deck-1", viewerId: null },
      p
    );

    expect(result).toMatchObject({
      kind: "ok",
      summary: { average: 4, count: 2, badge: null, viewerRating: null },
    });
    expect(result.kind === "ok" && result.summary.histogram).toEqual({
      1: 0,
      2: 0,
      3: 1,
      4: 0,
      5: 1,
    });
  });

  it("lists only written reviews, newest first, with their author", async () => {
    const { ports: p } = ports({ "deck-1": PUBLIC_DECK }, [
      storedRating({
        id: "r-1",
        title: "Great",
        body: "Nice curve",
        createdAt: new Date("2026-08-14T00:00:00Z"),
      }),
      storedRating({ id: "r-2", userId: "voter-2", title: null }),
      storedRating({
        id: "r-3",
        userId: "voter-3",
        title: "Newer",
        body: "Still good",
        createdAt: new Date("2026-08-15T00:00:00Z"),
      }),
    ]);

    const result = await readDeckRatings(
      { deckId: "deck-1", viewerId: null },
      p
    );

    expect(
      result.kind === "ok" && result.summary.reviews.map((r) => r.title)
    ).toEqual(["Newer", "Great"]);
    expect(result.kind === "ok" && result.summary.reviews[0].author).toEqual(
      FAKE_AUTHOR
    );
  });

  it("exposes the viewer's own stars when signed in", async () => {
    const { ports: p } = ports({ "deck-1": PUBLIC_DECK }, [
      storedRating({ id: "r-1", rating: 5 }),
      storedRating({ id: "r-2", rating: 2, userId: "voter-2" }),
    ]);

    const result = await readDeckRatings(
      { deckId: "deck-1", viewerId: "voter-2" },
      p
    );

    expect(result.kind === "ok" && result.summary.viewerRating).toBe(2);
  });

  it("awards the highly-rated badge once ten ratings average 4.5 or more", async () => {
    const { ports: p } = ports(
      { "deck-1": PUBLIC_DECK },
      Array.from({ length: 10 }, (_, i) =>
        storedRating({ id: `r-${i}`, userId: `voter-${i}`, rating: 5 })
      )
    );

    const result = await readDeckRatings(
      { deckId: "deck-1", viewerId: null },
      p
    );

    expect(result.kind === "ok" && result.summary.badge).toBe("highly_rated");
  });

  it("answers a zeroed aggregate when nobody has rated yet", async () => {
    const { ports: p } = ports({ "deck-1": PUBLIC_DECK });

    expect(
      await readDeckRatings({ deckId: "deck-1", viewerId: null }, p)
    ).toEqual({
      kind: "ok",
      summary: {
        average: 0,
        count: 0,
        histogram: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        badge: null,
        reviews: [],
        viewerRating: null,
      },
    });
  });

  it("lets the owner read the ratings of their private deck", async () => {
    const { ports: p } = ports({ "deck-1": PRIVATE_DECK });

    expect(
      (await readDeckRatings({ deckId: "deck-1", viewerId: OWNER }, p)).kind
    ).toBe("ok");
  });

  it("answers not-found for a private deck to anyone but its owner", async () => {
    const { ports: p } = ports({ "deck-1": PRIVATE_DECK }, [storedRating()]);

    expect(
      await readDeckRatings({ deckId: "deck-1", viewerId: RATER }, p)
    ).toEqual({
      kind: "not-found",
    });
    expect(
      await readDeckRatings({ deckId: "deck-1", viewerId: null }, p)
    ).toEqual({
      kind: "not-found",
    });
  });

  it("answers not-found for a deck that does not exist", async () => {
    const { ports: p } = ports({});

    expect(
      await readDeckRatings({ deckId: "deck-1", viewerId: null }, p)
    ).toEqual({
      kind: "not-found",
    });
  });
});

describe("rateDeck", () => {
  it("stores a star-only rating and answers the stored row with its author", async () => {
    const { ports: p, ratings } = ports({ "deck-1": PUBLIC_DECK });

    const result = await rateDeck(
      { deckId: "deck-1", raterId: RATER, rating: 4 },
      p
    );

    expect(result).toMatchObject({
      kind: "ok",
      rating: {
        userId: RATER,
        deckId: "deck-1",
        rating: 4,
        title: null,
        body: null,
        user: FAKE_AUTHOR,
      },
    });
    expect(
      ratings.rows.get(voterKey({ userId: RATER, deckId: "deck-1" }))?.rating
    ).toBe(4);
  });

  it("re-rating replaces the rater's earlier rating instead of adding a second one", async () => {
    const { ports: p, ratings } = ports({ "deck-1": PUBLIC_DECK });

    await rateDeck({ deckId: "deck-1", raterId: RATER, rating: 4 }, p);
    const result = await rateDeck(
      { deckId: "deck-1", raterId: RATER, rating: 2 },
      p
    );

    expect(ratings.rows.size).toBe(1);
    expect(result.kind === "ok" && result.rating.rating).toBe(2);
  });

  it("stores the title and body of a written review", async () => {
    const { ports: p } = ports({ "deck-1": PUBLIC_DECK });

    const result = await rateDeck(
      {
        deckId: "deck-1",
        raterId: RATER,
        rating: 5,
        title: "Solid",
        body: "Good ramp",
      },
      p
    );

    expect(result).toMatchObject({
      kind: "ok",
      rating: { title: "Solid", body: "Good ramp" },
    });
  });

  it("refuses a review whose title exceeds the domain limit, before reading the deck", async () => {
    const { ports: p, ratings } = ports({});

    const result = await rateDeck(
      {
        deckId: "deck-1",
        raterId: RATER,
        rating: 4,
        title: "x".repeat(101),
        body: "ok",
      },
      p
    );

    expect(result).toEqual({
      kind: "invalid",
      errors: ["Title must be under 100 characters"],
    });
    expect(ratings.rows.size).toBe(0);
  });

  it("refuses a title given without a body", async () => {
    const { ports: p } = ports({ "deck-1": PUBLIC_DECK });

    const result = await rateDeck(
      { deckId: "deck-1", raterId: RATER, rating: 4, title: "Missing body" },
      p
    );

    expect(result).toEqual({
      kind: "invalid",
      errors: ["Review body is required"],
    });
  });

  it("refuses the owner's rating of their own deck and stores nothing", async () => {
    const { ports: p, ratings } = ports({ "deck-1": PUBLIC_DECK });

    expect(
      await rateDeck({ deckId: "deck-1", raterId: OWNER, rating: 5 }, p)
    ).toEqual({
      kind: "own-deck",
    });
    expect(ratings.rows.size).toBe(0);
  });

  it("answers not-found for a private deck the rater cannot see, and stores nothing", async () => {
    const { ports: p, ratings } = ports({ "deck-1": PRIVATE_DECK });

    expect(
      await rateDeck({ deckId: "deck-1", raterId: RATER, rating: 5 }, p)
    ).toEqual({
      kind: "not-found",
    });
    expect(ratings.rows.size).toBe(0);
  });

  it("answers not-found for a deck that does not exist", async () => {
    const { ports: p } = ports({});

    expect(
      await rateDeck({ deckId: "deck-1", raterId: RATER, rating: 5 }, p)
    ).toEqual({
      kind: "not-found",
    });
  });
});

describe("removeRating", () => {
  it("removes only the rater's own rating and counts it", async () => {
    const { ports: p, ratings } = ports({ "deck-1": PUBLIC_DECK }, [
      storedRating({ id: "r-1" }),
      storedRating({ id: "r-2", userId: "voter-2" }),
    ]);

    expect(await removeRating({ deckId: "deck-1", raterId: RATER }, p)).toEqual(
      { deleted: 1 }
    );
    expect([...ratings.rows.values()].map((r) => r.userId)).toEqual([
      "voter-2",
    ]);
  });

  it("is idempotent when the rater has no rating", async () => {
    const { ports: p } = ports({ "deck-1": PUBLIC_DECK });

    expect(await removeRating({ deckId: "deck-1", raterId: RATER }, p)).toEqual(
      { deleted: 0 }
    );
  });

  it("currently removes a rating without reading the deck (pinned: the route never checked it)", async () => {
    const { ports: p } = ports({}, [storedRating()]);

    expect(await removeRating({ deckId: "deck-1", raterId: RATER }, p)).toEqual(
      { deleted: 1 }
    );
  });
});
