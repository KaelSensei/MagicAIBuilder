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
});
