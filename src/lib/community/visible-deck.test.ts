import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDeckFindUnique = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deck: {
      findUnique: mockDeckFindUnique,
    },
  },
}));

const { findVisibleDeck } = await import("./visible-deck");

/**
 * The visibility rule the community routes share.
 *
 * It was byte-identical in four route files and tested in none of them. Four
 * copies of a rule is four places to forget when it changes, and getting it
 * wrong in one of them does not fail loudly — it serves a private deck's
 * comments to a stranger.
 */

const PRIVATE_DECK = { id: "d1", userId: "owner", isPublic: false };
const PUBLIC_DECK = { id: "d1", userId: "owner", isPublic: true };

beforeEach(() => {
  mockDeckFindUnique.mockReset();
});

describe("findVisibleDeck", () => {
  it("returns a public deck to an anonymous viewer", async () => {
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);

    expect(await findVisibleDeck("d1", null)).toEqual(PUBLIC_DECK);
  });

  it("returns a public deck to any signed-in viewer", async () => {
    mockDeckFindUnique.mockResolvedValue(PUBLIC_DECK);

    expect(await findVisibleDeck("d1", "stranger")).toEqual(PUBLIC_DECK);
  });

  it("hides a private deck from an anonymous viewer", async () => {
    mockDeckFindUnique.mockResolvedValue(PRIVATE_DECK);

    expect(await findVisibleDeck("d1", null)).toBeNull();
  });

  it("hides a private deck from a viewer who does not own it", async () => {
    mockDeckFindUnique.mockResolvedValue(PRIVATE_DECK);

    expect(await findVisibleDeck("d1", "stranger")).toBeNull();
  });

  it("shows a private deck to its owner", async () => {
    mockDeckFindUnique.mockResolvedValue(PRIVATE_DECK);

    expect(await findVisibleDeck("d1", "owner")).toEqual(PRIVATE_DECK);
  });

  it("returns null for a deck that does not exist", async () => {
    mockDeckFindUnique.mockResolvedValue(null);

    expect(await findVisibleDeck("missing", "owner")).toBeNull();
  });

  it("does not treat an ownerless private deck as belonging to an anonymous viewer", async () => {
    // Both sides are null; `null === null` would make a deck with no owner
    // visible to everyone signed out.
    mockDeckFindUnique.mockResolvedValue({
      id: "d1",
      userId: null,
      isPublic: false,
    });

    expect(await findVisibleDeck("d1", null)).toBeNull();
  });
});
