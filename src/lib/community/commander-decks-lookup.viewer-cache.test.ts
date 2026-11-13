// @vitest-environment node
/**
 * Pins that a listing's one viewer-relative field, `viewerVote`, never
 * reaches another viewer through Next's data cache (master plan COM-01, the
 * safety net for COM-22).
 *
 * `commander-decks-lookup.test.ts` pins, with a pass-through cache, *that* a
 * signed-out read is cached and a signed-in read is not. Here the cache keeps
 * its answers (`@/test/data-cache-stand-in`), so viewers read one after the
 * other through the same cache, as production requests do, and the test sees
 * what each of them is handed. The database is a stub with one deck that two
 * viewers voted on.
 */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { dataCache } from "@/test/data-cache-stand-in";

const { mockDeckFindMany, mockQueryRaw } = vi.hoisted(() => ({
  mockDeckFindMany: vi.fn(),
  mockQueryRaw: vi.fn(),
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    deck: { findMany: mockDeckFindMany },
    $queryRaw: mockQueryRaw,
  });
});
vi.mock(import("next/cache"), () => import("@/test/data-cache-stand-in"));

import {
  findCommanderDecks,
  findCommanderDecksForViewer,
} from "./commander-decks-lookup";

const ATRAXA = "Atraxa, Praetors' Voice";
const ATRAXA_SLUG = "atraxa-praetors-voice";

/** The viewer who upvoted the deck. */
const UPVOTER = "upvoter";
/** The viewer who downvoted it. */
const DOWNVOTER = "downvoter";
/** A signed-in viewer who has not voted. */
const BYSTANDER = "bystander";
/** A signed-out visitor. */
const ANONYMOUS = null;

/** The one public Atraxa deck, as Prisma returns it to the discovery read. */
const ATRAXA_DECK = {
  id: "deck-1",
  name: `${ATRAXA} list`,
  format: "commander",
  commanderName: ATRAXA,
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  user: { name: "Builder", username: "builder", image: null },
  cards: [{ name: ATRAXA, imageUri: "", artCropUri: "" }],
  votes: [
    { userId: UPVOTER, deckId: "deck-1", value: 1 },
    { userId: DOWNVOTER, deckId: "deck-1", value: -1 },
  ],
  ratings: [],
  _count: { cards: 100 },
};

/** `viewerVote` on the deck, as `viewerId` is told it by the page's read. */
async function voteShownTo(viewerId: string | null): Promise<number | null> {
  const listing = await findCommanderDecksForViewer(ATRAXA_SLUG, viewerId);
  return listing.decks[0]?.viewerVote ?? null;
}

beforeEach(() => {
  mockQueryRaw.mockResolvedValue([{ id: ATRAXA_DECK.id }]);
  mockDeckFindMany.mockResolvedValue([ATRAXA_DECK]);
});

afterEach(() => {
  mockDeckFindMany.mockReset();
  mockQueryRaw.mockReset();
  dataCache.reset();
});

// ─── The page's read ──────────────────────────────────────────────────────────

it("shows every signed-out visitor no vote of their own, from one database read", async () => {
  expect(await voteShownTo(ANONYMOUS)).toBeNull();
  expect(await voteShownTo(ANONYMOUS)).toBeNull();

  expect(mockQueryRaw).toHaveBeenCalledTimes(1);
  expect(dataCache.hits).toBe(1);
});

it("shows a voter who arrives after a signed-out visitor their own vote", async () => {
  await voteShownTo(ANONYMOUS);

  expect(await voteShownTo(UPVOTER)).toBe(1);
});

it("never shows a signed-out visitor who arrives after a voter that voter's vote", async () => {
  expect(await voteShownTo(UPVOTER)).toBe(1);

  expect(await voteShownTo(ANONYMOUS)).toBeNull();
});

it("shows signed-in viewers in a row each their own vote, and only theirs", async () => {
  expect(await voteShownTo(UPVOTER)).toBe(1);
  expect(await voteShownTo(DOWNVOTER)).toBe(-1);
  expect(await voteShownTo(BYSTANDER)).toBeNull();
  expect(await voteShownTo(UPVOTER)).toBe(1);
});

it("keeps only the signed-out answer in the cache, whoever reads first", async () => {
  await voteShownTo(UPVOTER);
  await voteShownTo(DOWNVOTER);
  await voteShownTo(ANONYMOUS);

  expect(dataCache.size).toBe(1);
  expect(dataCache.wraps).toHaveLength(1);
  expect(mockQueryRaw).toHaveBeenCalledTimes(3);
});

// ─── The route's read ─────────────────────────────────────────────────────────

it("the route's read never fills the cache, for a signed-out or a signed-in viewer", async () => {
  const voteThrough = async (viewerId: string | null) =>
    (await findCommanderDecks(ATRAXA_SLUG, viewerId)).decks[0]?.viewerVote;

  expect(await voteThrough(ANONYMOUS)).toBeNull();
  expect(await voteThrough(DOWNVOTER)).toBe(-1);
  expect(await voteThrough(ANONYMOUS)).toBeNull();

  expect(dataCache.size).toBe(0);
  expect(mockQueryRaw).toHaveBeenCalledTimes(3);
});
