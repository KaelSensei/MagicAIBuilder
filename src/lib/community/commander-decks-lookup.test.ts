// @vitest-environment node
/**
 * `findCommanderDecks` and `findCommanderDecksForViewer` share one read; the
 * page's variant adds Next's data cache for a signed-out visitor. The slug to
 * deck matching is SQL, exercised for real by e2e/community-discovery.spec.ts
 * against Postgres; here the id query is a stub and the tests pin the
 * plumbing: ids in, hydration, summaries out. Ranking, ratings and the
 * commander-name fallback are pinned by
 * `src/app/api/community/commanders/[slug]/decks/route.test.ts`.
 */
import type { unstable_cache } from "next/cache";
import { afterEach, expect, it, vi } from "vitest";

const { mockDeckFindMany, mockQueryRaw, mockUnstableCache } = vi.hoisted(
  () => ({
    mockDeckFindMany: vi.fn(),
    mockQueryRaw: vi.fn(),
    mockUnstableCache: vi.fn(),
  })
);

type UnstableCache = typeof unstable_cache;

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    deck: { findMany: mockDeckFindMany },
    $queryRaw: mockQueryRaw,
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

import { ANONYMOUS_READ_REVALIDATE_SECONDS } from "./anonymous-read-cache";
import {
  findCommanderDecks,
  findCommanderDecksForViewer,
} from "./commander-decks-lookup";

const ATRAXA = "Atraxa, Praetors' Voice";

/** A public Atraxa deck as Prisma returns it to the discovery read. */
function atraxaDeck(
  id: string,
  votes: readonly { userId: string; value: number }[] = []
) {
  return {
    id,
    name: `${ATRAXA} list`,
    format: "commander",
    commanderName: ATRAXA,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    user: { name: "Builder", username: "builder", image: null },
    cards: [{ name: ATRAXA, imageUri: "", artCropUri: "" }],
    votes: votes.map((vote) => ({ ...vote, deckId: id })),
    ratings: [],
    _count: { cards: 100 },
  };
}

/** Wires both reads: the id query finds these rows, the hydration returns them. */
function stubMatch(rows: readonly ReturnType<typeof atraxaDeck>[]) {
  mockQueryRaw.mockResolvedValue(rows.map((row) => ({ id: row.id })));
  mockDeckFindMany.mockResolvedValue(rows);
}

afterEach(() => {
  for (const mock of [mockDeckFindMany, mockQueryRaw, mockUnstableCache]) {
    mock.mockReset();
  }
});

it.each([
  ["findCommanderDecks", findCommanderDecks],
  ["findCommanderDecksForViewer", findCommanderDecksForViewer],
])(
  "%s hydrates exactly the decks the SQL slug match returned, dates as ISO strings",
  async (_name, find) => {
    stubMatch([atraxaDeck("a", [{ userId: "someone", value: 1 }])]);

    const listing = await find("atraxa-praetors-voice", null);

    expect(mockDeckFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["a"] } } })
    );
    expect(listing).toEqual({
      slug: "atraxa-praetors-voice",
      commanderName: ATRAXA,
      total: 1,
      decks: [
        {
          id: "a",
          name: `${ATRAXA} list`,
          format: "commander",
          updatedAt: "2026-01-01T00:00:00.000Z",
          cardCount: 100,
          commander: { name: ATRAXA, imageUri: "", artCropUri: "" },
          author: { name: "Builder", username: "builder", image: null },
          score: 1,
          upvotes: 1,
          downvotes: 0,
          viewerVote: null,
          averageRating: 0,
          ratingCount: 0,
          badge: null,
        },
      ],
    });
  }
);

it("answers an empty listing for a commander nobody has published", async () => {
  stubMatch([]);

  await expect(
    findCommanderDecks("kenrith-the-returned-king", null)
  ).resolves.toEqual({
    slug: "kenrith-the-returned-king",
    commanderName: null,
    total: 0,
    decks: [],
  });
});

// Before #1444 the commander was saved in three requests, and a failure between
// them left a deck with a `commanderName` and no `isCommander` row. Read as
// `commander: undefined`, one such deck made the whole page throw for everyone.
it("lists a deck whose commander row is missing, named after its commanderName and without an image", async () => {
  stubMatch([{ ...atraxaDeck("a"), cards: [] }]);

  const listing = await findCommanderDecks("atraxa-praetors-voice", null);

  expect(listing.total).toBe(1);
  expect(listing.commanderName).toBe(ATRAXA);
  expect(listing.decks[0]?.commander).toEqual({
    name: ATRAXA,
    imageUri: "",
    artCropUri: "",
  });
});

it("reports the signed-in viewer's own vote and nobody else's", async () => {
  stubMatch([
    atraxaDeck("a", [
      { userId: "me", value: -1 },
      { userId: "someone", value: 1 },
    ]),
  ]);

  const listing = await findCommanderDecks("atraxa-praetors-voice", "me");

  expect(listing.decks[0]?.viewerVote).toBe(-1);
  expect(listing.decks[0]).toMatchObject({
    score: 0,
    upvotes: 1,
    downvotes: 1,
  });
});

it("caps a listing at 50 decks while reporting the full total", async () => {
  stubMatch(Array.from({ length: 51 }, (_, i) => atraxaDeck(`deck-${i}`)));

  const listing = await findCommanderDecks("atraxa-praetors-voice", null);

  expect(listing.decks).toHaveLength(50);
  expect(listing.total).toBe(51);
});

it("lets a database error reach the caller", async () => {
  mockQueryRaw.mockRejectedValue(new Error("DB connection lost"));

  await expect(
    findCommanderDecks("atraxa-praetors-voice", null)
  ).rejects.toThrow("DB connection lost");
});

// ─── Caching ──────────────────────────────────────────────────────────────────

it("findCommanderDecks never touches the data cache", async () => {
  stubMatch([]);

  await findCommanderDecks("atraxa-praetors-voice", null);

  expect(mockUnstableCache).not.toHaveBeenCalled();
});

it("findCommanderDecksForViewer serves a signed-out visitor from the data cache for a minute", async () => {
  stubMatch([]);

  await findCommanderDecksForViewer("atraxa-praetors-voice", null);

  expect(mockUnstableCache).toHaveBeenCalledWith(
    expect.any(Function),
    ["commander-decks"],
    { revalidate: ANONYMOUS_READ_REVALIDATE_SECONDS }
  );
});

it("findCommanderDecksForViewer reads fresh for a signed-in viewer, whose vote is theirs alone", async () => {
  stubMatch([atraxaDeck("a", [{ userId: "me", value: 1 }])]);

  const listing = await findCommanderDecksForViewer(
    "atraxa-praetors-voice",
    "me"
  );

  expect(mockUnstableCache).not.toHaveBeenCalled();
  expect(listing.decks[0]?.viewerVote).toBe(1);
});
