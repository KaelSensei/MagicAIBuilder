import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDeckFindFirst, mockPackageFindFirst, mockCreateMany, mockDeckUpdate, mockRequireAuth } =
  vi.hoisted(() => ({
    mockDeckFindFirst: vi.fn(),
    mockPackageFindFirst: vi.fn(),
    mockCreateMany: vi.fn(),
    mockDeckUpdate: vi.fn(),
    mockRequireAuth: vi.fn(),
  }));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deck: { findFirst: mockDeckFindFirst, update: mockDeckUpdate },
    cardPackage: { findFirst: mockPackageFindFirst },
    deckCard: { createMany: mockCreateMany },
    $transaction: vi.fn((operations: readonly Promise<unknown>[]) => Promise.all(operations)),
  },
}));

import { POST } from "./route";

const context = { params: Promise.resolve({ packageId: "package-1" }) };
const request = () =>
  new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ deckId: "deck-1", acceptedScryfallIds: ["ready", "blocked"] }),
  });

describe("POST /api/community/card-packages/[packageId]/apply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ session: { user: { id: "user-1" } } });
    mockDeckFindFirst.mockResolvedValue({ format: "commander", cards: [
      { name: "Blue Commander", quantity: 1, isCommander: true, isPartner: false, typeLine: "Legendary Creature", colorIdentity: ["U"] },
    ] });
    mockPackageFindFirst.mockResolvedValue({ cards: [
      { scryfallId: "ready", name: "Island", quantity: 2, colorIdentity: ["U"], isBanned: false, isBasicLand: true, imageUri: "island.jpg" },
      { scryfallId: "blocked", name: "Red Spell", quantity: 1, colorIdentity: ["R"], isBanned: false, isBasicLand: false, imageUri: "red.jpg" },
    ] });
    mockCreateMany.mockResolvedValue({ count: 1 });
    mockDeckUpdate.mockResolvedValue({ id: "deck-1" });
  });

  it("adds only explicitly accepted cards that remain legal", async () => {
    const response = await POST(request(), context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ addedCount: 1, blockedCount: 1 });
    expect(mockCreateMany).toHaveBeenCalledWith({ data: [expect.objectContaining({
      deckId: "deck-1", scryfallId: "ready", name: "Island", quantity: 2,
    })] });
  });

  it("does not write when every accepted card is blocked", async () => {
    const blockedOnly = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ deckId: "deck-1", acceptedScryfallIds: ["blocked"] }),
    });

    const response = await POST(blockedOnly, context);
    expect(await response.json()).toEqual({ addedCount: 0, blockedCount: 1 });
    expect(mockCreateMany).not.toHaveBeenCalled();
  });
});
