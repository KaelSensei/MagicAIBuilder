/**
 * Pins, at the page boundary, that `/commanders/[slug]/decks` never hands one
 * viewer's vote to the next through Next's data cache (master plan COM-01, the
 * safety net for COM-22, which rewrites this page around a use case).
 *
 * `page.test.tsx` pins each viewer's render with a pass-through cache. Here
 * the cache keeps its answers (`@/test/data-cache-stand-in`) and the page runs
 * for one viewer after another, as production requests arrive: a signed-out
 * visitor, the upvoter, the downvoter. React's `cache()` is per request, and
 * outside a server request it is a pass-through, so every run below reads
 * anew, as a new request would. The test reads what the page hands its view
 * (`@/test/page-tree`); the view's rendering is pinned by its own tests.
 */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CommanderDecksView } from "@/components/community/CommanderDecksView";
import { dataCache } from "@/test/data-cache-stand-in";
import { propsHandedTo } from "@/test/page-tree";

const { mockDeckFindMany, mockQueryRaw, mockAuth } = vi.hoisted(() => ({
  mockDeckFindMany: vi.fn(),
  mockQueryRaw: vi.fn(),
  mockAuth: vi.fn(),
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    deck: { findMany: mockDeckFindMany },
    $queryRaw: mockQueryRaw,
  });
});
vi.mock(import("next/cache"), () => import("@/test/data-cache-stand-in"));
vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));

import CommanderDecksPage from "./page";

const ATRAXA = "Atraxa, Praetors' Voice";
const ATRAXA_SLUG = "atraxa-praetors-voice";

/** The viewer who upvoted the deck. */
const UPVOTER = "upvoter";
/** The viewer who downvoted it. */
const DOWNVOTER = "downvoter";
/** A signed-out visitor. */
const ANONYMOUS = null;

/** The one public Atraxa deck, as Prisma returns it to the discovery read. */
const ATRAXA_DECK = {
  id: "deck-1",
  name: "Atraxa Superfriends",
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

/** Runs the page as one request from `viewerId` and returns the vote it hands the view as theirs. */
async function voteShownTo(viewerId: string | null): Promise<number | null> {
  mockAuth.mockResolvedValue(
    viewerId === null ? null : { user: { id: viewerId } }
  );
  const tree = await CommanderDecksPage({
    params: Promise.resolve({ locale: "en", slug: ATRAXA_SLUG }),
  });
  const view = propsHandedTo(tree, CommanderDecksView);
  expect(view).not.toBeNull();
  return view?.decks[0]?.viewerVote ?? null;
}

beforeEach(() => {
  mockQueryRaw.mockResolvedValue([{ id: ATRAXA_DECK.id }]);
  mockDeckFindMany.mockResolvedValue([ATRAXA_DECK]);
});

afterEach(() => {
  for (const mock of [mockDeckFindMany, mockQueryRaw, mockAuth]) {
    mock.mockReset();
  }
  dataCache.reset();
});

it("serves every signed-out visitor the same page from one database read, with no vote of their own", async () => {
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
  expect(await voteShownTo(DOWNVOTER)).toBe(-1);

  expect(await voteShownTo(ANONYMOUS)).toBeNull();
});

it("shows two voters in a row each their own vote, and only theirs", async () => {
  expect(await voteShownTo(UPVOTER)).toBe(1);
  expect(await voteShownTo(DOWNVOTER)).toBe(-1);
  expect(await voteShownTo(UPVOTER)).toBe(1);

  expect(dataCache.size).toBe(0);
});
