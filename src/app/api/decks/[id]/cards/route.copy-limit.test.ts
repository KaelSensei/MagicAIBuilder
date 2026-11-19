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

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  const { deckCardsDb: db } = await import("@/test/deck-cards-db-fake");
  return stubPrisma(await importOriginal(), db.prisma);
});

import { POST } from "./route";

const SOL_RING_PRINTING = "11111111-1111-4111-8111-111111111111";

const SOL_RING = {
  scryfallId: SOL_RING_PRINTING,
  name: "Sol Ring",
  typeLine: "Artifact",
  oracleText: "{T}: Add {C}{C}.",
  category: "ramp",
};

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
    expect(await response.json()).toMatchObject({ name: "Sol Ring", quantity: 1 });
  });
});
