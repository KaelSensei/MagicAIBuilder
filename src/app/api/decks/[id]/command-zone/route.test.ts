/**
 * Ownership, input and pairing checks of PATCH /api/decks/[id]/command-zone.
 * The signed-out, other-user and malformed cases must store nothing.
 *
 * Scryfall, which the pair check consults, is served by MSW; the database is
 * the in-memory fake of `@/test/deck-cards-db-fake`.
 */
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SCRYFALL_API } from "@/lib/scryfall/constants";
import { CARDS_DECK, deckCardsDb } from "@/test/deck-cards-db-fake";
import { setupMsw } from "@/test/msw";
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
const TYMNA_PRINTING = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const SIGNET = deckCard("Arcane Signet", { category: "ramp" });

/** What Scryfall's collection endpoint knows of the two printings the pair check may look up. */
const SCRYFALL_COLLECTION = {
  data: [
    {
      id: ATRAXA_PRINTING,
      oracle_id: "atraxa-oracle",
      name: "Atraxa, Praetors' Voice",
      type_line: "Legendary Creature — Phyrexian Angel Horror",
      oracle_text: "Flying, vigilance, deathtouch, lifelink",
      keywords: [],
    },
    {
      id: TYMNA_PRINTING,
      oracle_id: "tymna-oracle",
      name: "Tymna the Weaver",
      type_line: "Legendary Creature — Human Cleric",
      oracle_text: "Partner",
      keywords: ["Partner"],
    },
  ],
  not_found: [],
};

/** How many times the route looked a pair up on Scryfall. */
let cardLookups = 0;
setupMsw(
  http.post(`${SCRYFALL_API}/cards/collection`, () => {
    cardLookups += 1;
    return HttpResponse.json(SCRYFALL_COLLECTION);
  })
);

const SEAT_ATRAXA = {
  removeCardIds: [],
  clearCommandSlots: ["commander"],
  addCards: [
    {
      scryfallId: ATRAXA_PRINTING,
      name: "Atraxa, Praetors' Voice",
      category: "commander",
      isCommander: true,
    },
  ],
  commandZone: {
    commanderId: ATRAXA_PRINTING,
    commanderName: "Atraxa, Praetors' Voice",
    pairingType: "none",
  },
};

function changeCommandZone(
  body: unknown,
  deckId = CARDS_DECK.id
): Promise<Response> {
  return PATCH(
    new Request(`http://localhost/api/decks/${deckId}/command-zone`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: deckId }) }
  );
}

/** The deck and its rows exactly as the test started. */
function expectNothingStored(): void {
  expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  expect(deckCardsDb.cards()).toEqual([SIGNET]);
}

beforeEach(() => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ user: { id: CARDS_DECK.userId } });
  deckCardsDb.reset([SIGNET]);
  cardLookups = 0;
});

describe("PATCH /api/decks/[id]/command-zone — who may write", () => {
  it("answers 401 when signed out and stores nothing", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await changeCommandZone(SEAT_ATRAXA);

    expect(response.status).toBe(401);
    expectNothingStored();
  });

  it("answers 403 to another user's deck and stores nothing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "someone-else" } });

    const response = await changeCommandZone(SEAT_ATRAXA);

    expect(response.status).toBe(403);
    expectNothingStored();
  });

  it("answers 404 for a deck that does not exist", async () => {
    const response = await changeCommandZone(SEAT_ATRAXA, "no-such-deck");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Deck not found" });
  });
});

describe("PATCH /api/decks/[id]/command-zone — the body", () => {
  it("answers 400 with the field errors to a pairing type the rules do not know", async () => {
    const response = await changeCommandZone({
      ...SEAT_ATRAXA,
      commandZone: { ...SEAT_ATRAXA.commandZone, pairingType: "duo" },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid request body",
      details: { fieldErrors: { commandZone: expect.any(Array) } },
    });
    expectNothingStored();
  });

  it("answers 400 to a negative expectedVersion and stores nothing", async () => {
    const response = await changeCommandZone({
      ...SEAT_ATRAXA,
      expectedVersion: -1,
    });

    expect(response.status).toBe(400);
    expectNothingStored();
  });

  it("answers 400 when the same printing would fill both command slots", async () => {
    const response = await changeCommandZone({
      ...SEAT_ATRAXA,
      commandZone: { ...SEAT_ATRAXA.commandZone, partnerId: ATRAXA_PRINTING },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Commander and partner must be different cards",
    });
    expect(cardLookups).toBe(0);
    expectNothingStored();
  });

  it("refuses a partner the stored commander cannot pair with (CR 702.124)", async () => {
    deckCardsDb.reset([SIGNET], {
      ...CARDS_DECK,
      commanderId: ATRAXA_PRINTING,
      commanderName: "Atraxa, Praetors' Voice",
    });

    const response = await changeCommandZone({
      removeCardIds: [],
      clearCommandSlots: ["partner"],
      addCards: [],
      commandZone: { partnerId: TYMNA_PRINTING, pairingType: "partner" },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Commander and partner cannot share the command zone",
    });
    expect(cardLookups).toBe(1);
    expect(deckCardsDb.deck().partnerId).toBeNull();
  });
});
