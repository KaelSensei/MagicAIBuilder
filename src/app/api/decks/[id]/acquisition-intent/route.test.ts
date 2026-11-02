import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireDeckOwner, upsertIntent, deleteIntent } = vi.hoisted(() => ({
  requireDeckOwner: vi.fn(),
  upsertIntent: vi.fn(),
  deleteIntent: vi.fn(),
}));

vi.mock("@/lib/auth/helpers", () => ({ requireDeckOwner }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    acquisitionIntent: { upsert: upsertIntent, delete: deleteIntent },
  },
}));

import { PUT } from "./route";

const request = (body: unknown) =>
  new Request("http://localhost/api/decks/deck-1/acquisition-intent", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

const params = { params: Promise.resolve({ id: "deck-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  requireDeckOwner.mockResolvedValue({ userId: "user-1", deck: { id: "deck-1", userId: "user-1" } });
  upsertIntent.mockResolvedValue({ mode: "proxy_now" });
  deleteIntent.mockResolvedValue({});
});

describe("PUT /api/decks/[id]/acquisition-intent", () => {
  it("persists proxy-now for the signed-in deck owner", async () => {
    const response = await PUT(request({ scryfallId: "printing-1", mode: "proxy_now" }), params);

    expect(response.status).toBe(200);
    expect(upsertIntent).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_deckId_scryfallId: { userId: "user-1", deckId: "deck-1", scryfallId: "printing-1" } },
      create: { userId: "user-1", deckId: "deck-1", scryfallId: "printing-1", mode: "proxy_now" },
    }));
  });

  it("removes the choice to restore the default buy-now state", async () => {
    const response = await PUT(request({ scryfallId: "printing-1", mode: "buy_now" }), params);

    expect(response.status).toBe(200);
    expect(deleteIntent).toHaveBeenCalledWith({
      where: { userId_deckId_scryfallId: { userId: "user-1", deckId: "deck-1", scryfallId: "printing-1" } },
    });
  });

  it("rejects invalid intent modes without writing", async () => {
    const response = await PUT(request({ scryfallId: "printing-1", mode: "later" }), params);

    expect(response.status).toBe(400);
    expect(upsertIntent).not.toHaveBeenCalled();
    expect(deleteIntent).not.toHaveBeenCalled();
  });
});
