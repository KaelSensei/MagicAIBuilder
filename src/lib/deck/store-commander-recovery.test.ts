/** The deck store restores the command zone when a commander or partner save fails. */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ScryfallCard } from "@/lib/scryfall/types";
import { createEmptyDeck } from "./store-factories";
import type { Deck, DeckCard } from "./types";

const mocks = vi.hoisted(() => ({
  updateDeck: vi.fn(),
  addCard: vi.fn(),
  removeCard: vi.fn(),
  addToast: vi.fn(),
}));

vi.mock(import("@/lib/db/deck-api"), () => ({
  updateDeck: mocks.updateDeck,
  addCard: mocks.addCard,
  removeCard: mocks.removeCard,
}));
vi.mock(import("@/hooks/useToast"), async (importOriginal) => {
  const { useToastStore } = await importOriginal();
  useToastStore.setState({ add: mocks.addToast });
  return { useToastStore };
});

const { useDeckStore } = await import("./store");

/**
 * Build a command-zone card as the store holds it after a load.
 * @param id - Saved card identifier
 * @param name - Card name
 * @returns A commander-category deck card
 */
function commandCard(id: string, name: string): DeckCard {
  return {
    id,
    name,
    manaCost: "",
    cmc: 4,
    typeLine: "Legendary Creature",
    oracleText: "Partner",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "commander",
    quantity: 1,
    zone: "main",
  };
}

/**
 * Build the Scryfall card a player picks in commander mode.
 * @param overrides - Fields that differ from a vanilla legendary creature
 * @returns A Scryfall card fixture
 */
function scryfallCommander(overrides: Partial<ScryfallCard>): ScryfallCard {
  return {
    id: "scryfall-commander",
    name: "Commander",
    mana_cost: "{4}",
    cmc: 4,
    type_line: "Legendary Creature",
    oracle_text: "",
    color_identity: [],
    colors: [],
    set: "cmd",
    set_name: "Commander",
    rarity: "mythic",
    prices: { usd: null, usd_foil: null, eur: null },
    keywords: [],
    legalities: { commander: "legal" },
    ...overrides,
  };
}

const THRASIOS = commandCard("thrasios", "Thrasios, Triton Hero");
const TYMNA = commandCard("tymna", "Tymna the Weaver");
const ATRAXA = scryfallCommander({ id: "atraxa", name: "Atraxa, Praetors' Voice" });
const PARTNER_LINE =
  "Partner (You can have two commanders if both have partner.)";
const KRAUM = scryfallCommander({
  id: "kraum",
  name: "Kraum, Ludevic's Opus",
  keywords: ["Partner"],
  oracle_text: PARTNER_LINE,
});
const ISHAI = scryfallCommander({
  id: "ishai",
  name: "Ishai, Ojutai Dragonspeaker",
  keywords: ["Partner"],
  oracle_text: PARTNER_LINE,
});

/**
 * Seed an active deck led by a Partner pair.
 * @returns The seeded deck
 */
function seedPartnerPair(): Deck {
  const deck: Deck = {
    ...createEmptyDeck("deck-1", "Partners"),
    commander: THRASIOS,
    partner: TYMNA,
    pairingType: "partner",
  };
  useDeckStore.setState({
    decks: { "deck-1": deck },
    activeDeckId: "deck-1",
    isSyncing: false,
    undoStack: [],
  });
  return deck;
}

/**
 * Read the command zone of the seeded deck.
 * @returns The commander, partner and pairing currently on screen
 */
function commandZone(): Pick<Deck, "commander" | "partner" | "pairingType"> {
  const deck = useDeckStore.getState().decks["deck-1"];
  return {
    commander: deck?.commander ?? null,
    partner: deck?.partner ?? null,
    pairingType: deck?.pairingType ?? "none",
  };
}

describe("commander save recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateDeck.mockResolvedValue({});
    mocks.addCard.mockResolvedValue({ id: "saved-row" });
    mocks.removeCard.mockResolvedValue(undefined);
    seedPartnerPair();
  });

  it("restores the previous commander, partner and pairing when saving a replacement fails", async () => {
    mocks.updateDeck.mockRejectedValueOnce(new Error("Save failed"));

    await useDeckStore.getState().setCommander(ATRAXA);

    expect(commandZone()).toEqual({
      commander: THRASIOS,
      partner: TYMNA,
      pairingType: "partner",
    });
    expect(mocks.addToast).toHaveBeenCalledWith(
      "error",
      expect.stringContaining("commander"),
    );
    expect(mocks.addCard).not.toHaveBeenCalled();
  });

  it("keeps the saved commander when only its card row fails", async () => {
    mocks.addCard.mockRejectedValueOnce(new Error("Save failed"));

    await useDeckStore.getState().setCommander(ATRAXA);

    expect(commandZone().commander?.id).toBe("atraxa");
    expect(mocks.addToast).not.toHaveBeenCalledWith(
      "error",
      expect.stringContaining("commander"),
    );
  });

  it("does not roll back a newer commander when an older save fails", async () => {
    const olderSave = Promise.withResolvers<unknown>();
    mocks.updateDeck.mockReturnValueOnce(olderSave.promise);

    const failedAttempt = useDeckStore.getState().setCommander(ATRAXA);
    await useDeckStore.getState().setCommander(
      scryfallCommander({ id: "kenrith", name: "Kenrith, the Returned King" }),
    );
    olderSave.reject(new Error("Save failed"));
    await failedAttempt;

    expect(commandZone().commander?.scryfallId).toBe("kenrith");
    expect(mocks.addToast).not.toHaveBeenCalledWith(
      "error",
      expect.stringContaining("commander"),
    );
  });

  it("keeps a partner chosen while the failed commander save was pending", async () => {
    const commanderSave = Promise.withResolvers<unknown>();
    mocks.updateDeck.mockReturnValueOnce(commanderSave.promise);

    const failedAttempt = useDeckStore.getState().setCommander(KRAUM);
    await useDeckStore.getState().setPartner(ISHAI);
    commanderSave.reject(new Error("Save failed"));
    await failedAttempt;

    expect(commandZone().commander).toEqual(THRASIOS);
    expect(commandZone().partner?.scryfallId).toBe("ishai");
    expect(mocks.addToast).toHaveBeenCalledWith(
      "error",
      expect.stringContaining("commander"),
    );
  });

  it("restores the previous commander when clearing it fails", async () => {
    mocks.updateDeck.mockRejectedValueOnce(new Error("Save failed"));

    await useDeckStore.getState().clearCommander();

    expect(commandZone()).toEqual({
      commander: THRASIOS,
      partner: TYMNA,
      pairingType: "partner",
    });
    expect(mocks.addToast).toHaveBeenCalledWith(
      "error",
      expect.stringContaining("commander"),
    );
  });
});
