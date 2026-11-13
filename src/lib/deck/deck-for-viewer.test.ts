// @vitest-environment node
/**
 * Pins that `findDeckForViewer` reads the database on every call, so a deck's
 * viewer-relative field, `isOwner`, and the owner-only columns behind it never
 * reach another viewer (master plan COM-01, the safety net for COM-23).
 *
 * The public deck page and `GET /api/deck/[id]` read through this module and
 * nothing else. Neither caches: the owner's whole deck and the public view
 * share one URL, so a kept answer would hand one viewer's deck to the next.
 * The database is a stub that answers `deck.findUnique` by matching the
 * query's `where` against one public deck, so the owner filter and the public
 * filter each find what they would in Postgres. What each view contains is
 * pinned by `src/app/api/deck/[id]/route.test.ts`.
 */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { dataCache } from "@/test/data-cache-stand-in";

const { mockDeckFindUnique } = vi.hoisted(() => ({
  mockDeckFindUnique: vi.fn(),
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    deck: { findUnique: mockDeckFindUnique },
  });
});
// The module does not use the data cache; the stand-in proves it stays so.
vi.mock(import("next/cache"), () => import("@/test/data-cache-stand-in"));

import { findDeckForViewer } from "./deck-for-viewer";

const OWNER = "owner-1";
const STRANGER = "stranger-1";
const ANONYMOUS = null;

/** The one deck in the database: public, owned by {@link OWNER}. */
const DECK_ROW = {
  id: "deck-1",
  userId: OWNER,
  isPublic: true,
  name: "Atraxa Superfriends",
  shareToken: "secret-token",
  cards: [],
  user: { id: OWNER, name: "Deck Owner", username: "owner", image: null },
};

/** The `where` of the two queries the module builds. */
interface DeckQuery {
  readonly where: {
    readonly id: string;
    readonly userId?: string;
    readonly isPublic?: boolean;
  };
}

/** Answers like Postgres would: every `where` column must match the row. */
function deckRowFor(query: DeckQuery): typeof DECK_ROW | null {
  const { id, userId, isPublic } = query.where;
  if (id !== DECK_ROW.id) return null;
  if (userId !== undefined && userId !== DECK_ROW.userId) return null;
  if (isPublic !== undefined && isPublic !== DECK_ROW.isPublic) return null;
  return DECK_ROW;
}

/** `isOwner` as `viewerId` is told it. */
async function ownershipShownTo(viewerId: string | null): Promise<boolean> {
  const deck = await findDeckForViewer(DECK_ROW.id, viewerId);
  return deck?.isOwner ?? false;
}

beforeEach(() => {
  mockDeckFindUnique.mockImplementation(deckRowFor);
});

afterEach(() => {
  mockDeckFindUnique.mockReset();
  dataCache.reset();
});

it("tells a signed-out visitor who arrives after the owner that the deck is not theirs", async () => {
  expect(await ownershipShownTo(OWNER)).toBe(true);

  expect(await ownershipShownTo(ANONYMOUS)).toBe(false);
});

it("tells the owner who arrives after a signed-out visitor that the deck is theirs", async () => {
  expect(await ownershipShownTo(ANONYMOUS)).toBe(false);

  expect(await ownershipShownTo(OWNER)).toBe(true);
});

it("tells a signed-in stranger who arrives after the owner that the deck is not theirs", async () => {
  expect(await ownershipShownTo(OWNER)).toBe(true);

  expect(await ownershipShownTo(STRANGER)).toBe(false);
});

it("asks the database on every read and never keeps an answer in the data cache", async () => {
  // Each read must reach the database. How many queries one read costs is the
  // visibility policy's business (COM-11 reads the deck's facts, then its
  // allowlist), so only "at least one more per read" is pinned here.
  for (const viewer of [OWNER, ANONYMOUS, ANONYMOUS]) {
    const before = mockDeckFindUnique.mock.calls.length;
    await ownershipShownTo(viewer);
    expect(mockDeckFindUnique.mock.calls.length).toBeGreaterThan(before);
  }
  expect(dataCache.wraps).toHaveLength(0);
  expect(dataCache.size).toBe(0);
});
