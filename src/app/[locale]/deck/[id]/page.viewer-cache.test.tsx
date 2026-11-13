/**
 * Pins, at the page boundary, that `/deck/[id]` never hands one viewer's deck
 * to the next (master plan COM-01, the safety net for COM-23, which rewrites
 * this page around a use case).
 *
 * The owner's whole deck and the public view share one URL, so the page reads
 * fresh for every viewer and never through Next's data cache. `page.test.tsx`
 * replaces the read and pins the metadata; this file is the one that runs the
 * real `findDeckForViewer` under the page. The database is a stub that answers
 * `deck.findUnique` by matching the query's `where` against one public deck,
 * and the page runs for one viewer after another, as production requests
 * arrive. React's `cache()` is per request, and outside a server request it is
 * a pass-through, so every run reads anew. The test reads what the page hands
 * its view (`@/test/page-tree`); the view's rendering is pinned by its own
 * tests.
 */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PublicDeckView } from "@/components/profile/PublicDeckView";
import { dataCache } from "@/test/data-cache-stand-in";
import { propsHandedTo } from "@/test/page-tree";

const { mockDeckFindUnique, mockAuth } = vi.hoisted(() => ({
  mockDeckFindUnique: vi.fn(),
  mockAuth: vi.fn(),
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    deck: { findUnique: mockDeckFindUnique },
  });
});
// Neither the page nor its read uses the data cache; the stand-in proves it stays so.
vi.mock(import("next/cache"), () => import("@/test/data-cache-stand-in"));
vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));

import PublicDeckPage from "./page";

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

/** The `where` of the two queries the read builds. */
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

/** Runs the page as one request from `viewerId` and returns the ownership it hands the view. */
async function ownershipShownTo(viewerId: string | null): Promise<boolean> {
  mockAuth.mockResolvedValue(
    viewerId === null ? null : { user: { id: viewerId } }
  );
  const tree = await PublicDeckPage({
    params: Promise.resolve({ locale: "en", id: DECK_ROW.id }),
  });
  const view = propsHandedTo(tree, PublicDeckView);
  expect(view).not.toBeNull();
  return view?.deck.isOwner ?? false;
}

beforeEach(() => {
  mockDeckFindUnique.mockImplementation(deckRowFor);
});

afterEach(() => {
  mockDeckFindUnique.mockReset();
  mockAuth.mockReset();
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

it("reads the deck anew for every viewer and never through the data cache", async () => {
  await ownershipShownTo(ANONYMOUS);
  await ownershipShownTo(ANONYMOUS);
  await ownershipShownTo(OWNER);

  // Each signed-out run is one public read; the owner's is one owned read.
  expect(mockDeckFindUnique).toHaveBeenCalledTimes(3);
  expect(dataCache.wraps).toHaveLength(0);
  expect(dataCache.size).toBe(0);
});
