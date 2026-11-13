/**
 * Pins, at the page boundary, that `/u/[username]` never hands one viewer's
 * follow state to the next through Next's data cache (master plan COM-01, the
 * safety net for COM-21, which rewrites this page around a use case).
 *
 * `page.test.tsx` pins each viewer's render with a pass-through cache. Here
 * the cache keeps its answers (`@/test/data-cache-stand-in`) and the page runs
 * for one viewer after another, as production requests arrive: a signed-out
 * visitor, a follower, a stranger. React's `cache()` is per request, and
 * outside a server request it is a pass-through, so every run below reads
 * anew, as a new request would. The test reads what the page hands its view
 * (`@/test/page-tree`); the view's rendering is pinned by its own tests.
 */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PublicProfileView } from "@/components/profile/PublicProfileView";
import { dataCache } from "@/test/data-cache-stand-in";
import { propsHandedTo } from "@/test/page-tree";

const {
  mockUserFindFirst,
  mockFollowCount,
  mockFollowFindUnique,
  mockRatingFindMany,
  mockAuth,
} = vi.hoisted(() => ({
  mockUserFindFirst: vi.fn(),
  mockFollowCount: vi.fn(),
  mockFollowFindUnique: vi.fn(),
  mockRatingFindMany: vi.fn(),
  mockAuth: vi.fn(),
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    user: { findFirst: mockUserFindFirst },
    userFollow: { count: mockFollowCount, findUnique: mockFollowFindUnique },
    deckRating: { findMany: mockRatingFindMany },
  });
});
vi.mock(import("next/cache"), () => import("@/test/data-cache-stand-in"));
vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));

import UserProfilePage from "./page";

/** The one viewer who follows Kael. */
const FAN = "fan";
/** A signed-in viewer who does not. */
const STRANGER = "stranger";
/** A signed-out visitor. */
const ANONYMOUS = null;

/** Kael's account as Prisma returns it under the public profile allowlist. */
const KAEL_RECORD = {
  id: "user-1",
  name: "Kael Sensei",
  username: "kael",
  image: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  decks: [],
};

/** The follow table holds one row: `fan` follows Kael. */
interface FollowQuery {
  readonly where: {
    readonly followerId_followingId: { readonly followerId: string };
  };
}
function followRowFor(query: FollowQuery): { id: string } | null {
  return query.where.followerId_followingId.followerId === FAN
    ? { id: "follow-1" }
    : null;
}

/** Runs the page as one request from `viewerId` and returns the follow state it hands the view. */
async function followStateShownTo(viewerId: string | null): Promise<boolean> {
  mockAuth.mockResolvedValue(
    viewerId === null ? null : { user: { id: viewerId } }
  );
  const tree = await UserProfilePage({
    params: Promise.resolve({ locale: "en", username: "kael" }),
  });
  const view = propsHandedTo(tree, PublicProfileView);
  expect(view).not.toBeNull();
  return view?.profile.isFollowing ?? false;
}

beforeEach(() => {
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);
  mockFollowCount.mockResolvedValue(0);
  mockFollowFindUnique.mockImplementation(followRowFor);
  mockRatingFindMany.mockResolvedValue([]);
});

afterEach(() => {
  for (const mock of [
    mockUserFindFirst,
    mockFollowCount,
    mockFollowFindUnique,
    mockRatingFindMany,
    mockAuth,
  ]) {
    mock.mockReset();
  }
  dataCache.reset();
});

it("serves every signed-out visitor the same page from one database read, with no follow state", async () => {
  expect(await followStateShownTo(ANONYMOUS)).toBe(false);
  expect(await followStateShownTo(ANONYMOUS)).toBe(false);

  expect(mockUserFindFirst).toHaveBeenCalledTimes(1);
  expect(dataCache.hits).toBe(1);
});

it("tells a follower who arrives after a signed-out visitor about their own follow", async () => {
  await followStateShownTo(ANONYMOUS);

  expect(await followStateShownTo(FAN)).toBe(true);
});

it("never tells a signed-out visitor who arrives after a follower that they follow", async () => {
  expect(await followStateShownTo(FAN)).toBe(true);

  expect(await followStateShownTo(ANONYMOUS)).toBe(false);
});

it("tells two signed-in viewers in a row each about their own follow, and only theirs", async () => {
  expect(await followStateShownTo(FAN)).toBe(true);
  expect(await followStateShownTo(STRANGER)).toBe(false);
  expect(await followStateShownTo(FAN)).toBe(true);

  expect(dataCache.size).toBe(0);
});
