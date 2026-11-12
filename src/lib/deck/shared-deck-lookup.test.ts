// @vitest-environment node
/**
 * `findSharedDeck` and `findSharedDeckCached` share one lookup; the cached one
 * adds Next's data cache under the token's tag. The database is a stub that
 * answers `deck.findUnique`; what a link holder may read through it is pinned
 * by `src/app/api/share/route.test.ts` against in-memory decks.
 */
import type { unstable_cache } from "next/cache";
import { afterEach, expect, it, vi } from "vitest";
import type { ApiSharedDeck } from "@/lib/deck/share-types";

const { mockDeckFindUnique, mockUnstableCache } = vi.hoisted(() => ({
  mockDeckFindUnique: vi.fn(),
  mockUnstableCache: vi.fn(),
}));

type UnstableCache = typeof unstable_cache;

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    deck: { findUnique: mockDeckFindUnique },
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

import {
  SHARE_LINK_REVALIDATE_SECONDS,
  shareLinkCacheTag,
} from "@/lib/deck/share-link-cache";
import { findSharedDeck, findSharedDeckCached } from "./shared-deck-lookup";

/** A share token as `POST /api/decks/[id]/share` mints them: 12 base64url characters. */
const TOKEN = "abc123XYZ-_0";

const DECK: ApiSharedDeck = {
  id: "deck-1",
  name: "Atraxa Superfriends",
  format: "commander",
  targetBracket: 3,
  budget: null,
  cards: [],
};

afterEach(() => {
  mockDeckFindUnique.mockReset();
  mockUnstableCache.mockReset();
});

it.each([
  ["findSharedDeck", findSharedDeck],
  ["findSharedDeckCached", findSharedDeckCached],
])("%s finds the deck behind an enabled link", async (_name, find) => {
  mockDeckFindUnique.mockResolvedValue(DECK);

  await expect(find(TOKEN)).resolves.toEqual({ status: "found", deck: DECK });
});

it.each([
  ["findSharedDeck", findSharedDeck],
  ["findSharedDeckCached", findSharedDeckCached],
])(
  "%s reports an unknown or revoked token as not found",
  async (_name, find) => {
    mockDeckFindUnique.mockResolvedValue(null);

    await expect(find(TOKEN)).resolves.toEqual({ status: "not-found" });
  }
);

it.each([
  ["an empty token", ""],
  ["a token longer than 64 characters", "a".repeat(65)],
  ["a token with characters outside base64url", "abc 123<script>"],
])(
  "rejects %s as invalid without asking the database or the cache",
  async (_kind, token) => {
    await expect(findSharedDeck(token)).resolves.toEqual({
      status: "invalid-token",
    });
    await expect(findSharedDeckCached(token)).resolves.toEqual({
      status: "invalid-token",
    });

    expect(mockDeckFindUnique).not.toHaveBeenCalled();
    expect(mockUnstableCache).not.toHaveBeenCalled();
  }
);

it("accepts the base64url characters a minted token may contain", async () => {
  mockDeckFindUnique.mockResolvedValue(DECK);

  const lookup = await findSharedDeck("ab-_CD12EF34");

  expect(lookup.status).toBe("found");
});

it("lets a database failure reach the caller", async () => {
  mockDeckFindUnique.mockRejectedValue(new Error("DB connection lost"));

  await expect(findSharedDeck(TOKEN)).rejects.toThrow("DB connection lost");
});

// The tag is the one `DELETE /api/decks/[id]/share` passes to `revalidateTag`
// (OD-12: a revoked link stops working at once), and the window is the one the
// page served through its HTTP read before.
it("caches the read for the share-link window under the token's tag", async () => {
  mockDeckFindUnique.mockResolvedValue(DECK);

  await findSharedDeckCached(TOKEN);

  expect(mockUnstableCache).toHaveBeenCalledTimes(1);
  expect(mockUnstableCache).toHaveBeenCalledWith(
    expect.any(Function),
    ["shared-deck"],
    {
      revalidate: SHARE_LINK_REVALIDATE_SECONDS,
      tags: [shareLinkCacheTag(TOKEN)],
    }
  );
});

it("reads the database directly when not asked for the cached read", async () => {
  mockDeckFindUnique.mockResolvedValue(DECK);

  await findSharedDeck(TOKEN);

  expect(mockUnstableCache).not.toHaveBeenCalled();
});
