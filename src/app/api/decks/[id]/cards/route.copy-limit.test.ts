/**
 * The cards route stores at most the copy limit, as the editor does: POST and
 * the bulk edit (PATCH) clamp each card row to `copiesWithinLimit` of
 * `deckCopyLimit`, the store's rule, read with the deck's format and command
 * zone. The clamp is silent: the write succeeds and the stored row, which the
 * response carries, holds the clamped copies.
 *
 * Prisma is the in-memory fake of `@/test/deck-cards-db-fake`. No test fills
 * a command slot, so the pair checks never read Scryfall.
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

import { PATCH, POST } from "./route";

const SOL_RING_PRINTING = "11111111-1111-4111-8111-111111111111";

const SOL_RING = {
  scryfallId: SOL_RING_PRINTING,
  name: "Sol Ring",
  typeLine: "Artifact",
  oracleText: "{T}: Add {C}{C}.",
  category: "ramp",
};

const LIGHTNING_BOLT = {
  scryfallId: "22222222-2222-4222-8222-222222222222",
  name: "Lightning Bolt",
  typeLine: "Instant",
  oracleText: "Lightning Bolt deals 3 damage to any target.",
  category: "removal",
};
const FOREST = {
  scryfallId: "33333333-3333-4333-8333-333333333333",
  name: "Forest",
  typeLine: "Basic Land — Forest",
  category: "land",
};
const RELENTLESS_RATS = {
  scryfallId: "44444444-4444-4444-8444-444444444444",
  name: "Relentless Rats",
  typeLine: "Creature — Rat",
  oracleText:
    "Relentless Rats gets +1/+1 for each other creature on the battlefield named Relentless Rats.\nA deck can have any number of cards named Relentless Rats.",
  category: "creature",
};
const SEVEN_DWARVES = {
  scryfallId: "55555555-5555-4555-8555-555555555555",
  name: "Seven Dwarves",
  typeLine: "Creature — Dwarf",
  oracleText:
    "Seven Dwarves gets +1/+1 for each other creature named Seven Dwarves you control.\nA deck can have up to seven cards named Seven Dwarves.",
  category: "creature",
};

const MODERN_DECK = { ...CARDS_DECK, format: "modern" };

const SOL_RING_ROW = deckCard("Sol Ring", {
  id: "sol-ring-row",
  typeLine: SOL_RING.typeLine,
  oracleText: SOL_RING.oracleText,
});

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

/** The stored copies of `name`, one entry per row. */
function storedCopies(name: string): readonly number[] {
  return deckCardsDb
    .cards()
    .filter((card) => card.name === name)
    .map((card) => card.quantity);
}

beforeEach(() => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ user: { id: CARDS_DECK.userId } });
  deckCardsDb.reset([]);
});

describe("POST /api/decks/[id]/cards — copy limit", () => {
  it("stores one Sol Ring when three are added to a Commander deck", async () => {
    const response = await post({ ...SOL_RING, quantity: 3 });

    expect(response.status).toBe(201);
    expect(storedCopies("Sol Ring")).toEqual([1]);
    expect(await response.json()).toMatchObject({
      name: "Sol Ring",
      quantity: 1,
    });
  });

  it("keeps four Lightning Bolts in a Modern deck and refuses a second row of them (CR 100.2a)", async () => {
    deckCardsDb.reset([], MODERN_DECK);

    await post({ ...LIGHTNING_BOLT, quantity: 4 });
    const second = await post({ ...LIGHTNING_BOLT, quantity: 5 });

    expect(second.status).toBe(409);
    expect(storedCopies("Lightning Bolt")).toEqual([4]);
  });

  it("keeps thirty Forests, a basic land, in a Commander deck", async () => {
    await post({ ...FOREST, quantity: 30 });

    expect(storedCopies("Forest")).toEqual([30]);
  });

  it("keeps thirty Relentless Rats, whose text allows any number", async () => {
    await post({ ...RELENTLESS_RATS, quantity: 30 });

    expect(storedCopies("Relentless Rats")).toEqual([30]);
  });

  it("stops Seven Dwarves at seven, as its text says", async () => {
    await post({ ...SEVEN_DWARVES, quantity: 9 });

    expect(storedCopies("Seven Dwarves")).toEqual([7]);
  });
});

describe("PATCH /api/decks/[id]/cards — copy limit", () => {
  it("stores one Sol Ring when a bulk edit raises it to four in a Commander deck", async () => {
    deckCardsDb.reset([SOL_RING_ROW]);

    const response = await patch({
      quantityChanges: [{ cardId: SOL_RING_ROW.id, quantity: 4 }],
    });

    expect(response.status).toBe(200);
    expect(storedCopies("Sol Ring")).toEqual([1]);
  });

  it("stores one Sol Ring when a bulk edit adds three to a Commander deck", async () => {
    const response = await patch({ addCards: [{ ...SOL_RING, quantity: 3 }] });

    expect(response.status).toBe(200);
    expect(storedCopies("Sol Ring")).toEqual([1]);
    expect(await response.json()).toMatchObject({
      cards: [expect.objectContaining({ name: "Sol Ring", quantity: 1 })],
    });
  });

  it("keeps four Lightning Bolts and thirty Forests in a Modern deck", async () => {
    const bolts = deckCard("Lightning Bolt", {
      id: "bolt-row",
      typeLine: LIGHTNING_BOLT.typeLine,
      oracleText: LIGHTNING_BOLT.oracleText,
    });
    deckCardsDb.reset([bolts], MODERN_DECK);

    const response = await patch({
      quantityChanges: [{ cardId: bolts.id, quantity: 4 }],
      addCards: [{ ...FOREST, quantity: 30 }],
    });

    expect(response.status).toBe(200);
    expect(storedCopies("Lightning Bolt")).toEqual([4]);
    expect(storedCopies("Forest")).toEqual([30]);
  });

  it("still refuses, as stale, a resize of a row the deck no longer holds", async () => {
    deckCardsDb.reset([SOL_RING_ROW]);

    const response = await patch({
      quantityChanges: [{ cardId: "gone-row", quantity: 4 }],
    });

    expect(response.status).toBe(409);
    expect(storedCopies("Sol Ring")).toEqual([1]);
  });
});
