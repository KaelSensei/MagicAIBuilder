// @vitest-environment node
/**
 * Pins that a profile's one viewer-relative field, `isFollowing`, never
 * reaches another viewer through Next's data cache (master plan COM-01, the
 * safety net for COM-21).
 *
 * `public-profile-lookup.test.ts` pins, with a pass-through cache, *that* a
 * signed-out read is cached and a signed-in read is not. Here the cache keeps
 * its answers (`@/test/data-cache-stand-in`), so viewers read one after the
 * other through the same cache, as production requests do, and the test sees
 * what each of them is handed. The database is a stub whose follow row
 * belongs to one viewer, `fan`.
 */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { dataCache } from "@/test/data-cache-stand-in";

const {
  mockUserFindFirst,
  mockFollowCount,
  mockFollowFindUnique,
  mockRatingFindMany,
} = vi.hoisted(() => ({
  mockUserFindFirst: vi.fn(),
  mockFollowCount: vi.fn(),
  mockFollowFindUnique: vi.fn(),
  mockRatingFindMany: vi.fn(),
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

import {
  findPublicProfile,
  findPublicProfileForViewer,
} from "./public-profile-lookup";

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

/** `isFollowing` as `viewerId` is told it by the page's read. */
async function followStateShownTo(viewerId: string | null): Promise<boolean> {
  const profile = await findPublicProfileForViewer("kael", viewerId);
  return profile?.isFollowing ?? false;
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
  ]) {
    mock.mockReset();
  }
  dataCache.reset();
});

// ─── The page's read ──────────────────────────────────────────────────────────

it("tells every signed-out visitor nothing about following, from one database read", async () => {
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
});

it("keeps only the signed-out answer in the cache, whoever reads first", async () => {
  await followStateShownTo(FAN);
  await followStateShownTo(STRANGER);
  await followStateShownTo(ANONYMOUS);

  expect(dataCache.size).toBe(1);
  expect(dataCache.wraps).toHaveLength(1);
  expect(mockUserFindFirst).toHaveBeenCalledTimes(3);
});

// ─── The route's read ─────────────────────────────────────────────────────────

it("the route's read never fills the cache, for a signed-out or a signed-in viewer", async () => {
  expect((await findPublicProfile("kael", ANONYMOUS))?.isFollowing).toBe(false);
  expect((await findPublicProfile("kael", FAN))?.isFollowing).toBe(true);
  expect((await findPublicProfile("kael", ANONYMOUS))?.isFollowing).toBe(false);

  expect(dataCache.size).toBe(0);
  expect(mockUserFindFirst).toHaveBeenCalledTimes(3);
});
