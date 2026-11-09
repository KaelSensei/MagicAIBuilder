import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDeckFindFirst = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({
  prisma: { deck: { findFirst: mockDeckFindFirst } },
}));

import { DECK_IMAGE_SELECT, loadPublicDeckImage } from "./social-image";

/**
 * The data behind `/og/deck/{id}`.
 *
 * The image route answers anyone, signed out, with no rate limit, so what it
 * reads is what it can leak. These tests pin the two guarantees: the query
 * itself refuses private decks, and it reads only the columns the image prints.
 */

/** Columns a public surface must never read (I-36 requirement 1.4, plus secrets). */
const PRIVATE_COLUMNS = [
  "notes",
  "folderId",
  "budget",
  "shareToken",
  "shareEnabled",
  "manualBracket",
  "userId",
  "email",
  "description",
] as const;

function card(
  overrides: Partial<{
    name: string;
    quantity: number;
    colorIdentity: string[];
    isCommander: boolean;
    isPartner: boolean;
  }>
) {
  return {
    name: "Sol Ring",
    quantity: 1,
    colorIdentity: [],
    isCommander: false,
    isPartner: false,
    ...overrides,
  };
}

const PARTNER_DECK_ROW = {
  name: "Tymna Kraum Turbo",
  user: { name: "Kael", username: "kael" },
  cards: [
    card({
      name: "Kraum, Ludevic's Opus",
      colorIdentity: ["U", "R"],
      isCommander: true,
      isPartner: true,
    }),
    card({ name: "Sol Ring" }),
    card({ name: "Island", quantity: 30, colorIdentity: ["U"] }),
    card({
      name: "Tymna the Weaver",
      colorIdentity: ["W", "B"],
      isCommander: true,
    }),
  ],
};

beforeEach(() => {
  mockDeckFindFirst.mockReset();
});

describe("loadPublicDeckImage", () => {
  it("asks the database for a public deck only", async () => {
    mockDeckFindFirst.mockResolvedValue(null);

    await loadPublicDeckImage("deck-1");

    expect(mockDeckFindFirst).toHaveBeenCalledWith({
      where: { id: "deck-1", isPublic: true },
      select: DECK_IMAGE_SELECT,
    });
  });

  it("returns null when the deck is private or does not exist", async () => {
    // A private deck and a missing one are the same answer: the `isPublic`
    // filter in the query returns no row for either.
    mockDeckFindFirst.mockResolvedValue(null);

    expect(await loadPublicDeckImage("private-deck")).toBeNull();
  });

  it("skips the query for an id no deck can have", async () => {
    expect(await loadPublicDeckImage("x".repeat(51))).toBeNull();
    expect(await loadPublicDeckImage("")).toBeNull();
    expect(mockDeckFindFirst).not.toHaveBeenCalled();
  });

  it("projects the name, commanders, colour identity, card count and author", async () => {
    mockDeckFindFirst.mockResolvedValue(PARTNER_DECK_ROW);

    expect(await loadPublicDeckImage("deck-1")).toEqual({
      name: "Tymna Kraum Turbo",
      commanders: ["Tymna the Weaver", "Kraum, Ludevic's Opus"],
      colorIdentity: ["W", "U", "B", "R"],
      cardCount: 33,
      author: "Kael",
    });
  });

  it("falls back to the username when the author has no display name", async () => {
    mockDeckFindFirst.mockResolvedValue({
      ...PARTNER_DECK_ROW,
      user: { name: null, username: "kael" },
    });

    expect((await loadPublicDeckImage("deck-1"))?.author).toBe("kael");
  });

  it("prints no author when the deck has none", async () => {
    mockDeckFindFirst.mockResolvedValue({ ...PARTNER_DECK_ROW, user: null });

    expect((await loadPublicDeckImage("deck-1"))?.author).toBeNull();
  });

  it("takes the colour identity from the cards when the deck has no commander", async () => {
    mockDeckFindFirst.mockResolvedValue({
      name: "Pauper Elves",
      user: null,
      cards: [
        card({ name: "Llanowar Elves", quantity: 4, colorIdentity: ["G"] }),
        card({ name: "Lightning Bolt", quantity: 4, colorIdentity: ["R"] }),
      ],
    });

    expect(await loadPublicDeckImage("deck-1")).toMatchObject({
      commanders: [],
      colorIdentity: ["R", "G"],
      cardCount: 8,
    });
  });

  it("drops colour codes that are not mana colours", async () => {
    mockDeckFindFirst.mockResolvedValue({
      ...PARTNER_DECK_ROW,
      cards: [
        card({
          name: "Odd",
          colorIdentity: ["G", "<b>", "W"],
          isCommander: true,
        }),
      ],
    });

    expect((await loadPublicDeckImage("deck-1"))?.colorIdentity).toEqual([
      "W",
      "G",
    ]);
  });
});

describe("DECK_IMAGE_SELECT", () => {
  it("reads only the fields the image renders", () => {
    expect(DECK_IMAGE_SELECT).toEqual({
      name: true,
      user: { select: { name: true, username: true } },
      cards: {
        where: { zone: "main" },
        select: {
          name: true,
          quantity: true,
          colorIdentity: true,
          isCommander: true,
          isPartner: true,
        },
      },
    });
  });

  it.each(PRIVATE_COLUMNS)("never reads %s", (column) => {
    expect(JSON.stringify(DECK_IMAGE_SELECT)).not.toContain(`"${column}"`);
  });
});
