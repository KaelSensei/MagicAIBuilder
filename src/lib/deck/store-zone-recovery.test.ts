import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckCard } from "./types";
import { createEmptyDeck } from "./store-factories";

const mocks = vi.hoisted(() => ({
  updateCardZone: vi.fn(),
  addToast: vi.fn(),
}));

vi.mock("@/lib/db/deck-api", () => ({ updateCardZone: mocks.updateCardZone }));
vi.mock("@/hooks/useToast", () => ({
  useToastStore: { getState: () => ({ add: mocks.addToast }) },
}));

const { useDeckStore } = await import("./store");

/**
 * Seed one owned deck with a main-zone card.
 * @returns The seeded card.
 */
function seedDeck(): DeckCard {
  const card: DeckCard = {
    id: "card-1",
    name: "Sol Ring",
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Artifact",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "artifact",
    quantity: 1,
    zone: "main",
  };
  const deck = createEmptyDeck("deck-1", "Test deck");
  deck.cards = [card];
  useDeckStore.setState({
    decks: { "deck-1": deck },
    activeDeckId: "deck-1",
    isSyncing: false,
  });
  return card;
}

describe("deck zone save recovery", () => {
  it("keeps the save indicator active until both cards finish moving", async () => {
    const original = seedDeck();
    const deck = useDeckStore.getState().decks["deck-1"];
    deck.cards.push({ ...original, id: "card-2", name: "Island" });
    let finishSecond = () => {};
    const secondSave = new Promise<void>((resolve) => { finishSecond = resolve; });
    mocks.updateCardZone.mockResolvedValueOnce(undefined).mockReturnValueOnce(secondSave);

    const first = useDeckStore.getState().moveCardToZone("card-1", "sideboard");
    const second = useDeckStore.getState().moveCardToZone("card-2", "maybeboard");
    await first;
    const syncingWhileSecondPending = useDeckStore.getState().isSyncing;
    finishSecond();
    await second;

    expect(syncingWhileSecondPending).toBe(true);
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("restores only failed cards when a bulk move partially succeeds", async () => {
    const original = seedDeck();
    const deck = useDeckStore.getState().decks["deck-1"];
    deck.cards.push({ ...original, id: "card-2", name: "Island" });
    mocks.updateCardZone
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("offline"));

    await useDeckStore.getState().bulkMoveToZone(["card-1", "card-2"], "maybeboard");

    const saved = useDeckStore.getState().decks["deck-1"];
    expect(saved.cards.map(({ id, zone }) => ({ id, zone }))).toEqual([
      { id: "card-1", zone: "maybeboard" },
      { id: "card-2", zone: "main" },
    ]);
    expect(saved.maybeboard.map(({ id }) => id)).toEqual(["card-1"]);
    expect(mocks.addToast).toHaveBeenCalledWith("error", expect.stringContaining("move"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck();
  });

  it("restores the previous zone and notifies when a move fails", async () => {
    mocks.updateCardZone.mockRejectedValueOnce(new Error("offline"));

    await useDeckStore.getState().moveCardToZone("card-1", "maybeboard");

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.cards[0].zone).toBe("main");
    expect(deck.maybeboard).toHaveLength(0);
    expect(useDeckStore.getState().isSyncing).toBe(false);
    expect(mocks.addToast).toHaveBeenCalledWith("error", expect.stringContaining("move"));
  });

  it("restores the last saved zone when two rapid moves both fail", async () => {
    mocks.updateCardZone.mockRejectedValue(new Error("offline"));

    const first = useDeckStore.getState().moveCardToZone("card-1", "sideboard");
    const second = useDeckStore.getState().moveCardToZone("card-1", "maybeboard");
    await Promise.all([first, second]);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.cards[0].zone).toBe("main");
    expect(deck.maybeboard).toHaveLength(0);
    expect(mocks.updateCardZone).toHaveBeenCalledTimes(2);
  });

  it("returns to the first saved zone when the second move fails", async () => {
    mocks.updateCardZone
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("offline"));

    const first = useDeckStore.getState().moveCardToZone("card-1", "sideboard");
    const second = useDeckStore.getState().moveCardToZone("card-1", "maybeboard");
    await Promise.all([first, second]);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.cards[0].zone).toBe("sideboard");
    expect(deck.maybeboard).toHaveLength(0);
  });

  it("keeps the latest successful move after an earlier write fails", async () => {
    mocks.updateCardZone
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(undefined);

    const first = useDeckStore.getState().moveCardToZone("card-1", "sideboard");
    const second = useDeckStore.getState().moveCardToZone("card-1", "maybeboard");
    await Promise.all([first, second]);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.cards[0].zone).toBe("maybeboard");
    expect(deck.maybeboard).toHaveLength(1);
  });
});
