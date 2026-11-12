import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuth, findDecks, findCards } = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  findDecks: vi.fn(),
  findCards: vi.fn(),
}));

vi.mock(import("@/lib/auth/helpers"), () => ({ requireAuth }));
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    deck: { findMany: findDecks },
    collectionCard: { findMany: findCards },
  });
});

import { GET } from "./route";

const request = (query = "") => new Request(`http://localhost/api/collection/acquisition-plan${query}`);

beforeEach(() => {
  vi.clearAllMocks();
  requireAuth.mockResolvedValue({ session: { user: { id: "user-1" } } });
  findDecks.mockResolvedValue([
    { id: "a", name: "Artifacts", cards: [{ id: "row-a", scryfallId: "ring", name: "Sol Ring", quantity: 1, typeLine: "Artifact", price: 1, zone: "main", isCommander: false, isPartner: false }] },
    { id: "b", name: "Spells", cards: [{ id: "row-b", scryfallId: "ring", name: "Sol Ring", quantity: 1, typeLine: "Artifact", price: 1, zone: "main", isCommander: false, isPartner: false }] },
  ]);
  findCards.mockResolvedValue([{ scryfallId: "ring", quantity: 1 }]);
});

describe("GET /api/collection/acquisition-plan", () => {
  it("rejects anonymous users before reading private cards", async () => {
    requireAuth.mockResolvedValue({ error: new Response(null, { status: 401 }) });
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(findDecks).not.toHaveBeenCalled();
    expect(findCards).not.toHaveBeenCalled();
  });

  it("aggregates only the signed-in user's decks and owned copies", async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(findDecks.mock.calls[0][0].where).toEqual({ userId: "user-1" });
    expect(findCards.mock.calls[0][0].where).toEqual({ userId: "user-1" });
    expect(await response.json()).toEqual({
      deckCount: 2,
      decks: [{ id: "a", name: "Artifacts" }, { id: "b", name: "Spells" }],
      items: [expect.objectContaining({ scryfallId: "ring", requiredQuantity: 2, ownedQuantity: 1, acquireQuantity: 1 })],
    });
  });

  it("calculates only the selected deck while retaining all deck options", async () => {
    const response = await GET(request("?deckId=a"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      deckCount: 1,
      decks: [{ id: "a", name: "Artifacts" }, { id: "b", name: "Spells" }],
      items: [],
    });
  });

  it("does not expose another user's deck ID", async () => {
    const response = await GET(request("?deckId=foreign-deck"));
    expect(response.status).toBe(404);
  });

  describe("command zone", () => {
    // Flags as the deck editor saves them: the second commander carries both.
    const COMMANDER = { isCommander: true, isPartner: false };
    const SECOND_COMMANDER = { isCommander: true, isPartner: true };
    const OTHER = { isCommander: false, isPartner: false };

    const row = (
      scryfallId: string,
      price: number,
      flags: typeof COMMANDER,
      typeLine = "Legendary Creature"
    ) => ({
      id: `row-${scryfallId}`,
      scryfallId,
      name: scryfallId,
      quantity: 1,
      price,
      typeLine,
      zone: "main",
      ...flags,
    });

    const planFor = async (cards: readonly ReturnType<typeof row>[]) => {
      findDecks.mockResolvedValue([{ id: "pair", name: "Pair", cards }]);
      findCards.mockResolvedValue([]);
      const response = await GET(request());
      expect(response.status).toBe(200);
      return response.json();
    };

    const toBuy = (scryfallId: string) =>
      expect.objectContaining({
        scryfallId,
        ownedQuantity: 0,
        acquireQuantity: 1,
      });

    it("keeps both commanders of a partner pair", async () => {
      const plan = await planFor([
        row("tymna", 10, COMMANDER),
        row("thrasios", 20, SECOND_COMMANDER),
      ]);
      expect(plan.items).toEqual([toBuy("thrasios"), toBuy("tymna")]);
    });

    it("keeps a Background chosen by its commander", async () => {
      const background = "Legendary Enchantment — Background";
      const plan = await planFor([
        row("jaheira", 10, COMMANDER),
        row("raised-by-giants", 20, SECOND_COMMANDER, background),
      ]);
      expect(plan.items).toEqual([toBuy("raised-by-giants"), toBuy("jaheira")]);
    });

    it("keeps the companion beside a single commander", async () => {
      const plan = await planFor([
        row("kenrith", 10, COMMANDER),
        row("jegantha", 20, OTHER),
      ]);
      expect(plan.items).toEqual([toBuy("jegantha"), toBuy("kenrith")]);
    });
  });
});
