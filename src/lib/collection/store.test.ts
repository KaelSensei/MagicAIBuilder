import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCollectionStore } from "@/lib/collection/store";
import type { CollectionCard } from "@/lib/collection/types";

function makeCollectionCard(overrides: Partial<CollectionCard> = {}): CollectionCard {
  return {
    id: "card-1",
    scryfallId: "scryfall-1",
    name: "Sol Ring",
    quantity: 1,
    foil: false,
    condition: "NM",
    acquiredAt: null,
    price: 1.5,
    imageUri: "https://example.com/img.jpg",
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

describe("Collection store — getByScryfall / getTotalOwned", () => {
  beforeEach(() => {
    useCollectionStore.setState({
      collectionCards: {},
      collectionCardsFoil: {},
      isLoading: false,
      isSyncing: false,
    });
  });

  it("getByScryfall returns null when card not in collection", () => {
    const { normal, foil } = useCollectionStore.getState().getByScryfall("unknown");
    expect(normal).toBeNull();
    expect(foil).toBeNull();
  });

  it("getByScryfall returns the card when it exists", () => {
    const card = makeCollectionCard();
    useCollectionStore.setState({ collectionCards: { "scryfall-1": card } });
    const { normal } = useCollectionStore.getState().getByScryfall("scryfall-1");
    expect(normal?.name).toBe("Sol Ring");
  });

  it("getByScryfall returns foil card from foil map", () => {
    const foilCard = makeCollectionCard({ foil: true, id: "foil-1" });
    useCollectionStore.setState({ collectionCardsFoil: { "scryfall-1": foilCard } });
    const { foil } = useCollectionStore.getState().getByScryfall("scryfall-1");
    expect(foil?.foil).toBe(true);
  });

  it("getTotalOwned returns 0 when not in collection", () => {
    expect(useCollectionStore.getState().getTotalOwned("unknown")).toBe(0);
  });

  it("getTotalOwned sums normal + foil quantities", () => {
    const normal = makeCollectionCard({ quantity: 2 });
    const foil = makeCollectionCard({ foil: true, id: "foil-1", quantity: 3 });
    useCollectionStore.setState({
      collectionCards: { "scryfall-1": normal },
      collectionCardsFoil: { "scryfall-1": foil },
    });
    expect(useCollectionStore.getState().getTotalOwned("scryfall-1")).toBe(5);
  });
});

describe("Collection store — addToCollection", () => {
  beforeEach(() => {
    useCollectionStore.setState({
      collectionCards: {},
      collectionCardsFoil: {},
      isLoading: false,
      isSyncing: false,
    });
    vi.restoreAllMocks();
  });

  it("adds a non-foil card to collectionCards", async () => {
    const response = {
      id: "new-1",
      scryfallId: "sf-1",
      name: "Sol Ring",
      quantity: 1,
      foil: false,
      condition: "NM",
      acquiredAt: null,
      price: 1.5,
      imageUri: "",
      createdAt: "2024-01-01T00:00:00.000Z",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => response }));
    await useCollectionStore.getState().addToCollection({ scryfallId: "sf-1", name: "Sol Ring" });
    expect(useCollectionStore.getState().collectionCards["sf-1"]?.name).toBe("Sol Ring");
  });

  it("adds a foil card to collectionCardsFoil", async () => {
    const response = {
      id: "foil-1",
      scryfallId: "sf-1",
      name: "Sol Ring",
      quantity: 1,
      foil: true,
      condition: null,
      acquiredAt: null,
      price: null,
      imageUri: "",
      createdAt: "2024-01-01T00:00:00.000Z",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => response }));
    await useCollectionStore.getState().addToCollection({ scryfallId: "sf-1", name: "Sol Ring", foil: true });
    expect(useCollectionStore.getState().collectionCardsFoil["sf-1"]?.foil).toBe(true);
  });
});

describe("Collection store — removeFromCollection", () => {
  beforeEach(() => {
    useCollectionStore.setState({
      collectionCards: {},
      collectionCardsFoil: {},
      isLoading: false,
      isSyncing: false,
    });
    vi.restoreAllMocks();
  });

  it("removes a non-foil card from collectionCards", async () => {
    const card = makeCollectionCard({ id: "card-1" });
    useCollectionStore.setState({ collectionCards: { "scryfall-1": card } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    await useCollectionStore.getState().removeFromCollection("card-1");
    expect(useCollectionStore.getState().collectionCards["scryfall-1"]).toBeUndefined();
  });

  it("removes a foil card from collectionCardsFoil", async () => {
    const foilCard = makeCollectionCard({ id: "foil-1", foil: true });
    useCollectionStore.setState({ collectionCardsFoil: { "scryfall-1": foilCard } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    await useCollectionStore.getState().removeFromCollection("foil-1");
    expect(useCollectionStore.getState().collectionCardsFoil["scryfall-1"]).toBeUndefined();
  });
});

describe("Collection store — updateQuantity", () => {
  beforeEach(() => {
    useCollectionStore.setState({
      collectionCards: {},
      collectionCardsFoil: {},
      isLoading: false,
      isSyncing: false,
    });
    vi.restoreAllMocks();
  });

  it("updates quantity for a non-foil card", async () => {
    const card = makeCollectionCard({ id: "card-1", quantity: 1 });
    useCollectionStore.setState({ collectionCards: { "scryfall-1": card } });
    const updatedCard = { ...card, quantity: 3, createdAt: "2024-01-01T00:00:00.000Z", acquiredAt: null };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => updatedCard }));
    await useCollectionStore.getState().updateQuantity("card-1", 3);
    expect(useCollectionStore.getState().collectionCards["scryfall-1"]?.quantity).toBe(3);
  });

  it("updates quantity for a foil card", async () => {
    const foilCard = makeCollectionCard({ id: "foil-1", foil: true });
    useCollectionStore.setState({ collectionCardsFoil: { "scryfall-1": foilCard } });
    const updatedCard = { ...foilCard, quantity: 5, foil: true, createdAt: "2024-01-01T00:00:00.000Z", acquiredAt: null };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => updatedCard }));
    await useCollectionStore.getState().updateQuantity("foil-1", 5);
    expect(useCollectionStore.getState().collectionCardsFoil["scryfall-1"]?.quantity).toBe(5);
  });

  it("handles updateQuantity failure gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Error" }));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await useCollectionStore.getState().updateQuantity("card-1", 5);
    expect(useCollectionStore.getState().isSyncing).toBe(false);
    consoleSpy.mockRestore();
  });

  it("removes card when deleted=true returned", async () => {
    const card = makeCollectionCard({ id: "card-1" });
    useCollectionStore.setState({ collectionCards: { "scryfall-1": card } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ deleted: true }) }));
    await useCollectionStore.getState().updateQuantity("card-1", 0);
    expect(useCollectionStore.getState().collectionCards["scryfall-1"]).toBeUndefined();
  });
});

describe("Collection store — updateCondition", () => {
  beforeEach(() => {
    useCollectionStore.setState({
      collectionCards: {},
      collectionCardsFoil: {},
      isLoading: false,
      isSyncing: false,
    });
    vi.restoreAllMocks();
  });

  it("updates condition for a non-foil card", async () => {
    const card = makeCollectionCard({ id: "card-1", condition: "NM" });
    useCollectionStore.setState({ collectionCards: { "scryfall-1": card } });
    const updated = { ...card, condition: "LP", foil: false, createdAt: "2024-01-01T00:00:00.000Z", acquiredAt: null };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => updated }));
    await useCollectionStore.getState().updateCondition("card-1", "LP");
    expect(useCollectionStore.getState().collectionCards["scryfall-1"]?.condition).toBe("LP");
  });

  it("updates condition for a foil card", async () => {
    const foilCard = makeCollectionCard({ id: "foil-1", foil: true });
    useCollectionStore.setState({ collectionCardsFoil: { "scryfall-1": foilCard } });
    const updated = { ...foilCard, condition: "MP", foil: true, createdAt: "2024-01-01T00:00:00.000Z", acquiredAt: null };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => updated }));
    await useCollectionStore.getState().updateCondition("foil-1", "MP");
    expect(useCollectionStore.getState().collectionCardsFoil["scryfall-1"]?.condition).toBe("MP");
  });

  it("handles updateCondition failure gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Error" }));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await useCollectionStore.getState().updateCondition("card-1", "LP");
    expect(useCollectionStore.getState().isSyncing).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("Collection store — swapPrinting", () => {
  beforeEach(() => {
    useCollectionStore.setState({
      collectionCards: {},
      collectionCardsFoil: {},
      isLoading: false,
      isSyncing: false,
    });
    vi.restoreAllMocks();
  });

  it("moves a card to the new scryfallId key (non-foil)", async () => {
    const card = makeCollectionCard({ id: "card-1", scryfallId: "sf-old", foil: false });
    useCollectionStore.setState({ collectionCards: { "sf-old": card } });

    const response = {
      merged: false,
      card: {
        ...card,
        scryfallId: "sf-new",
        imageUri: "https://example.com/new.jpg",
        createdAt: "2024-01-01T00:00:00.000Z",
        acquiredAt: null,
      },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => response }));

    await useCollectionStore.getState().swapPrinting("card-1", {
      scryfallId: "sf-new",
      name: card.name,
      imageUri: "https://example.com/new.jpg",
      price: null,
    });

    expect(useCollectionStore.getState().collectionCards["sf-old"]).toBeUndefined();
    expect(useCollectionStore.getState().collectionCards["sf-new"]?.imageUri).toBe("https://example.com/new.jpg");
  });

  it("handles swapPrinting failure gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Error" }));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await useCollectionStore.getState().swapPrinting("card-1", {
      scryfallId: "sf-new",
      name: "Sol Ring",
      imageUri: "https://example.com/new.jpg",
      price: null,
    });
    expect(useCollectionStore.getState().isSyncing).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("Collection store — loadCollection", () => {
  beforeEach(() => {
    useCollectionStore.setState({
      collectionCards: {},
      collectionCardsFoil: {},
      isLoading: false,
      isSyncing: false,
    });
    vi.restoreAllMocks();
  });

  it("populates collectionCards from API response", async () => {
    const card: Omit<CollectionCard, "createdAt" | "acquiredAt"> & { createdAt: string; acquiredAt: string | null } = {
      id: "card-1",
      scryfallId: "scryfall-1",
      name: "Sol Ring",
      quantity: 1,
      foil: false,
      condition: "NM",
      acquiredAt: null,
      price: 1.5,
      imageUri: "",
      createdAt: "2024-01-01T00:00:00.000Z",
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [card],
    }));

    await useCollectionStore.getState().loadCollection();
    const { collectionCards } = useCollectionStore.getState();
    expect(collectionCards["scryfall-1"]?.name).toBe("Sol Ring");
    expect(collectionCards["scryfall-1"]?.createdAt).toBeInstanceOf(Date);
  });

  it("populates collectionCardsFoil for foil cards", async () => {
    const card = {
      id: "foil-1",
      scryfallId: "scryfall-foil-1",
      name: "Lightning Bolt",
      quantity: 2,
      foil: true,
      condition: null,
      acquiredAt: null,
      price: null,
      imageUri: "",
      createdAt: "2024-01-01T00:00:00.000Z",
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [card],
    }));

    await useCollectionStore.getState().loadCollection();
    const { collectionCardsFoil } = useCollectionStore.getState();
    expect(collectionCardsFoil["scryfall-foil-1"]?.foil).toBe(true);
  });

  it("handles fetch failure gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    }));

    await useCollectionStore.getState().loadCollection();
    expect(useCollectionStore.getState().isLoading).toBe(false);
  });
});

describe("Collection store — bulkAddToCollection", () => {
  beforeEach(() => {
    useCollectionStore.setState({
      collectionCards: {},
      collectionCardsFoil: {},
      isLoading: false,
      isSyncing: false,
    });
    vi.restoreAllMocks();
  });

  it("adds multiple cards to collection", async () => {
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        ok: true,
        json: async () => ({
          id: `card-${callCount}`,
          scryfallId: `sf-${callCount}`,
          name: `Card ${callCount}`,
          quantity: 1,
          foil: false,
          condition: null,
          acquiredAt: null,
          price: null,
          imageUri: "",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      };
    }));

    await useCollectionStore.getState().bulkAddToCollection([
      { scryfallId: "sf-1", name: "Card 1" },
      { scryfallId: "sf-2", name: "Card 2" },
    ]);

    const { collectionCards } = useCollectionStore.getState();
    expect(Object.keys(collectionCards)).toHaveLength(2);
    expect(useCollectionStore.getState().isSyncing).toBe(false);
  });

  it("skips failed requests and continues", async () => {
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) return { ok: false, status: 500 };
      return {
        ok: true,
        json: async () => ({
          id: "card-2",
          scryfallId: "sf-2",
          name: "Card 2",
          quantity: 1,
          foil: false,
          condition: null,
          acquiredAt: null,
          price: null,
          imageUri: "",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      };
    }));

    await useCollectionStore.getState().bulkAddToCollection([
      { scryfallId: "sf-1", name: "Card 1" },
      { scryfallId: "sf-2", name: "Card 2" },
    ]);

    const { collectionCards } = useCollectionStore.getState();
    expect(Object.keys(collectionCards)).toHaveLength(1);
    expect(collectionCards["sf-2"]?.name).toBe("Card 2");
  });

  it("does nothing for empty input", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await useCollectionStore.getState().bulkAddToCollection([]);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(useCollectionStore.getState().isSyncing).toBe(false);
  });
});
