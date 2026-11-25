/**
 * The cards route keeps a card's total copies within the copy limit, counted
 * across every row of the zones that make the deck: the main deck, the
 * sideboard and the command zone (CR 100.2a, CR 903.5b). Considering is not
 * part of the deck. The count is the editor's (`copiesCountedFor`), so a
 * second printing or a sideboard row cannot carry a copy past the limit.
 *
 * Prisma is the in-memory fake of `@/test/deck-cards-db-fake`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CARDS_DECK, deckCardsDb } from "@/test/deck-cards-db-fake";
import { deckCard } from "@/test/playtest-db-fake";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  const { deckCardsDb: db } = await import("@/test/deck-cards-db-fake");
  return stubPrisma(await importOriginal(), db.prisma);
});

import { STALE_DECK_ERROR } from "@/lib/api/versioned-deck-write";

import { PATCH, POST } from "./route";

const BOLT_TEXT = {
  name: "Lightning Bolt",
  typeLine: "Instant",
  oracleText: "Lightning Bolt deals 3 damage to any target.",
};

/** A Lightning Bolt printing the deck does not hold yet. */
const ANOTHER_BOLT_PRINTING = {
  ...BOLT_TEXT,
  scryfallId: "22222222-2222-4222-8222-222222222222",
  category: "removal",
};

const MODERN_DECK = { ...CARDS_DECK, format: "modern" };

function params() {
  return { params: Promise.resolve({ id: CARDS_DECK.id }) };
}

function post(body: Record<string, unknown>): Promise<Response> {
  return POST(
    new Request(`http://localhost/api/decks/${CARDS_DECK.id}/cards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    params()
  );
}

/** A bulk edit: no row removed, resized or added unless `edit` says so. */
function patch(edit: Record<string, unknown>): Promise<Response> {
  return PATCH(
    new Request(`http://localhost/api/decks/${CARDS_DECK.id}/cards`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        removeCardIds: [],
        quantityChanges: [],
        addCards: [],
        ...edit,
      }),
    }),
    params()
  );
}

/** The stored copies of `name`, one entry per row, in storage order. */
function storedCopies(name: string): readonly number[] {
  return deckCardsDb
    .cards()
    .filter((card) => card.name === name)
    .map((card) => card.quantity);
}

/** A stored Lightning Bolt row of `quantity` copies in `zone`. */
function boltRow(id: string, quantity: number, zone = "main") {
  return deckCard(BOLT_TEXT.name, { ...BOLT_TEXT, id, quantity, zone });
}

beforeEach(() => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ user: { id: CARDS_DECK.userId } });
  deckCardsDb.reset([]);
});

describe("PATCH /api/decks/[id]/cards — copies counted across rows", () => {
  it("stores no fifth Lightning Bolt from another printing when Main holds three and the Sideboard one (CR 100.2a)", async () => {
    deckCardsDb.reset(
      [boltRow("bolt-main", 3), boltRow("bolt-side", 1, "sideboard")],
      MODERN_DECK
    );

    const response = await patch({
      addCards: [{ ...ANOTHER_BOLT_PRINTING, zone: "main", quantity: 1 }],
    });

    expect(response.status).toBe(200);
    expect(storedCopies("Lightning Bolt")).toEqual([3, 1]);
  });

  it("keeps two printings at two copies each when the edit raises both to three", async () => {
    deckCardsDb.reset(
      [boltRow("bolt-a", 2), boltRow("bolt-b", 2)],
      MODERN_DECK
    );

    const response = await patch({
      quantityChanges: [
        { cardId: "bolt-a", quantity: 3 },
        { cardId: "bolt-b", quantity: 3 },
      ],
    });

    expect(response.status).toBe(200);
    expect(storedCopies("Lightning Bolt")).toEqual([2, 2]);
  });

  it("lets a row lowered in the same edit free its copies for another row's raise", async () => {
    deckCardsDb.reset(
      [boltRow("bolt-a", 1), boltRow("bolt-b", 3)],
      MODERN_DECK
    );

    await patch({
      quantityChanges: [
        { cardId: "bolt-a", quantity: 3 },
        { cardId: "bolt-b", quantity: 1 },
      ],
    });

    expect(storedCopies("Lightning Bolt")).toEqual([3, 1]);
  });

  it("lets a row removed in the same edit free its copies for an add", async () => {
    deckCardsDb.reset(
      [boltRow("bolt-main", 3), boltRow("bolt-side", 1, "sideboard")],
      MODERN_DECK
    );

    await patch({
      removeCardIds: ["bolt-main"],
      addCards: [{ ...ANOTHER_BOLT_PRINTING, zone: "main", quantity: 4 }],
    });

    expect(storedCopies("Lightning Bolt")).toEqual([1, 3]);
  });
});

describe("POST /api/decks/[id]/cards — copies counted across rows", () => {
  it("refuses a fifth Lightning Bolt from another printing with 409 and stores nothing (CR 100.2a)", async () => {
    deckCardsDb.reset(
      [boltRow("bolt-main", 3), boltRow("bolt-side", 1, "sideboard")],
      MODERN_DECK
    );

    const response = await post({ ...ANOTHER_BOLT_PRINTING, quantity: 1 });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: STALE_DECK_ERROR,
      reason: "copy-limit",
    });
    expect(storedCopies("Lightning Bolt")).toEqual([3, 1]);
    expect(deckCardsDb.deck().version).toBe(MODERN_DECK.version);
  });

  it("stores only the copies that fit when another printing asks for more", async () => {
    deckCardsDb.reset(
      [boltRow("bolt-main", 2), boltRow("bolt-side", 1, "sideboard")],
      MODERN_DECK
    );

    const response = await post({ ...ANOTHER_BOLT_PRINTING, quantity: 3 });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ quantity: 1 });
    expect(storedCopies("Lightning Bolt")).toEqual([2, 1, 1]);
  });

  it("refuses a sideboard Lightning Bolt when Main holds four (CR 100.4a)", async () => {
    deckCardsDb.reset([boltRow("bolt-main", 4)], MODERN_DECK);

    const response = await post({
      ...ANOTHER_BOLT_PRINTING,
      zone: "sideboard",
      quantity: 1,
    });

    expect(response.status).toBe(409);
    expect(storedCopies("Lightning Bolt")).toEqual([4]);
  });

  it("refuses the commander's name in Main of a Commander deck, the command zone counting (CR 903.5b)", async () => {
    const atraxa = {
      name: "Atraxa, Praetors' Voice",
      typeLine: "Legendary Creature — Phyrexian Angel Horror",
      oracleText: "Flying, vigilance, deathtouch, lifelink",
    };
    deckCardsDb.reset([
      deckCard(atraxa.name, { ...atraxa, id: "atraxa-row", isCommander: true }),
    ]);

    const response = await post({
      ...atraxa,
      scryfallId: "66666666-6666-4666-8666-666666666666",
      category: "creature",
    });

    expect(response.status).toBe(409);
    expect(storedCopies(atraxa.name)).toEqual([1]);
  });

  it("stores Considering copies whatever the deck holds: Considering is not part of it", async () => {
    deckCardsDb.reset([boltRow("bolt-main", 4)], MODERN_DECK);

    const response = await post({
      ...ANOTHER_BOLT_PRINTING,
      zone: "maybeboard",
      quantity: 3,
    });

    expect(response.status).toBe(201);
    expect(storedCopies("Lightning Bolt")).toEqual([4, 3]);
  });

  it("keeps adding Forests, a basic land, across rows and zones", async () => {
    const forest = { name: "Forest", typeLine: "Basic Land — Forest" };
    deckCardsDb.reset(
      [
        deckCard(forest.name, { ...forest, id: "forest-main", quantity: 20 }),
        deckCard(forest.name, {
          ...forest,
          id: "forest-side",
          quantity: 10,
          zone: "sideboard",
        }),
      ],
      MODERN_DECK
    );

    const response = await post({
      ...forest,
      scryfallId: "33333333-3333-4333-8333-333333333333",
      category: "land",
      quantity: 30,
    });

    expect(response.status).toBe(201);
    expect(storedCopies(forest.name)).toEqual([20, 10, 30]);
  });
});
