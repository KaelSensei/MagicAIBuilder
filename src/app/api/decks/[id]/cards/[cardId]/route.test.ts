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
  updateDeck: vi.fn(),
}));

vi.mock("@/lib/auth/helpers", () => ({
  requireDeckOwner: mocks.requireDeckOwner,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deckCard: {
      findFirst: mocks.findFirst,
      update: mocks.updateCard,
    },
    deck: { update: mocks.updateDeck },
  },
}));

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
    mocks.updateDeck.mockResolvedValue({ id: "deck-1" });
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
      where: { id: "card-1" },
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
      where: { id: "card-1" },
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
