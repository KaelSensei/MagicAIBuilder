/**
 * `summariseDiscoveryDeck`: one public deck as its discovery row shows it.
 * Solitary tests of a pure function; the listing around it (ranking, the cap,
 * the commander name) is pinned by `commander-discovery-use-case.test.ts`.
 */
import { describe, expect, it } from "vitest";

import { summariseDiscoveryDeck } from "./commander-discovery";
import type { DiscoveryDeckRecord } from "./commander-discovery-port";
import type { DeckVote } from "./votes";

const ATRAXA = "Atraxa, Praetors' Voice";

function deck(
  overrides: Partial<DiscoveryDeckRecord> = {}
): DiscoveryDeckRecord {
  return {
    id: "deck-1",
    name: "Superfriends",
    format: "commander",
    commanderName: ATRAXA,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    cardCount: 100,
    commanderCard: {
      name: ATRAXA,
      imageUri: "atraxa.jpg",
      artCropUri: "atraxa-art.jpg",
    },
    author: { name: "Builder", username: "builder", image: null },
    votes: [],
    ratings: [],
    ...overrides,
  };
}

function vote(userId: string, value: DeckVote["value"]): DeckVote {
  return { userId, deckId: "deck-1", value };
}

function stars(...ratings: readonly number[]): DiscoveryDeckRecord["ratings"] {
  return ratings.map((rating, i) => ({
    id: `rating-${i}`,
    userId: `rater-${i}`,
    deckId: "deck-1",
    rating,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  }));
}

describe("summariseDiscoveryDeck", () => {
  it("tallies the deck's votes into its score, upvotes and downvotes", () => {
    const summary = summariseDiscoveryDeck(
      deck({ votes: [vote("a", 1), vote("b", 1), vote("c", -1)] }),
      null
    );

    expect(summary).toMatchObject({ score: 1, upvotes: 2, downvotes: 1 });
  });

  it("picks out the viewer's own vote, and null for a viewer who has not voted or is signed out", () => {
    const voted = deck({ votes: [vote("me", -1), vote("someone", 1)] });

    expect(summariseDiscoveryDeck(voted, "me").viewerVote).toBe(-1);
    expect(summariseDiscoveryDeck(voted, "stranger").viewerVote).toBeNull();
    expect(summariseDiscoveryDeck(voted, null).viewerVote).toBeNull();
  });

  it("averages the deck's ratings and awards its quality badge from them", () => {
    const summary = summariseDiscoveryDeck(
      deck({ ratings: stars(5, 5, 5, 5, 5, 5, 5, 5, 4, 4) }),
      null
    );

    expect(summary).toMatchObject({
      averageRating: 4.8,
      ratingCount: 10,
      badge: "highly_rated",
    });
  });

  it("copies the row's identity, author and card count, and keeps updatedAt a date for ranking", () => {
    const summary = summariseDiscoveryDeck(deck(), null);

    expect(summary).toEqual({
      id: "deck-1",
      name: "Superfriends",
      format: "commander",
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      cardCount: 100,
      commander: {
        name: ATRAXA,
        imageUri: "atraxa.jpg",
        artCropUri: "atraxa-art.jpg",
      },
      author: { name: "Builder", username: "builder", image: null },
      score: 0,
      upvotes: 0,
      downvotes: 0,
      viewerVote: null,
      averageRating: 0,
      ratingCount: 0,
      badge: null,
    });
  });

  it("names a deck whose commander card is missing after its commanderName, without an image", () => {
    const summary = summariseDiscoveryDeck(deck({ commanderCard: null }), null);

    expect(summary.commander).toEqual({
      name: ATRAXA,
      imageUri: "",
      artCropUri: "",
    });
  });

  it("names the commander with an empty string when both the card and the name are gone", () => {
    const summary = summariseDiscoveryDeck(
      deck({ commanderCard: null, commanderName: null }),
      null
    );

    expect(summary.commander).toEqual({
      name: "",
      imageUri: "",
      artCropUri: "",
    });
  });
});
