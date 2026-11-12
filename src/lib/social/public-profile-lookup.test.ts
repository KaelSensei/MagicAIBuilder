// @vitest-environment node
/**
 * `findPublicProfile` and `findPublicProfileForViewer` share one read; the
 * page's variant adds Next's data cache for a signed-out visitor. The database
 * is a stub; the badges a profile earns are pinned by
 * `src/app/api/users/[username]/route.test.ts`.
 */
import type { unstable_cache } from "next/cache";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const {
  mockUserFindFirst,
  mockFollowCount,
  mockFollowFindUnique,
  mockRatingFindMany,
  mockUnstableCache,
} = vi.hoisted(() => ({
  mockUserFindFirst: vi.fn(),
  mockFollowCount: vi.fn(),
  mockFollowFindUnique: vi.fn(),
  mockRatingFindMany: vi.fn(),
  mockUnstableCache: vi.fn(),
}));

type UnstableCache = typeof unstable_cache;

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    user: { findFirst: mockUserFindFirst },
    userFollow: { count: mockFollowCount, findUnique: mockFollowFindUnique },
    deckRating: { findMany: mockRatingFindMany },
  });
});
// Outside a Next request there is no data cache, and `unstable_cache` would
// throw. The stand-in records the cache options and hands the read back as it
// is, so the test sees what the cache would have been asked to keep.
vi.mock(import("next/cache"), () => ({
  unstable_cache: <Read extends Parameters<UnstableCache>[0]>(
    read: Read,
    keyParts?: Parameters<UnstableCache>[1],
    options?: Parameters<UnstableCache>[2]
  ): Read => {
    mockUnstableCache(read, keyParts, options);
    return read;
  },
}));

import { ANONYMOUS_READ_REVALIDATE_SECONDS } from "@/lib/community/anonymous-read-cache";
import { isUsername } from "./public-profile";
import {
  findPublicProfile,
  findPublicProfileForViewer,
} from "./public-profile-lookup";

/** Kael's account as Prisma returns it under the public profile allowlist. */
const KAEL_RECORD = {
  id: "user-1",
  name: "Kael Sensei",
  username: "kael",
  image: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  decks: [
    {
      id: "deck-1",
      name: "Atraxa Superfriends",
      description: null,
      format: "commander",
      targetBracket: 3,
      commanderId: null,
      isAIGenerated: false,
      createdAt: new Date("2026-01-02T00:00:00Z"),
      updatedAt: new Date("2026-01-03T00:00:00Z"),
      cards: [],
    },
  ],
};

beforeEach(() => {
  mockFollowCount.mockResolvedValue(0);
  mockFollowFindUnique.mockResolvedValue(null);
  mockRatingFindMany.mockResolvedValue([]);
});

afterEach(() => {
  for (const mock of [
    mockUserFindFirst,
    mockFollowCount,
    mockFollowFindUnique,
    mockRatingFindMany,
    mockUnstableCache,
  ]) {
    mock.mockReset();
  }
});

it.each([
  ["findPublicProfile", findPublicProfile],
  ["findPublicProfileForViewer", findPublicProfileForViewer],
])(
  "%s answers the profile with its stats and ISO dates",
  async (_name, find) => {
    mockUserFindFirst.mockResolvedValue(KAEL_RECORD);
    mockFollowCount.mockResolvedValueOnce(12).mockResolvedValueOnce(4);

    await expect(find("kael", null)).resolves.toEqual({
      id: "user-1",
      name: "Kael Sensei",
      username: "kael",
      image: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      decks: [
        {
          ...KAEL_RECORD.decks[0],
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-03T00:00:00.000Z",
        },
      ],
      followerCount: 12,
      followingCount: 4,
      isFollowing: false,
      badges: [],
    });
  }
);

it.each([
  ["findPublicProfile", findPublicProfile],
  ["findPublicProfileForViewer", findPublicProfileForViewer],
])(
  "%s answers null when no account carries the username",
  async (_name, find) => {
    mockUserFindFirst.mockResolvedValue(null);

    await expect(find("nobody", null)).resolves.toBeNull();
    expect(mockFollowCount).not.toHaveBeenCalled();
  }
);

it("matches the username case-insensitively, so /u/Kael and /u/kael are one profile", async () => {
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);

  await findPublicProfile("Kael", null);

  expect(mockUserFindFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { username: { equals: "Kael", mode: "insensitive" } },
    })
  );
});

it("reports isFollowing for a signed-in viewer who follows the profile", async () => {
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);
  mockFollowFindUnique.mockResolvedValue({ id: "follow-1" });

  const profile = await findPublicProfile("kael", "viewer-1");

  expect(profile?.isFollowing).toBe(true);
  expect(mockFollowFindUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        followerId_followingId: {
          followerId: "viewer-1",
          followingId: "user-1",
        },
      },
    })
  );
});

it("never reports the owner as following themselves, and does not ask", async () => {
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);

  const profile = await findPublicProfile("kael", "user-1");

  expect(profile?.isFollowing).toBe(false);
  expect(mockFollowFindUnique).not.toHaveBeenCalled();
});

it("lets a database error reach the caller", async () => {
  mockUserFindFirst.mockRejectedValue(new Error("DB connection lost"));

  await expect(findPublicProfile("kael", null)).rejects.toThrow(
    "DB connection lost"
  );
});

// ─── Caching ──────────────────────────────────────────────────────────────────

it("findPublicProfile never touches the data cache", async () => {
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);

  await findPublicProfile("kael", null);

  expect(mockUnstableCache).not.toHaveBeenCalled();
});

it("findPublicProfileForViewer serves a signed-out visitor from the data cache for a minute", async () => {
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);

  await findPublicProfileForViewer("kael", null);

  expect(mockUnstableCache).toHaveBeenCalledWith(
    expect.any(Function),
    ["public-profile"],
    { revalidate: ANONYMOUS_READ_REVALIDATE_SECONDS }
  );
});

it("findPublicProfileForViewer reads fresh for a signed-in viewer, whose follow state is theirs alone", async () => {
  mockUserFindFirst.mockResolvedValue(KAEL_RECORD);
  mockFollowFindUnique.mockResolvedValue({ id: "follow-1" });

  const profile = await findPublicProfileForViewer("kael", "viewer-1");

  expect(mockUnstableCache).not.toHaveBeenCalled();
  expect(profile?.isFollowing).toBe(true);
});

// ─── The username rule ────────────────────────────────────────────────────────

it.each(["kael", "Kael_Sensei-2", "a", "x".repeat(50)])(
  "accepts %s as a username",
  (username) => {
    expect(isUsername(username)).toBe(true);
  }
);

it.each(["", "a#b", "bad name!", "x".repeat(51), "émile"])(
  "rejects %j, which no account can carry",
  (username) => {
    expect(isUsername(username)).toBe(false);
  }
);
