import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireDeckOwner: vi.fn(),
  findSnapshot: vi.fn(),
  findDeck: vi.fn(),
  deleteMany: vi.fn(),
  createMany: vi.fn(),
}));

vi.mock(import("@/lib/auth/helpers"), () => ({
  requireDeckOwner: mocks.requireDeckOwner,
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    deckSnapshot: { findFirst: mocks.findSnapshot },
    deck: { findUnique: mocks.findDeck },
    $transaction: vi.fn(async (run: (tx: unknown) => Promise<void>) =>
      run({
        deckCard: {
          deleteMany: mocks.deleteMany,
          createMany: mocks.createMany,
        },
      })
    ),
  });
});

import { POST } from "./route";

const params = {
  params: Promise.resolve({ id: "deck-1", snapshotId: "snap-1" }),
};

/**
 * A stored snapshot row. Only the fields the restore route reads are set.
 *
 * @param cardList - Serialized deck cards captured when the snapshot was saved.
 * @returns The snapshot record the route loads.
 */
function snapshotOf(cardList: readonly Record<string, unknown>[]) {
  return { id: "snap-1", deckId: "deck-1", cardList };
}

describe("POST /api/decks/[id]/snapshots/[snapshotId]/restore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireDeckOwner.mockResolvedValue({
      userId: "user-1",
      deck: { id: "deck-1", userId: "user-1" },
    });
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    mocks.createMany.mockResolvedValue({ count: 1 });
    mocks.findDeck.mockResolvedValue({ id: "deck-1", cards: [] });
  });

  it("keeps the sideboard zone, notes, and power/toughness from the snapshot", async () => {
    mocks.findSnapshot.mockResolvedValue(
      snapshotOf([
        {
          scryfallId: "card-1",
          name: "Birds of Paradise",
          manaCost: "{G}",
          cmc: 1,
          typeLine: "Creature — Bird",
          oracleText: "Flying",
          colorIdentity: ["G"],
          isGameChanger: false,
          isBanned: false,
          price: 8,
          imageUri: "https://cards.scryfall.io/normal.jpg",
          artCropUri: "https://cards.scryfall.io/art.jpg",
          category: "ramp",
          quantity: 1,
          isCommander: false,
          isPartner: false,
          zone: "sideboard",
          notes: "flex mana dork",
          power: "0",
          toughness: "1",
        },
      ])
    );

    const response = await POST(new Request("http://localhost"), params);

    expect(response.status).toBe(200);
    expect(mocks.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          deckId: "deck-1",
          scryfallId: "card-1",
          name: "Birds of Paradise",
          zone: "sideboard",
          notes: "flex mana dork",
          power: "0",
          toughness: "1",
        }),
      ],
    });
  });
});
