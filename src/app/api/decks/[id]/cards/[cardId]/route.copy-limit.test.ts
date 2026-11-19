/**
 * PATCH /api/decks/[id]/cards/[cardId] stores at most the copy limit, as the
 * editor and the cards route do: a quantity edit is clamped silently to
 * `copiesWithinLimit` of `deckCopyLimit`, read with the deck's format and
 * command zone, and the response carries the stored row. An edit that names
 * no quantity leaves the stored copies alone.
 *
 * The ownership verdicts (401, 404, 403) are pinned here too, since the copy
 * rule is read in the same query as the owner check.
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

import { PATCH } from "./route";

const SOL_RING_ROW = deckCard("Sol Ring", {
  typeLine: "Artifact",
  oracleText: "{T}: Add {C}{C}.",
  category: "ramp",
});
const FOREST_ROW = deckCard("Forest", {
  typeLine: "Basic Land — Forest",
  category: "land",
});
const SEVEN_DWARVES_ROW = deckCard("Seven Dwarves", {
  typeLine: "Creature — Dwarf",
  oracleText:
    "Seven Dwarves gets +1/+1 for each other creature named Seven Dwarves you control.\nA deck can have up to seven cards named Seven Dwarves.",
  category: "creature",
});

/** Edits one row of `deckId` with the JSON `body`. */
function editRow(
  cardId: string,
  body: Record<string, unknown>,
  deckId: string = CARDS_DECK.id
): Promise<Response> {
  return PATCH(
    new Request(`http://localhost/api/decks/${deckId}/cards/${cardId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: deckId, cardId }) }
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
  deckCardsDb.reset([SOL_RING_ROW, FOREST_ROW, SEVEN_DWARVES_ROW]);
});

describe("PATCH /api/decks/[id]/cards/[cardId] — copy limit", () => {
  it("stores one Sol Ring when its row is raised to three in a Commander deck", async () => {
    const response = await editRow(SOL_RING_ROW.id, { quantity: 3 });

    expect(response.status).toBe(200);
    expect(storedCopies("Sol Ring")).toEqual([1]);
    expect(await response.json()).toMatchObject({
      name: "Sol Ring",
      quantity: 1,
    });
  });

  it("keeps thirty Forests, a basic land, in a Commander deck", async () => {
    const response = await editRow(FOREST_ROW.id, { quantity: 30 });

    expect(response.status).toBe(200);
    expect(storedCopies("Forest")).toEqual([30]);
  });

  it("stops Seven Dwarves at seven, as its text says", async () => {
    await editRow(SEVEN_DWARVES_ROW.id, { quantity: 9 });

    expect(storedCopies("Seven Dwarves")).toEqual([7]);
  });

  it("leaves the stored copies alone when the edit names no quantity", async () => {
    deckCardsDb.reset([{ ...SOL_RING_ROW, quantity: 3 }]);

    const response = await editRow(SOL_RING_ROW.id, { notes: "From the precon" });

    expect(response.status).toBe(200);
    expect(storedCopies("Sol Ring")).toEqual([3]);
  });
});

describe("PATCH /api/decks/[id]/cards/[cardId] — who may write", () => {
  it("answers 401 when signed out and stores nothing", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await editRow(SOL_RING_ROW.id, { quantity: 1 });

    expect(response.status).toBe(401);
    expect(deckCardsDb.deck().version).toBe(CARDS_DECK.version);
  });

  it("answers 404 for a deck that does not exist", async () => {
    const response = await editRow(SOL_RING_ROW.id, { quantity: 1 }, "no-such-deck");

    expect(response.status).toBe(404);
    expect(deckCardsDb.deck().version).toBe(CARDS_DECK.version);
  });

  it("answers 403 to another user's deck and stores nothing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "another-user" } });

    const response = await editRow(SOL_RING_ROW.id, { quantity: 1 });

    expect(response.status).toBe(403);
    expect(deckCardsDb.deck().version).toBe(CARDS_DECK.version);
  });
});
