import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUserFindMany, mockDeckFindMany } = vi.hoisted(() => ({
  mockUserFindMany: vi.fn(),
  mockDeckFindMany: vi.fn(),
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    user: { findMany: mockUserFindMany },
    deck: { findMany: mockDeckFindMany },
  });
});

import { siteUrl } from "@/lib/seo/alternates";
import sitemap from "./sitemap";

/**
 * The sitemap route reads public records and hands them to `buildSitemap`.
 *
 * The database is replaced by in-memory users that honour the parts of a
 * Prisma query the route can use for profiles — the claimed-username filter
 * and a `_count` of decks, filtered or not — so these tests assert which
 * profile URLs a crawler receives, not which query the route builds.
 */

const UPDATED = new Date("2026-11-01T00:00:00Z");

interface StoredUser {
  readonly username: string | null;
  readonly decks: readonly { readonly isPublic: boolean }[];
}

/** The deck count a `_count` select asks for: every deck, or only public ones. */
type DeckCountSelect = boolean | { readonly where?: { readonly isPublic?: boolean } };

interface UserFindManyArgs {
  readonly select?: {
    readonly _count?: { readonly select?: { readonly decks?: DeckCountSelect } };
  };
}

function countDecks(
  decks: StoredUser["decks"],
  select: DeckCountSelect | undefined
): number {
  if (select === undefined || select === false) return 0;
  const isPublic = select === true ? undefined : select.where?.isPublic;
  return decks.filter(
    (deck) => isPublic === undefined || deck.isPublic === isPublic
  ).length;
}

function storeUsers(users: readonly StoredUser[]): void {
  mockUserFindMany.mockImplementation(async (args: UserFindManyArgs) => {
    const deckCount = args.select?._count?.select?.decks;
    return users
      .filter((user) => user.username !== null)
      .map((user) => ({
        username: user.username,
        updatedAt: UPDATED,
        ...(deckCount === undefined
          ? {}
          : { _count: { decks: countDecks(user.decks, deckCount) } }),
      }));
  });
}

async function profileUrls(): Promise<readonly string[]> {
  const entries = await sitemap();
  return entries.map((entry) => entry.url).filter((url) => url.includes("/u/"));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDeckFindMany.mockResolvedValue([]);
});

describe("sitemap profiles", () => {
  it("lists a profile whose owner has a public deck", async () => {
    storeUsers([{ username: "kael", decks: [{ isPublic: true }] }]);

    expect(await profileUrls()).toEqual([`${siteUrl()}/u/kael`]);
  });

  it("leaves out a profile whose decks are all private", async () => {
    // The profile page lists public decks only, so private decks leave it as
    // empty as no decks at all.
    storeUsers([
      { username: "kael", decks: [{ isPublic: true }] },
      { username: "secretive", decks: [{ isPublic: false }, { isPublic: false }] },
    ]);

    expect(await profileUrls()).toEqual([`${siteUrl()}/u/kael`]);
  });
});
