/**
 * DELETE and PATCH /api/decks/[id]/cards/[cardId] write the card row and the
 * deck's `updatedAt` as one unit (B2-09): both are stored, or neither is.
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

import { DELETE, PATCH } from "./route";

const SIGNET = deckCard("Arcane Signet", { category: "ramp" });
const FOREST = deckCard("Forest", { quantity: 10, category: "land" });
const SAVED_CARDS = [SIGNET, FOREST];

function params(cardId: string) {
  return { params: Promise.resolve({ id: CARDS_DECK.id, cardId }) };
}

function removeCard(cardId: string): Promise<Response> {
  return DELETE(
    new Request(`http://localhost/api/decks/${CARDS_DECK.id}/cards/${cardId}`, {
      method: "DELETE",
    }),
    params(cardId)
  );
}

function editCard(cardId: string, body: unknown): Promise<Response> {
  return PATCH(
    new Request(`http://localhost/api/decks/${CARDS_DECK.id}/cards/${cardId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    params(cardId)
  );
}

beforeEach(() => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ user: { id: CARDS_DECK.userId } });
  deckCardsDb.reset(SAVED_CARDS);
});

describe("DELETE /api/decks/[id]/cards/[cardId] — the card and the deck timestamp together", () => {
  it("removes the card and moves the deck's updatedAt", async () => {
    const response = await removeCard(SIGNET.id);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      version: CARDS_DECK.version + 1,
    });
    expect(deckCardsDb.cards()).toEqual([FOREST]);
    expect(deckCardsDb.deck().updatedAt.getTime()).toBeGreaterThan(
      CARDS_DECK.updatedAt.getTime()
    );
  });

  it("keeps the card when the deck update fails", async () => {
    deckCardsDb.failNextDeckTouch();

    const response = await removeCard(SIGNET.id);

    expect(response.status).toBe(500);
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });

  it("answers 404 for a card this deck does not hold and writes nothing", async () => {
    const response = await removeCard("card-missing");

    expect(response.status).toBe(404);
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });
});

describe("PATCH /api/decks/[id]/cards/[cardId] — the card and the deck timestamp together", () => {
  it("stores the edit, answers with the saved row and moves the deck's updatedAt", async () => {
    const response = await editCard(FOREST.id, {
      quantity: 12,
      zone: "sideboard",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ...FOREST,
      quantity: 12,
      zone: "sideboard",
      version: CARDS_DECK.version + 1,
    });
    expect(deckCardsDb.cards()).toEqual([
      SIGNET,
      { ...FOREST, quantity: 12, zone: "sideboard" },
    ]);
    expect(deckCardsDb.deck().updatedAt.getTime()).toBeGreaterThan(
      CARDS_DECK.updatedAt.getTime()
    );
  });

  it("keeps the card as it was when the deck update fails", async () => {
    deckCardsDb.failNextDeckTouch();

    const response = await editCard(FOREST.id, { quantity: 12 });

    expect(response.status).toBe(500);
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });
});
