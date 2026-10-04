import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDeckFindFirst, mockPackageFindFirst, mockRequireAuth, mockGetCardCollection } = vi.hoisted(() => ({
  mockDeckFindFirst: vi.fn(),
  mockPackageFindFirst: vi.fn(),
  mockRequireAuth: vi.fn(),
  mockGetCardCollection: vi.fn(),
}));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("@/lib/scryfall/client", () => ({ getCardCollection: mockGetCardCollection }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deck: { findFirst: mockDeckFindFirst },
    cardPackage: { findFirst: mockPackageFindFirst },
  },
}));

import { POST } from "./route";

const context = { params: Promise.resolve({ packageId: "package-1" }) };
const makeRequest = () =>
  new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ deckId: "deck-1" }),
  });

describe("POST /api/community/card-packages/[packageId]/preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ session: { user: { id: "user-1" } } });
    mockDeckFindFirst.mockResolvedValue({
      format: "commander",
      cards: [
        { name: "Commander", quantity: 1, isCommander: true, isPartner: false, typeLine: "Legendary Creature", colorIdentity: ["U"] },
        { name: "Counterspell", quantity: 1, isCommander: false, isPartner: false, typeLine: "Instant", colorIdentity: ["U"] },
      ],
    });
    mockPackageFindFirst.mockResolvedValue({
      cards: [
        { scryfallId: "card-1", name: "Counterspell", quantity: 1, colorIdentity: ["U"], isBanned: false, isBasicLand: false },
      ],
    });
    mockGetCardCollection.mockResolvedValue({ data: [{
      id: "card-1", name: "Counterspell", color_identity: ["U"], type_line: "Instant",
      legalities: { commander: "legal" }, image_uris: {},
    }], not_found: [] });
  });

  it("previews a visible package only against a deck owned by the caller", async () => {
    const response = await POST(makeRequest(), context);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ readyCount: 0, blockedCount: 1 });
    expect(mockDeckFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "deck-1", userId: "user-1" },
    }));
    expect(mockPackageFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "package-1", OR: [{ isPublic: true }, { authorId: "user-1" }] },
    }));
  });

  it("does not reveal an inaccessible target deck", async () => {
    mockDeckFindFirst.mockResolvedValue(null);
    expect((await POST(makeRequest(), context)).status).toBe(404);
    expect(mockPackageFindFirst).not.toHaveBeenCalled();
  });

  it("rejects a forged color identity using authoritative card data", async () => {
    mockPackageFindFirst.mockResolvedValue({ cards: [{
      scryfallId: "card-1", name: "Blue Spell", quantity: 1,
      colorIdentity: ["U"], isBanned: false, isBasicLand: false,
    }] });
    mockGetCardCollection.mockResolvedValue({ data: [{
      id: "card-1", name: "Red Spell", color_identity: ["R"], type_line: "Sorcery",
      legalities: { commander: "legal" }, image_uris: {},
    }], not_found: [] });

    const response = await POST(makeRequest(), context);
    expect(await response.json()).toMatchObject({
      readyCount: 0, blockedCount: 1,
      cards: [{ name: "Red Spell", status: "blocked", issues: [{ kind: "colorIdentity" }] }],
    });
  });
});
