/**
 * PATCH and DELETE /api/decks/[id]/cards/[cardId] under the deck's
 * optimistic lock: each write moves `Deck.version` by one with the card row,
 * and an outdated `expectedVersion` is refused with 409 and stores nothing.
 * Without `expectedVersion` the write is not checked.
 *
 * Prisma is the in-memory fake of `@/test/deck-cards-db-fake`, which stores a
 * `$transaction` only when its callback resolves.
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
const STALE_BODY = {
  error: "The deck changed since it was opened — reload it and try again",
};

function cardUrl(cardId: string, query = ""): string {
  return `http://localhost/api/decks/${CARDS_DECK.id}/cards/${cardId}${query}`;
}

function params(cardId: string) {
  return { params: Promise.resolve({ id: CARDS_DECK.id, cardId }) };
}

function editCard(cardId: string, body: unknown): Promise<Response> {
  return PATCH(
    new Request(cardUrl(cardId), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    params(cardId)
  );
}

function removeCard(cardId: string, query = ""): Promise<Response> {
  return DELETE(
    new Request(cardUrl(cardId, query), { method: "DELETE" }),
    params(cardId)
  );
}

beforeEach(() => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ user: { id: CARDS_DECK.userId } });
  deckCardsDb.reset(SAVED_CARDS);
});

describe("PATCH /api/decks/[id]/cards/[cardId] — deck version", () => {
  it("stores the edit when expectedVersion is the stored version and answers the row with the next version", async () => {
    const response = await editCard(FOREST.id, {
      quantity: 12,
      expectedVersion: CARDS_DECK.version,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ...FOREST,
      quantity: 12,
      version: CARDS_DECK.version + 1,
    });
    expect(deckCardsDb.cards()).toEqual([SIGNET, { ...FOREST, quantity: 12 }]);
    expect(deckCardsDb.deck().version).toBe(CARDS_DECK.version + 1);
  });

  it("stores the edit without expectedVersion and never writes it as a card column", async () => {
    const response = await editCard(FOREST.id, { zone: "sideboard" });

    expect(response.status).toBe(200);
    expect(deckCardsDb.cards()).toEqual([
      SIGNET,
      { ...FOREST, zone: "sideboard" },
    ]);
    expect(deckCardsDb.deck().version).toBe(CARDS_DECK.version + 1);
  });

  it("answers 409 to an outdated expectedVersion and keeps the row as it was", async () => {
    const response = await editCard(FOREST.id, {
      quantity: 12,
      expectedVersion: CARDS_DECK.version - 2,
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(STALE_BODY);
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });

  it("keeps the version and the timestamp when the card write fails", async () => {
    deckCardsDb.failNextCardWrite();

    const response = await editCard(FOREST.id, { quantity: 12 });

    expect(response.status).toBe(500);
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });
});

describe("DELETE /api/decks/[id]/cards/[cardId] — deck version", () => {
  it("removes the card without a query and answers the deck's next version", async () => {
    const response = await removeCard(SIGNET.id);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      version: CARDS_DECK.version + 1,
    });
    expect(deckCardsDb.cards()).toEqual([FOREST]);
  });

  it("removes the card when ?expectedVersion is the stored version", async () => {
    const response = await removeCard(
      SIGNET.id,
      `?expectedVersion=${CARDS_DECK.version}`
    );

    expect(response.status).toBe(200);
    expect(deckCardsDb.cards()).toEqual([FOREST]);
    expect(deckCardsDb.deck().version).toBe(CARDS_DECK.version + 1);
  });

  it("answers 409 to an outdated ?expectedVersion and keeps the card", async () => {
    const response = await removeCard(
      SIGNET.id,
      `?expectedVersion=${CARDS_DECK.version - 1}`
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(STALE_BODY);
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });

  it("answers 400 to a malformed ?expectedVersion and keeps the card", async () => {
    const response = await removeCard(SIGNET.id, "?expectedVersion=1e3");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid request query",
      details: { fieldErrors: { expectedVersion: expect.any(Array) } },
    });
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
  });
});
