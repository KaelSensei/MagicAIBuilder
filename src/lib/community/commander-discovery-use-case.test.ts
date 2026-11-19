/**
 * `listCommanderDecks`: the commander discovery listing, run on the
 * in-memory reader (ADR 0005). Sociable: the real summary, ranking and cap
 * run behind the use case. The SQL slug match lives in the Prisma adapter and
 * is exercised against Postgres by `e2e/community-discovery.spec.ts`.
 */
import { describe, expect, it } from "vitest";

import type { DiscoveryDeckRecord } from "./commander-discovery-port";
import { listCommanderDecks } from "./commander-discovery-use-case";
import { inMemoryCommanderDeckReader } from "./testing/in-memory-commander-deck-reader";
import type { CommanderDeckReader } from "./commander-discovery-port";
import type { DeckVote } from "./votes";

const SLUG = "atraxa-praetors-voice";
const ATRAXA = "Atraxa, Praetors' Voice";

interface DeckSeed {
  readonly id: string;
  readonly upvotes?: number;
  readonly ratingCount?: number;
  readonly updatedAt?: string;
  readonly commanderName?: string | null;
  readonly commanderCard?: DiscoveryDeckRecord["commanderCard"];
}

function deck(seed: DeckSeed): DiscoveryDeckRecord {
  const votes: DeckVote[] = Array.from(
    { length: seed.upvotes ?? 0 },
    (_, i) => ({
      userId: `voter-${i}`,
      deckId: seed.id,
      value: 1,
    })
  );
  return {
    id: seed.id,
    name: `${seed.id} list`,
    format: "commander",
    commanderName:
      seed.commanderName === undefined ? ATRAXA : seed.commanderName,
    updatedAt: new Date(seed.updatedAt ?? "2026-01-01T00:00:00Z"),
    cardCount: 100,
    commanderCard:
      seed.commanderCard === undefined
        ? { name: ATRAXA, imageUri: "", artCropUri: "" }
        : seed.commanderCard,
    author: null,
    votes,
    ratings: Array.from({ length: seed.ratingCount ?? 0 }, (_, i) => ({
      id: `${seed.id}-rating-${i}`,
      userId: `rater-${i}`,
      deckId: seed.id,
      rating: 3,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    })),
  };
}

function list(
  decks: readonly DiscoveryDeckRecord[],
  viewerId: string | null = null
) {
  return listCommanderDecks(
    { decks: inMemoryCommanderDeckReader({ [SLUG]: decks }) },
    { slug: SLUG, viewerId }
  );
}

describe("listCommanderDecks", () => {
  it("ranks the decks by score, then by rating count, then most recently updated first", async () => {
    const listing = await list([
      deck({
        id: "older-tie",
        upvotes: 2,
        ratingCount: 1,
        updatedAt: "2026-01-01T00:00:00Z",
      }),
      deck({ id: "low", upvotes: 0 }),
      deck({
        id: "newer-tie",
        upvotes: 2,
        ratingCount: 1,
        updatedAt: "2026-02-01T00:00:00Z",
      }),
      deck({ id: "more-ratings", upvotes: 2, ratingCount: 4 }),
      deck({ id: "top", upvotes: 5 }),
    ]);

    expect(listing.decks.map((row) => row.id)).toEqual([
      "top",
      "more-ratings",
      "newer-tie",
      "older-tie",
      "low",
    ]);
  });

  it("caps the listing at 50 decks while the total counts every match", async () => {
    const listing = await list(
      Array.from({ length: 51 }, (_, i) => deck({ id: `deck-${i}` }))
    );

    expect(listing.decks).toHaveLength(50);
    expect(listing.total).toBe(51);
  });

  it("keeps the best-ranked decks when it caps the listing", async () => {
    const listing = await list([
      ...Array.from({ length: 50 }, (_, i) => deck({ id: `deck-${i}` })),
      deck({ id: "best", upvotes: 1 }),
    ]);

    expect(listing.decks[0]?.id).toBe("best");
  });

  it("sends updatedAt as an ISO string, so a cached read and a fresh read agree", async () => {
    const listing = await list([
      deck({ id: "a", updatedAt: "2026-03-04T05:06:07Z" }),
    ]);

    expect(listing.decks[0]?.updatedAt).toBe("2026-03-04T05:06:07.000Z");
  });

  it("reports the signed-in viewer's own vote", async () => {
    const listing = await list([deck({ id: "a", upvotes: 1 })], "voter-0");

    expect(listing.decks[0]?.viewerVote).toBe(1);
  });

  it("names the commander after the first deck the reader returns", async () => {
    const listing = await list([
      deck({ id: "a" }),
      deck({ id: "b", commanderName: "Other" }),
    ]);

    expect(listing.commanderName).toBe(ATRAXA);
  });

  it("falls back to the commander card's name for a deck saved before the commanderName backfill", async () => {
    const listing = await list([deck({ id: "a", commanderName: null })]);

    expect(listing.commanderName).toBe(ATRAXA);
  });

  it("answers no commander name when the first deck has neither a name nor a commander card", async () => {
    const listing = await list([
      deck({ id: "a", commanderName: null, commanderCard: null }),
    ]);

    expect(listing.commanderName).toBeNull();
  });

  it("answers an empty listing for a commander nobody has published, after asking for that slug", async () => {
    const reader = inMemoryCommanderDeckReader();

    const listing = await listCommanderDecks(
      { decks: reader },
      { slug: "kenrith-the-returned-king", viewerId: null }
    );

    expect(listing).toEqual({
      slug: "kenrith-the-returned-king",
      commanderName: null,
      total: 0,
      decks: [],
    });
    expect(reader.requestedSlugs).toEqual(["kenrith-the-returned-king"]);
  });

  it("lets the reader's failure reach the caller", async () => {
    const failing: CommanderDeckReader = {
      listPublicDecksByCommanderSlug: () =>
        Promise.reject(new Error("DB connection lost")),
    };

    await expect(
      listCommanderDecks({ decks: failing }, { slug: SLUG, viewerId: null })
    ).rejects.toThrow("DB connection lost");
  });
});
