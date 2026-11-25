/**
 * PATCH /api/decks/[id]/cards/[cardId] keeps a card's total copies within
 * the copy limit, counted across every row of the main deck, the sideboard
 * and the command zone (CR 100.2a, CR 903.5b), as the editor counts them. A
 * row moved in from Considering brings all its copies; a move with no room
 * for a single copy stores nothing and answers 409 with `reason:
 * "copy-limit"`.
 *
 * Prisma is the in-memory fake of `@/test/deck-cards-db-fake`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STALE_DECK_ERROR } from "@/lib/api/versioned-deck-write";
import { CARDS_DECK, deckCardsDb } from "@/test/deck-cards-db-fake";
import { deckCard } from "@/test/playtest-db-fake";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  const { deckCardsDb: db } = await import("@/test/deck-cards-db-fake");
  return stubPrisma(await importOriginal(), db.prisma);
});

import { PATCH } from "./route";

const BOLT_TEXT = {
  name: "Lightning Bolt",
  typeLine: "Instant",
  oracleText: "Lightning Bolt deals 3 damage to any target.",
};

const MODERN_DECK = { ...CARDS_DECK, format: "modern" };

/** A stored Lightning Bolt row of `quantity` copies in `zone`. */
function boltRow(id: string, quantity: number, zone = "main") {
  return deckCard(BOLT_TEXT.name, { ...BOLT_TEXT, id, quantity, zone });
}

/** Edits one row of the deck with the JSON `body`. */
function editRow(
  cardId: string,
  body: Record<string, unknown>
): Promise<Response> {
  return PATCH(
    new Request(`http://localhost/api/decks/${CARDS_DECK.id}/cards/${cardId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: CARDS_DECK.id, cardId }) }
  );
}

/** The stored row `id`, as zone and copies. */
function storedRow(id: string) {
  const row = deckCardsDb.cards().find((card) => card.id === id);
  return row === undefined
    ? undefined
    : { zone: row.zone, quantity: row.quantity };
}

beforeEach(() => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ user: { id: CARDS_DECK.userId } });
});

describe("PATCH /api/decks/[id]/cards/[cardId] — copies counted across rows", () => {
  it("refuses with 409 a Considering row moved into a Main that holds four, and stores nothing (CR 100.2a)", async () => {
    deckCardsDb.reset(
      [boltRow("bolt-main", 4), boltRow("bolt-considering", 2, "maybeboard")],
      MODERN_DECK
    );

    const response = await editRow("bolt-considering", { zone: "main" });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: STALE_DECK_ERROR,
      reason: "copy-limit",
    });
    expect(storedRow("bolt-considering")).toEqual({
      zone: "maybeboard",
      quantity: 2,
    });
  });

  it("moves a Considering row into Main with only the copies that fit", async () => {
    deckCardsDb.reset(
      [boltRow("bolt-main", 2), boltRow("bolt-considering", 3, "maybeboard")],
      MODERN_DECK
    );

    const response = await editRow("bolt-considering", { zone: "main" });

    expect(response.status).toBe(200);
    expect(storedRow("bolt-considering")).toEqual({
      zone: "main",
      quantity: 2,
    });
  });

  it("keeps a sideboard row at one when it is raised to four beside three in Main (CR 100.4a)", async () => {
    deckCardsDb.reset(
      [boltRow("bolt-main", 3), boltRow("bolt-side", 1, "sideboard")],
      MODERN_DECK
    );

    const response = await editRow("bolt-side", { quantity: 4 });

    expect(response.status).toBe(200);
    expect(storedRow("bolt-side")).toEqual({ zone: "sideboard", quantity: 1 });
  });

  it("moves a Main row to the Sideboard with all its copies: the deck's total does not change", async () => {
    deckCardsDb.reset(
      [boltRow("bolt-a", 3), boltRow("bolt-b", 1)],
      MODERN_DECK
    );

    const response = await editRow("bolt-a", { zone: "sideboard" });

    expect(response.status).toBe(200);
    expect(storedRow("bolt-a")).toEqual({ zone: "sideboard", quantity: 3 });
  });
});
