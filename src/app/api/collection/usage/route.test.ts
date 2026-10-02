import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuth, findCards } = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  findCards: vi.fn(),
}));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { deckCard: { findMany: findCards } } }));

import { GET } from "./route";

const request = (query = "scryfallId=printing-a") =>
  new Request(`http://localhost/api/collection/usage?${query}`);

beforeEach(() => {
  vi.clearAllMocks();
  requireAuth.mockResolvedValue({ session: { user: { id: "user-1" } } });
  findCards.mockResolvedValue([
    { deckId: "deck-a", quantity: 1, zone: "main", deck: { name: "Artifacts" } },
    { deckId: "deck-a", quantity: 2, zone: "sideboard", deck: { name: "Artifacts" } },
    { deckId: "deck-b", quantity: 1, zone: "main", deck: { name: "Spells" } },
  ]);
});

describe("GET /api/collection/usage", () => {
  it("rejects anonymous requests before reading decks", async () => {
    requireAuth.mockResolvedValue({ error: new Response(null, { status: 401 }) });
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(findCards).not.toHaveBeenCalled();
  });

  it("rejects a missing printing ID", async () => {
    const response = await GET(request(""));
    expect(response.status).toBe(400);
    expect(findCards).not.toHaveBeenCalled();
  });

  it("lists only the user's deck rows for the exact printing", async () => {
    const response = await GET(request());
    expect(findCards.mock.calls[0][0].where).toEqual({
      scryfallId: "printing-a",
      deck: { userId: "user-1" },
    });
    expect(await response.json()).toEqual({ usages: [
      { deckId: "deck-a", deckName: "Artifacts", quantity: 1, zone: "main" },
      { deckId: "deck-a", deckName: "Artifacts", quantity: 2, zone: "sideboard" },
      { deckId: "deck-b", deckName: "Spells", quantity: 1, zone: "main" },
    ] });
  });
});
