/**
 * PATCH /api/decks/[id]/command-zone stores the command-zone rows and the
 * deck's command fields as one unit, under the deck's optimistic lock: either
 * the whole change is stored, or none of it is.
 *
 * Why: the browser used to send a commander change as three requests (the
 * deck fields, the new row, the old row's delete), and a failure between them
 * left the deck pointing at a commander with no row, or holding two commander
 * rows. Prisma is the in-memory fake of `@/test/deck-cards-db-fake`, which
 * stores a `$transaction` only when its callback resolves.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CARDS_DECK,
  deckCardsDb,
  type FakeCardsDeck,
} from "@/test/deck-cards-db-fake";
import { deckCard } from "@/test/playtest-db-fake";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  const { deckCardsDb: db } = await import("@/test/deck-cards-db-fake");
  return stubPrisma(await importOriginal(), db.prisma);
});

import { PATCH } from "./route";

const ATRAXA_PRINTING = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const KENRITH_PRINTING = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const ATRAXA_ROW = deckCard("Atraxa, Praetors' Voice", {
  scryfallId: ATRAXA_PRINTING,
  category: "commander",
  isCommander: true,
});
const SIGNET = deckCard("Arcane Signet", { category: "ramp" });
/** Kenrith as a main-deck card, before a promotion. */
const KENRITH_IN_DECK = deckCard("Kenrith, the Returned King", {
  scryfallId: KENRITH_PRINTING,
  category: "creature",
});

/** The deck led by Atraxa, as the browser read it. */
const ATRAXA_DECK: FakeCardsDeck = {
  ...CARDS_DECK,
  commanderId: ATRAXA_PRINTING,
  commanderName: ATRAXA_ROW.name,
};

const KENRITH_COMMANDER_ROW = {
  scryfallId: KENRITH_PRINTING,
  name: "Kenrith, the Returned King",
  category: "commander",
  isCommander: true,
  isPartner: false,
};

/** The one request that replaces Atraxa with Kenrith. */
const REPLACE_COMMANDER = {
  removeCardIds: [],
  clearCommandSlots: ["commander"],
  addCards: [KENRITH_COMMANDER_ROW],
  commandZone: {
    commanderId: KENRITH_PRINTING,
    commanderName: "Kenrith, the Returned King",
    pairingType: "none",
  },
};

const STALE_BODY = {
  error: "The deck changed since it was opened — reload it and try again",
};

function changeCommandZone(body: unknown): Promise<Response> {
  return PATCH(
    new Request(`http://localhost/api/decks/${CARDS_DECK.id}/command-zone`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: CARDS_DECK.id }) }
  );
}

beforeEach(() => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ user: { id: CARDS_DECK.userId } });
  deckCardsDb.reset([ATRAXA_ROW, SIGNET], ATRAXA_DECK);
});

describe("PATCH /api/decks/[id]/command-zone — all or nothing", () => {
  it("replaces the commander: the old row leaves, the new row enters, the deck records it and the version moves", async () => {
    const response = await changeCommandZone(REPLACE_COMMANDER);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      cards: [{ name: "Kenrith, the Returned King", isCommander: true }],
      version: ATRAXA_DECK.version + 1,
    });
    expect(deckCardsDb.cards().map((card) => card.name)).toEqual([
      "Arcane Signet",
      "Kenrith, the Returned King",
    ]);
    expect(deckCardsDb.deck()).toMatchObject({
      commanderId: KENRITH_PRINTING,
      commanderName: "Kenrith, the Returned King",
      version: ATRAXA_DECK.version + 1,
    });
    expect(deckCardsDb.deck().updatedAt.getTime()).toBeGreaterThan(
      ATRAXA_DECK.updatedAt.getTime()
    );
  });

  it("leaves the deck's commanderId and every row unchanged when a row write fails", async () => {
    deckCardsDb.failNextCardWrite();

    const response = await changeCommandZone(REPLACE_COMMANDER);

    expect(response.status).toBe(500);
    expect(deckCardsDb.deck()).toEqual(ATRAXA_DECK);
    expect(deckCardsDb.cards()).toEqual([ATRAXA_ROW, SIGNET]);
  });

  it("answers 409 to an outdated expectedVersion and stores nothing", async () => {
    const response = await changeCommandZone({
      ...REPLACE_COMMANDER,
      expectedVersion: ATRAXA_DECK.version - 1,
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(STALE_BODY);
    expect(deckCardsDb.deck()).toEqual(ATRAXA_DECK);
    expect(deckCardsDb.cards()).toEqual([ATRAXA_ROW, SIGNET]);
  });

  it("promotes a deck card: its main-deck row leaves and its commander row enters in the same write", async () => {
    deckCardsDb.reset([ATRAXA_ROW, KENRITH_IN_DECK, SIGNET], ATRAXA_DECK);

    const response = await changeCommandZone({
      ...REPLACE_COMMANDER,
      removeCardIds: [KENRITH_IN_DECK.id],
    });

    expect(response.status).toBe(200);
    expect(
      deckCardsDb
        .cards()
        .map(({ name, isCommander }) => ({ name, isCommander }))
    ).toEqual([
      { name: "Arcane Signet", isCommander: false },
      { name: "Kenrith, the Returned King", isCommander: true },
    ]);
    expect(deckCardsDb.deck().commanderId).toBe(KENRITH_PRINTING);
  });

  it("clears the commander and partner together and empties the deck's command fields", async () => {
    const response = await changeCommandZone({
      removeCardIds: [],
      clearCommandSlots: ["commander", "partner"],
      addCards: [],
      commandZone: {
        commanderId: null,
        commanderName: null,
        partnerId: null,
        pairingType: "none",
      },
    });

    expect(response.status).toBe(200);
    expect(deckCardsDb.cards()).toEqual([SIGNET]);
    expect(deckCardsDb.deck()).toMatchObject({
      commanderId: null,
      commanderName: null,
      partnerId: null,
      pairingType: "none",
    });
  });
});
