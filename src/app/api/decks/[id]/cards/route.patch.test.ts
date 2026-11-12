/**
 * PATCH /api/decks/[id]/cards applies a bulk edit as one versioned
 * transaction: every row change and the command zone are stored together or
 * not at all, the deck's `version` moves by one however many rows change, and
 * a writer that sends the version it last read (`expectedVersion`) is refused
 * with 409 when another write landed in between.
 *
 * Prisma is the in-memory fake of `@/test/deck-cards-db-fake`, which stores a
 * `$transaction` only when its callback resolves. Anything written outside
 * the transaction lands in the stored tables directly and shows up here.
 * Scryfall is a mock: the pair check reads card data only when both command
 * slots are filled with different printings.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CARDS_DECK, deckCardsDb } from "@/test/deck-cards-db-fake";
import { deckCard } from "@/test/playtest-db-fake";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));

const getCardCollection = vi.hoisted(() => vi.fn());
vi.mock(import("@/lib/scryfall/client"), () => ({ getCardCollection }));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  const { deckCardsDb: db } = await import("@/test/deck-cards-db-fake");
  return stubPrisma(await importOriginal(), db.prisma);
});

import { PATCH } from "./route";

const SOL_RING = "11111111-1111-4111-8111-111111111111";
const BREYA = "22222222-2222-4222-8222-222222222222";
const BREYA_REPRINT = "33333333-3333-4333-8333-333333333333";
const TYMNA = "44444444-4444-4444-8444-444444444444";

const FOREST_ROW = deckCard("Forest", { id: "forest-row", quantity: 10 });
const SIGNET_ROW = deckCard("Arcane Signet", {
  id: "signet-row",
  notes: "fixes",
});
const SAVED_CARDS = [FOREST_ROW, SIGNET_ROW];

/** The deck fields that record an empty command zone. */
const EMPTY_COMMAND_ZONE = {
  commanderId: null,
  commanderName: null,
  partnerId: null,
  companionId: null,
  pairingType: "none",
} as const;

const BREYA_COMMANDER_ROW = {
  scryfallId: BREYA,
  name: "Breya, Etherium Shaper",
  category: "commander",
  isCommander: true,
};

const STALE_BODY = {
  error: "The deck changed since it was opened — reload it and try again",
};

/** A Scryfall card with no partner ability, as the pair check reads it. */
function legendWithoutPartner(id: string, name: string, oracleId: string) {
  return {
    id,
    oracle_id: oracleId,
    name,
    type_line: "Legendary Creature",
    oracle_text: "",
    keywords: [],
  };
}

function patch(body: unknown): Promise<Response> {
  return PATCH(
    new Request(`http://localhost/api/decks/${CARDS_DECK.id}/cards`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: CARDS_DECK.id }) }
  );
}

function cardNames(): readonly string[] {
  return deckCardsDb.cards().map((card) => card.name);
}

beforeEach(() => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ user: { id: CARDS_DECK.userId } });
  deckCardsDb.reset(SAVED_CARDS);
  // Scryfall knows no card unless a test says so: an unknown pair is not judged.
  getCardCollection.mockReset();
  getCardCollection.mockResolvedValue({ data: [], not_found: [] });
});

describe("PATCH /api/decks/[id]/cards — bulk change set", () => {
  it("leaves the deck exactly as it was when a write fails halfway", async () => {
    // The version claim and the command-zone fields are written before the
    // rows; the first row write fails.
    deckCardsDb.failNextCardWrite();

    const response = await patch({
      removeCardIds: ["signet-row"],
      quantityChanges: [{ cardId: "forest-row", quantity: 9 }],
      addCards: [{ scryfallId: SOL_RING, name: "Sol Ring", category: "ramp" }],
      commandZone: {
        ...EMPTY_COMMAND_ZONE,
        commanderId: BREYA,
        commanderName: "Breya, Etherium Shaper",
      },
    });

    expect(response.status).toBe(500);
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });

  it.each([
    [
      "removes",
      {
        removeCardIds: ["other-deck-row"],
        quantityChanges: [{ cardId: "forest-row", quantity: 9 }],
      },
    ],
    [
      "resizes",
      {
        removeCardIds: ["signet-row"],
        quantityChanges: [{ cardId: "other-deck-row", quantity: 2 }],
      },
    ],
  ])(
    "rejects a change set that %s a row this deck no longer holds",
    async (_verb, changes) => {
      const otherDeckRow = deckCard("Sol Ring", {
        id: "other-deck-row",
        deckId: "deck-2",
      });
      deckCardsDb.reset([...SAVED_CARDS, otherDeckRow]);

      const response = await patch({ addCards: [], ...changes });

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toEqual(STALE_BODY);
      expect(deckCardsDb.cards()).toEqual([...SAVED_CARDS, otherDeckRow]);
      expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
    }
  );

  it("records the new command zone with the rows it adds", async () => {
    const response = await patch({
      removeCardIds: [],
      quantityChanges: [],
      addCards: [BREYA_COMMANDER_ROW],
      commandZone: {
        ...EMPTY_COMMAND_ZONE,
        commanderId: BREYA,
        commanderName: "Breya, Etherium Shaper",
      },
    });

    expect(response.status).toBe(200);
    expect(deckCardsDb.deck()).toMatchObject({
      commanderId: BREYA,
      commanderName: "Breya, Etherium Shaper",
    });
    expect(deckCardsDb.cards()).toContainEqual(
      expect.objectContaining({
        scryfallId: BREYA,
        isCommander: true,
        category: "commander",
      })
    );
  });

  it("clears a replaced command-zone slot by its rows' role, not by ids the client holds", async () => {
    // A commander picked by hand earlier is known to the editor by its printing
    // id; the database row has its own id. Two stale commander rows are left
    // over from earlier picks.
    deckCardsDb.reset([
      ...SAVED_CARDS,
      deckCard("Atraxa, Praetors' Voice", {
        id: "atraxa-row",
        category: "commander",
        isCommander: true,
      }),
      deckCard("Breya, Etherium Shaper", {
        id: "old-row",
        scryfallId: "breya-old",
        category: "commander",
        isCommander: true,
      }),
      deckCard("Tymna the Weaver", {
        id: "tymna-row",
        scryfallId: TYMNA,
        category: "commander",
        isCommander: true,
        isPartner: true,
      }),
    ]);

    const response = await patch({
      removeCardIds: [],
      quantityChanges: [],
      addCards: [BREYA_COMMANDER_ROW],
      clearCommandSlots: ["commander"],
      commandZone: {
        ...EMPTY_COMMAND_ZONE,
        commanderId: BREYA,
        commanderName: "Breya, Etherium Shaper",
        partnerId: TYMNA,
      },
    });

    expect(response.status).toBe(200);
    expect(
      deckCardsDb
        .cards()
        .filter((card) => card.isCommander)
        .map((card) => card.scryfallId)
    ).toEqual([TYMNA, BREYA]);
    expect(deckCardsDb.cards().map((card) => card.id)).toEqual(
      expect.arrayContaining(["forest-row", "signet-row", "tymna-row"])
    );
  });
});

describe("PATCH /api/decks/[id]/cards — the pair check it shares with the command-zone route", () => {
  it("refuses a partner that reprints the commander's Oracle card (CR 903.5b)", async () => {
    getCardCollection.mockResolvedValue({
      data: [
        legendWithoutPartner(BREYA, "Breya, Etherium Shaper", "oracle-breya"),
        legendWithoutPartner(
          BREYA_REPRINT,
          "Breya, Etherium Shaper",
          "oracle-breya"
        ),
      ],
      not_found: [],
    });

    const response = await patch({
      removeCardIds: [],
      quantityChanges: [],
      addCards: [],
      commandZone: {
        ...EMPTY_COMMAND_ZONE,
        commanderId: BREYA,
        commanderName: "Breya, Etherium Shaper",
        partnerId: BREYA_REPRINT,
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Commander and partner must be different cards",
    });
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });

  it("refuses a partner the commander has no partner ability for (CR 702.124)", async () => {
    getCardCollection.mockResolvedValue({
      data: [
        legendWithoutPartner(BREYA, "Breya, Etherium Shaper", "oracle-breya"),
        legendWithoutPartner(TYMNA, "Tymna the Weaver", "oracle-tymna"),
      ],
      not_found: [],
    });

    const response = await patch({
      removeCardIds: [],
      quantityChanges: [],
      addCards: [],
      commandZone: {
        ...EMPTY_COMMAND_ZONE,
        commanderId: BREYA,
        commanderName: "Breya, Etherium Shaper",
        partnerId: TYMNA,
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Commander and partner cannot share the command zone",
    });
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });

  it("asks Scryfall nothing when the edit leaves the command zone alone", async () => {
    const response = await patch({
      removeCardIds: [],
      quantityChanges: [{ cardId: "forest-row", quantity: 9 }],
      addCards: [],
    });

    expect(response.status).toBe(200);
    expect(getCardCollection).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/decks/[id]/cards — deck version", () => {
  const EDIT_OF_THREE_ROWS = {
    removeCardIds: ["signet-row"],
    quantityChanges: [{ cardId: "forest-row", quantity: 9 }],
    addCards: [{ scryfallId: SOL_RING, name: "Sol Ring", category: "ramp" }],
  };

  it("stores the edit, moves the version once for its three row changes and answers the deck with it", async () => {
    const response = await patch({
      ...EDIT_OF_THREE_ROWS,
      expectedVersion: CARDS_DECK.version,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      id: CARDS_DECK.id,
      version: CARDS_DECK.version + 1,
      cards: [
        expect.objectContaining({ name: "Forest", quantity: 9 }),
        expect.objectContaining({ name: "Sol Ring", deckId: CARDS_DECK.id }),
      ],
    });
    expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(
      CARDS_DECK.updatedAt.getTime()
    );
    expect(cardNames()).toEqual(["Forest", "Sol Ring"]);
    expect(deckCardsDb.deck().version).toBe(CARDS_DECK.version + 1);
  });

  it("moves the version without expectedVersion too, so today's client keeps working", async () => {
    const response = await patch(EDIT_OF_THREE_ROWS);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      version: CARDS_DECK.version + 1,
    });
    expect(deckCardsDb.deck().version).toBe(CARDS_DECK.version + 1);
  });

  it("answers 409 to an outdated expectedVersion and stores nothing", async () => {
    const response = await patch({
      ...EDIT_OF_THREE_ROWS,
      expectedVersion: CARDS_DECK.version - 1,
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(STALE_BODY);
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });

  it.each([
    ["negative", -1],
    ["fractional", 1.5],
    ["a word", "seven"],
  ])(
    "answers 400 to an expectedVersion that is %s and stores nothing",
    async (_kind, expectedVersion) => {
      const response = await patch({ ...EDIT_OF_THREE_ROWS, expectedVersion });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        error: "Invalid request body",
      });
      expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
      expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
    }
  );
});
