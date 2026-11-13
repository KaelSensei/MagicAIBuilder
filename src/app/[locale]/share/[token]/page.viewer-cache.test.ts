/**
 * Pins why `/share/[token]` may cache its deck for every link holder at once
 * (master plan COM-01, the safety net for COM-24, which rewrites this page
 * around a use case).
 *
 * A share token is a capability: whoever holds the link sees the same deck,
 * and the page never asks who they are. Its cached answer therefore carries
 * no viewer-relative field, and handing one holder's answer to the next is
 * safe by construction. These tests pin both halves: the page never reads the
 * session, and two holders in a row share one cached, viewer-free answer.
 * Should the page ever read the session, the cache must become viewer-aware
 * first, and the first test here says so. The test reads what the page hands
 * its view (`@/test/page-tree`); the view's rendering is pinned by its own
 * tests.
 */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ShareDeckView } from "@/components/deck/ShareDeckView";
import type { ApiSharedDeck } from "@/lib/deck/share-types";
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
vi.mock(import("next/cache"), () => import("@/test/data-cache-stand-in"));
// The page does not import the session today. Mocking it still matters: the
// test fails the day the page starts reading it while its cache stays blind to the viewer.
vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));

import SharePage from "./page";

/** A share token as `POST /api/decks/[id]/share` mints them: 12 base64url characters. */
const TOKEN = "abc123XYZ-_0";

/** The deck behind the link, exactly as the share-link allowlist exposes it. */
const SHARED_DECK: ApiSharedDeck = {
  id: "deck-1",
  name: "Atraxa Superfriends",
  format: "commander",
  targetBracket: 3,
  budget: null,
  cards: [],
};

/**
 * The fields that depend on who is viewing, anywhere in the app. None may be
 * in a shared deck, because every holder of the link receives the same answer.
 */
const VIEWER_RELATIVE_FIELDS = [
  "isOwner",
  "isFollowing",
  "viewerVote",
  "isSaved",
] as const;

/** Runs the page as one request from `viewerId`, who holds the link, and returns the deck it hands the view. */
async function deckShownTo(viewerId: string | null): Promise<ApiSharedDeck> {
  mockAuth.mockResolvedValue(
    viewerId === null ? null : { user: { id: viewerId } }
  );
  const tree = await SharePage({
    params: Promise.resolve({ locale: "en", token: TOKEN }),
  });
  const view = propsHandedTo(tree, ShareDeckView);
  expect(view).not.toBeNull();
  return view?.deck ?? SHARED_DECK;
}

beforeEach(() => {
  mockDeckFindUnique.mockResolvedValue(SHARED_DECK);
});

afterEach(() => {
  mockDeckFindUnique.mockReset();
  mockAuth.mockReset();
  dataCache.reset();
});

it("never asks who holds the link, so its cached answer cannot depend on the viewer", async () => {
  await deckShownTo("owner-1");
  await deckShownTo(null);

  expect(mockAuth).not.toHaveBeenCalled();
});

it("serves the owner and a signed-out holder one cached answer, from one database read", async () => {
  const ownersDeck = await deckShownTo("owner-1");
  const visitorsDeck = await deckShownTo(null);

  expect(visitorsDeck).toBe(ownersDeck);
  expect(mockDeckFindUnique).toHaveBeenCalledTimes(1);
  expect(dataCache.hits).toBe(1);
});

it("hands the view a deck with no viewer-relative field", async () => {
  const deck = await deckShownTo("owner-1");

  for (const field of VIEWER_RELATIVE_FIELDS) {
    expect(deck).not.toHaveProperty(field);
  }
});
