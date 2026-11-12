/**
 * PATCH /api/decks/[id]/cards/[cardId]: the single-row edit route.
 *
 * Prisma is replaced by a one-row fake, so a test can read back what the
 * route stored, not only what it asked Prisma to write.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireDeckOwner: vi.fn(),
  findFirst: vi.fn(),
  updateCard: vi.fn(),
  claimDeckVersion: vi.fn(),
}));

vi.mock(import("@/lib/auth/helpers"), () => ({
  requireDeckOwner: mocks.requireDeckOwner,
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  const deckCard = { findFirst: mocks.findFirst, update: mocks.updateCard };
  // The deck repository claims the deck's next version and reads it back in
  // the card's transaction (lib/deck/deck-repository.ts).
  const deck = {
    updateMany: mocks.claimDeckVersion,
    findUnique: async () => ({ version: 1 }),
  };
  return stubPrisma(await importOriginal(), {
    deckCard,
    deck,
    // Here the transaction runs on the same mocks; route.atomic.test.ts and
    // route.version.test.ts check what a failure or a stale version stores.
    $transaction: (
      run: (tx: {
        deck: typeof deck;
        deckCard: typeof deckCard;
      }) => Promise<unknown>
    ) => run({ deck, deckCard }),
  });
});

import { PATCH } from "./route";

const params = { params: Promise.resolve({ id: "deck-1", cardId: "card-1" }) };

/** A deck row as the database holds it; `notes` is the only column these tests read back. */
interface StoredCardRow {
  readonly id: string;
  readonly deckId: string;
  readonly notes: string | null;
}

/** Makes the Prisma update mock merge its data into one stored row and return it. */
function storeOneRow(initial: StoredCardRow): () => StoredCardRow {
  let row = initial;
  mocks.updateCard.mockImplementation(
    async ({ data }: { data: Partial<StoredCardRow> }) => {
      row = { ...row, ...data };
      return row;
    }
  );
  return () => row;
}

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/decks/deck-1/cards/card-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/decks/[id]/cards/[cardId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireDeckOwner.mockResolvedValue({ deck: { id: "deck-1" } });
    mocks.findFirst.mockResolvedValue({ id: "card-1", deckId: "deck-1" });
    mocks.updateCard.mockResolvedValue({ id: "card-1" });
    mocks.claimDeckVersion.mockResolvedValue({ count: 1 });
  });

  it("updates printing fields without replacing the deck card", async () => {
    const request = new Request("http://localhost/api/decks/deck-1/cards/card-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scryfallId: "123e4567-e89b-12d3-a456-426614174000",
        imageUri: "https://cards.example/normal.jpg",
        artCropUri: "https://cards.example/art.jpg",
      }),
    });

    const response = await PATCH(request, params);

    expect(response.status).toBe(200);
    expect(mocks.updateCard).toHaveBeenCalledWith({
      where: { id: "card-1", deckId: "deck-1" },
      data: {
        scryfallId: "123e4567-e89b-12d3-a456-426614174000",
        imageUri: "https://cards.example/normal.jpg",
        artCropUri: "https://cards.example/art.jpg",
      },
    });
  });

  it("persists a valid card quantity", async () => {
    const request = new Request("http://localhost/api/decks/deck-1/cards/card-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 3 }),
    });

    const response = await PATCH(request, params);

    expect(response.status).toBe(200);
    expect(mocks.updateCard).toHaveBeenCalledWith({
      where: { id: "card-1", deckId: "deck-1" },
      data: { quantity: 3 },
    });
  });

  it("saves a card note and returns the stored row", async () => {
    const storedRow = storeOneRow({
      id: "card-1",
      deckId: "deck-1",
      notes: null,
    });

    const response = await PATCH(
      patchRequest({ notes: "Keep for creature-heavy pods" }),
      params
    );

    expect(response.status).toBe(200);
    expect(storedRow().notes).toBe("Keep for creature-heavy pods");
    await expect(response.json()).resolves.toMatchObject({
      id: "card-1",
      notes: "Keep for creature-heavy pods",
    });
  });

  it("clears a card note when notes is null", async () => {
    const storedRow = storeOneRow({
      id: "card-1",
      deckId: "deck-1",
      notes: "Old note",
    });

    const response = await PATCH(patchRequest({ notes: null }), params);

    expect(response.status).toBe(200);
    expect(storedRow().notes).toBeNull();
    await expect(response.json()).resolves.toMatchObject({
      id: "card-1",
      notes: null,
    });
  });

  it("rejects a note longer than the editor allows and writes nothing", async () => {
    const response = await PATCH(
      patchRequest({ notes: "x".repeat(1001) }),
      params
    );

    expect(response.status).toBe(400);
    expect(mocks.updateCard).not.toHaveBeenCalled();
  });
});
