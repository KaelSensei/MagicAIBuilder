/**
 * POST and DELETE /api/decks/[id]/cards write the card rows and the deck's
 * `updatedAt` as one unit (B2-09): both are stored, or neither is.
 *
 * Prisma is the in-memory fake of `@/test/deck-cards-db-fake`, which stores a
 * write made through `$transaction` only when the transaction succeeds. A
 * write made outside a transaction is stored at once, so a torn handler shows
 * up in what the fake still holds after the deck update fails.
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

import { DELETE, POST } from "./route";

const SOL_RING_PRINTING = "11111111-1111-4111-8111-111111111111";
const SAVED_CARDS = [
  deckCard("Arcane Signet"),
  deckCard("Forest", { quantity: 10 }),
];

function params() {
  return { params: Promise.resolve({ id: CARDS_DECK.id }) };
}

function addSolRing(): Promise<Response> {
  return POST(
    new Request(`http://localhost/api/decks/${CARDS_DECK.id}/cards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scryfallId: SOL_RING_PRINTING,
        name: "Sol Ring",
        category: "ramp",
      }),
    }),
    params()
  );
}

function removeAllCards(): Promise<Response> {
  return DELETE(
    new Request(`http://localhost/api/decks/${CARDS_DECK.id}/cards`, {
      method: "DELETE",
    }),
    params()
  );
}

beforeEach(() => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ user: { id: CARDS_DECK.userId } });
  deckCardsDb.reset(SAVED_CARDS);
});

describe("POST /api/decks/[id]/cards — the card and the deck timestamp together", () => {
  it("stores the card and moves the deck's updatedAt", async () => {
    const response = await addSolRing();

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      scryfallId: SOL_RING_PRINTING,
      name: "Sol Ring",
      deckId: CARDS_DECK.id,
    });
    expect(deckCardsDb.cards().map((card) => card.name)).toEqual([
      "Arcane Signet",
      "Forest",
      "Sol Ring",
    ]);
    expect(deckCardsDb.deck().updatedAt.getTime()).toBeGreaterThan(
      CARDS_DECK.updatedAt.getTime()
    );
  });

  it("leaves no card behind when the deck update fails", async () => {
    deckCardsDb.failNextDeckTouch();

    const response = await addSolRing();

    expect(response.status).toBe(500);
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });
});

describe("DELETE /api/decks/[id]/cards — every card and the deck timestamp together", () => {
  it("removes every card and moves the deck's updatedAt", async () => {
    const response = await removeAllCards();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      version: CARDS_DECK.version + 1,
    });
    expect(deckCardsDb.cards()).toEqual([]);
    expect(deckCardsDb.deck().updatedAt.getTime()).toBeGreaterThan(
      CARDS_DECK.updatedAt.getTime()
    );
  });

  it("keeps every card when the deck update fails", async () => {
    deckCardsDb.failNextDeckTouch();

    const response = await removeAllCards();

    expect(response.status).toBe(500);
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });
});
