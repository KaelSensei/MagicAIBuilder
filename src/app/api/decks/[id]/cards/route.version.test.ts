/**
 * POST and DELETE /api/decks/[id]/cards under the deck's optimistic lock.
 *
 * Every card write moves `Deck.version` by one in the same transaction as the
 * card rows. A writer that sends the version it last read (`expectedVersion`)
 * is refused with 409 when another write landed in between, and nothing is
 * stored. A writer that sends none is not checked, so today's client keeps
 * working; its write still moves the version.
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

import { DELETE, POST } from "./route";

const SOL_RING_PRINTING = "11111111-1111-4111-8111-111111111111";
const SAVED_CARDS = [
  deckCard("Arcane Signet"),
  deckCard("Forest", { quantity: 10 }),
];
const STALE_BODY = {
  error: "The deck changed since it was opened — reload it and try again",
};

function cardsUrl(query = ""): string {
  return `http://localhost/api/decks/${CARDS_DECK.id}/cards${query}`;
}

function params() {
  return { params: Promise.resolve({ id: CARDS_DECK.id }) };
}

function addSolRing(extra: Record<string, unknown> = {}): Promise<Response> {
  return POST(
    new Request(cardsUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scryfallId: SOL_RING_PRINTING,
        name: "Sol Ring",
        category: "ramp",
        ...extra,
      }),
    }),
    params()
  );
}

function removeAllCards(query = ""): Promise<Response> {
  return DELETE(new Request(cardsUrl(query), { method: "DELETE" }), params());
}

beforeEach(() => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ user: { id: CARDS_DECK.userId } });
  deckCardsDb.reset(SAVED_CARDS);
});

describe("POST /api/decks/[id]/cards — deck version", () => {
  it("adds the card without expectedVersion, answers the deck's next version and stores it", async () => {
    const response = await addSolRing();

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      name: "Sol Ring",
      deckId: CARDS_DECK.id,
      version: CARDS_DECK.version + 1,
    });
    expect(deckCardsDb.deck().version).toBe(CARDS_DECK.version + 1);
  });

  it("adds the card when expectedVersion is the stored version", async () => {
    const response = await addSolRing({ expectedVersion: CARDS_DECK.version });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      name: "Sol Ring",
      version: CARDS_DECK.version + 1,
    });
    expect(deckCardsDb.cards().map((card) => card.name)).toEqual([
      "Arcane Signet",
      "Forest",
      "Sol Ring",
    ]);
  });

  it("answers 409 to an outdated expectedVersion and stores nothing", async () => {
    const response = await addSolRing({
      expectedVersion: CARDS_DECK.version - 1,
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(STALE_BODY);
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });

  it.each([
    ["a negative number", -1],
    ["a fraction", 1.5],
    ["a string", "7"],
  ])(
    "answers 400 to an expectedVersion that is %s and stores nothing",
    async (_label, expectedVersion) => {
      const response = await addSolRing({ expectedVersion });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        error: "Invalid request body",
        details: { fieldErrors: { expectedVersion: expect.any(Array) } },
      });
      expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
      expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
    }
  );

  it("keeps the version and the timestamp when the card write fails", async () => {
    deckCardsDb.failNextCardWrite();

    const response = await addSolRing({ expectedVersion: CARDS_DECK.version });

    expect(response.status).toBe(500);
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });
});

describe("DELETE /api/decks/[id]/cards — deck version", () => {
  it("removes every card without a query and answers the deck's next version", async () => {
    const response = await removeAllCards();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      version: CARDS_DECK.version + 1,
    });
    expect(deckCardsDb.cards()).toEqual([]);
  });

  it("removes every card when ?expectedVersion is the stored version", async () => {
    const response = await removeAllCards(
      `?expectedVersion=${CARDS_DECK.version}`
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      version: CARDS_DECK.version + 1,
    });
  });

  it("answers 409 to an outdated ?expectedVersion and keeps every card", async () => {
    const response = await removeAllCards(
      `?expectedVersion=${CARDS_DECK.version + 1}`
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(STALE_BODY);
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
    expect(deckCardsDb.deck()).toEqual(CARDS_DECK);
  });

  it.each([
    "?expectedVersion=",
    "?expectedVersion=-1",
    "?expectedVersion=seven",
  ])("answers 400 to the query %s and keeps every card", async (query) => {
    const response = await removeAllCards(query);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid request query",
      details: { fieldErrors: { expectedVersion: expect.any(Array) } },
    });
    expect(deckCardsDb.cards()).toEqual(SAVED_CARDS);
  });
});
