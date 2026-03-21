"use client";
// Zustand deck store — manages all deck state (synced to DB via API routes)
import { create } from "zustand";
import type { Deck, DeckCard, CardCategory, CommanderPairingType } from "./types";
import { categorizeCard } from "./categories";
import { detectPairingType, supportsPartner } from "./pairing";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { getCardImageUri } from "@/lib/scryfall/images";
import * as deckApi from "@/lib/db/deck-api";
import { useToastStore } from "@/hooks/useToast";

// ---------------------------------------------------------------------------
// Undo stack types
// ---------------------------------------------------------------------------
export type DeckAction =
  | { type: "ADD_CARD"; deckId: string; card: DeckCard }
  | { type: "REMOVE_CARD"; deckId: string; card: DeckCard };

function makeDeckCard(scryfallCard: ScryfallCard): DeckCard {
  return {
    id: scryfallCard.id,
    name: scryfallCard.name,
    manaCost: scryfallCard.mana_cost ?? "",
    cmc: scryfallCard.cmc,
    typeLine: scryfallCard.type_line,
    oracleText: scryfallCard.oracle_text ?? "",
    colorIdentity: scryfallCard.color_identity,
    isGameChanger: false,
    isBanned: false,
    price: scryfallCard.prices?.usd ? parseFloat(scryfallCard.prices.usd) : null,
    imageUri: getCardImageUri(scryfallCard, "normal"),
    artCropUri: getCardImageUri(scryfallCard, "art_crop"),
    category: categorizeCard(scryfallCard),
    quantity: 1,
  };
}

/** Displays a toast warning when a Game Changer card is added to the deck. */
function notifyGameChangerAdded(cardName: string, newTotal: number): void {
  const toast = useToastStore.getState();
  if (newTotal === 1) {
    toast.add("warning", `⚡ ${cardName} is a Game Changer — your deck is now Bracket 3 minimum.`);
  } else if (newTotal <= 3) {
    toast.add("warning", `⚡ ${cardName} is a Game Changer (${newTotal}/3). Bracket 3 minimum applies.`);
  } else {
    toast.add("warning", `⚡ ${cardName} is a Game Changer — you now have ${newTotal} Game Changers, pushing the deck to Bracket 4.`);
  }
}

function createEmptyDeck(id: string, name: string): Deck {
  return {
    id,
    name,
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    format: "commander",
    targetBracket: 2,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export interface DeckStore {
  // State
  decks: Record<string, Deck>;
  activeDeckId: string | null;
  isSyncing: boolean;

  // Undo stack
  undoStack: DeckAction[];
  undo: () => Promise<void>;

  // Enrichment sets (populated from hooks at app startup)
  gameChangerNames: Set<string>;
  bannedNames: Set<string>;

  // Enrichment setters
  setGameChangerNames: (names: Set<string>) => void;
  setBannedNames: (names: Set<string>) => void;

  // View preferences
  searchViewMode: "grid" | "list";
  deckViewMode: "grid" | "list";
  setSearchViewMode: (mode: "grid" | "list") => void;
  setDeckViewMode: (mode: "grid" | "list") => void;

  // Deck management
  createDeck: (name: string) => Promise<string>;
  duplicateDeck: (id: string) => Promise<string>;
  deleteDeck: (id: string) => Promise<void>;
  renameDeck: (id: string, name: string) => Promise<void>;
  setActiveDeck: (id: string) => void;
  loadDecks: () => Promise<void>;

  // Card management
  setCommander: (card: ScryfallCard) => Promise<void>;
  clearCommander: () => Promise<void>;
  setPartner: (card: ScryfallCard | null) => Promise<void>;
  setCompanion: (card: ScryfallCard | null) => Promise<void>;
  addCard: (card: ScryfallCard, quantity?: number) => Promise<void>;
  addDeckCard: (card: DeckCard) => Promise<void>;
  removeCard: (cardId: string) => Promise<void>;
  updateCardCategory: (cardId: string, category: CardCategory) => Promise<void>;
  updateCardQuantity: (cardId: string, delta: number) => Promise<void>;
  promoteToCommander: (cardId: string) => Promise<void>;
  swapCardPrinting: (cardId: string, printing: import("@/lib/scryfall/types").ScryfallCard) => Promise<void>;
  updateCardNotes: (cardId: string, notes: string | null) => Promise<void>;

  // Force save (sync) — triggers a full DB refresh for the active deck
  forceSave: () => Promise<void>;

  // Deck settings
  setTargetBracket: (bracket: 1 | 2 | 3 | 4) => Promise<void>;
  setManualBracket: (bracket: 1 | 2 | 3 | 4 | null) => Promise<void>;
  setBudget: (budget: number | null) => Promise<void>;

  // Game Changer / banlist enrichment
  markGameChanger: (cardName: string) => void;
  markBanned: (cardName: string) => void;

  // Description, tags
  updateDeckDescription: (deckId: string, description: string) => Promise<void>;
  addTag: (deckId: string, tag: string) => Promise<void>;
  removeTag: (deckId: string, tag: string) => Promise<void>;

  // Computed getters
  getActiveDeck: () => Deck | null;
}

export const useDeckStore = create<DeckStore>()((set, get) => ({
  decks: {},
  activeDeckId: null,
  isSyncing: false,
  undoStack: [],
  gameChangerNames: new Set<string>(),
  bannedNames: new Set<string>(),
  searchViewMode: "grid",
  deckViewMode: "list",

  setGameChangerNames: (names) => set({ gameChangerNames: names }),
  setBannedNames: (names) => set({ bannedNames: names }),
  setSearchViewMode: (mode) => set({ searchViewMode: mode }),
  setDeckViewMode: (mode) => set({ deckViewMode: mode }),

  undo: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    // Pop the action
    set((s) => ({ undoStack: s.undoStack.slice(0, -1) }));

    if (last.type === "ADD_CARD") {
      // Undo add → remove card (skip recording in undo stack)
      const { activeDeckId } = get();
      if (!activeDeckId) return;
      const deck = get().decks[activeDeckId];
      const card = deck?.cards.find((c) => c.name === last.card.name);
      if (!card) return;
      set((state) => ({
        decks: {
          ...state.decks,
          [activeDeckId]: {
            ...state.decks[activeDeckId],
            cards: state.decks[activeDeckId].cards.filter((c) => c.id !== card.id),
            updatedAt: new Date(),
          },
        },
      }));
      try {
        await deckApi.removeCard(activeDeckId, card.id);
      } catch (err) {
        console.error("[undo:ADD_CARD]", err);
      }
    } else if (last.type === "REMOVE_CARD") {
      // Undo remove → re-add card
      const { activeDeckId } = get();
      if (!activeDeckId) return;
      set((state) => ({
        decks: {
          ...state.decks,
          [activeDeckId]: {
            ...state.decks[activeDeckId],
            cards: [...state.decks[activeDeckId].cards, last.card],
            updatedAt: new Date(),
          },
        },
      }));
      try {
        await deckApi.addCard(activeDeckId, {
          scryfallId: last.card.id,
          name: last.card.name,
          manaCost: last.card.manaCost,
          cmc: last.card.cmc,
          typeLine: last.card.typeLine,
          oracleText: last.card.oracleText,
          colorIdentity: last.card.colorIdentity,
          isGameChanger: last.card.isGameChanger,
          isBanned: last.card.isBanned,
          price: last.card.price,
          imageUri: last.card.imageUri,
          artCropUri: last.card.artCropUri,
          category: last.card.category,
          quantity: last.card.quantity,
          isCommander: false,
          isPartner: false,
        });
      } catch (err) {
        console.error("[undo:REMOVE_CARD]", err);
      }
    }
    useToastStore.getState().add("info", "↩ Undo applied");
  },

  forceSave: async () => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    set({ isSyncing: true });
    try {
      await get().loadDecks();
      useToastStore.getState().add("success", "✓ Deck saved");
    } catch (err) {
      console.error("[forceSave]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  // Load all decks from the DB
  loadDecks: async () => {
    set({ isSyncing: true });
    try {
      const apiDecks = await deckApi.fetchDecks();
      const decks: Record<string, Deck> = {};
      for (const d of apiDecks) {
        // Re-hydrate dates and reconstruct commander/partner from cards list
        const allCards = d.cards ?? [];
        const commanderCard = allCards.find((c) => c.isCommander && !c.isPartner) ?? null;
        // Guard: if partner has same name as commander (import bug), treat as no partner
        const rawPartnerCard = allCards.find((c) => c.isPartner) ?? null;
        const partnerCard = (rawPartnerCard && rawPartnerCard.name !== commanderCard?.name)
          ? rawPartnerCard
          : null;
        const companionCard = allCards.find((c) => !c.isCommander && !c.isPartner && c.category === "companion") ?? null;
        const mainCards = allCards.filter((c) => !c.isCommander && !c.isPartner && c.category !== "companion");

        const toDeckCard = (c: deckApi.ApiDeckCard): DeckCard => ({
          id: c.id,
          name: c.name,
          manaCost: c.manaCost,
          cmc: c.cmc,
          typeLine: c.typeLine,
          oracleText: c.oracleText,
          colorIdentity: c.colorIdentity,
          isGameChanger: c.isGameChanger,
          isBanned: c.isBanned,
          price: c.price,
          imageUri: c.imageUri,
          artCropUri: c.artCropUri,
          category: c.category as CardCategory,
          quantity: c.quantity,
          notes: c.notes ?? null,
        });

        decks[d.id] = {
          id: d.id,
          name: d.name,
          format: d.format as "commander" | "brawl",
          targetBracket: d.targetBracket as 1 | 2 | 3 | 4,
          manualBracket: (d.manualBracket as 1 | 2 | 3 | 4 | null) ?? null,
          budget: d.budget,
          description: d.description ?? "",
          tags: d.tags ?? [],
          shareToken: d.shareToken ?? null,
          shareEnabled: d.shareEnabled ?? false,
          commander: commanderCard ? toDeckCard(commanderCard) : null,
          partner: partnerCard ? toDeckCard(partnerCard) : null,
          companion: companionCard ? toDeckCard(companionCard) : null,
          pairingType: (d.pairingType as CommanderPairingType) ?? "none",
          cards: mainCards.map(toDeckCard),
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
        };
      }
      set({ decks });
    } catch (err) {
      console.error("[loadDecks]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  createDeck: async (name: string) => {
    set({ isSyncing: true });
    try {
      const apiDeck = await deckApi.createDeck(name);
      const deck = createEmptyDeck(apiDeck.id, apiDeck.name);
      deck.createdAt = new Date(apiDeck.createdAt);
      deck.updatedAt = new Date(apiDeck.updatedAt);
      set((state) => ({
        decks: { ...state.decks, [apiDeck.id]: deck },
        activeDeckId: apiDeck.id,
      }));
      return apiDeck.id;
    } finally {
      set({ isSyncing: false });
    }
  },

  deleteDeck: async (id: string) => {
    set({ isSyncing: true });
    try {
      await deckApi.deleteDeck(id);
      set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _removed, ...rest } = state.decks;
        return {
          decks: rest,
          activeDeckId: state.activeDeckId === id ? null : state.activeDeckId,
        };
      });
    } finally {
      set({ isSyncing: false });
    }
  },

  duplicateDeck: async (id: string) => {
    set({ isSyncing: true });
    try {
      const res = await fetch(`/api/decks/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate deck");
      const copy = await res.json() as { id: string; name: string };
      // Set new deck as active before reloading
      set({ activeDeckId: copy.id });
      await get().loadDecks();
      useToastStore.getState().add("success", `Deck duplicated: "${copy.name}"`);
      return copy.id;
    } finally {
      set({ isSyncing: false });
    }
  },

  renameDeck: async (id: string, name: string) => {
    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [id]: { ...state.decks[id], name, updatedAt: new Date() },
      },
    }));
    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(id, { name });
    } catch (err) {
      console.error("[renameDeck]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  setActiveDeck: (id: string) => {
    set({ activeDeckId: id });
  },

  setCommander: async (card: ScryfallCard) => {
    const { activeDeckId, gameChangerNames, bannedNames } = get();
    if (!activeDeckId) return;
    const deckCard = makeDeckCard(card);
    deckCard.category = "commander";
    deckCard.isGameChanger = gameChangerNames.has(card.name);
    deckCard.isBanned = bannedNames.has(card.name);

    if (deckCard.isGameChanger) {
      useToastStore.getState().add(
        "warning",
        `⚡ ${card.name} is a Game Changer — your deck is automatically Bracket 3 minimum.`
      );
    }

    const pairingType = detectPairingType(card);

    // Optimistic update — also update pairingType and clear partner if new commander doesn't support it
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          commander: deckCard,
          pairingType,
          // Clear partner if new commander doesn't support pairing, or if partner is the same card
          partner: (supportsPartner(pairingType) && state.decks[activeDeckId].partner?.name !== deckCard.name)
            ? state.decks[activeDeckId].partner
            : null,
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(activeDeckId, { commanderId: card.id, pairingType });
      // Persist the commander card record
      await deckApi.addCard(activeDeckId, {
        scryfallId: card.id,
        name: deckCard.name,
        manaCost: deckCard.manaCost,
        cmc: deckCard.cmc,
        typeLine: deckCard.typeLine,
        oracleText: deckCard.oracleText,
        colorIdentity: deckCard.colorIdentity,
        isGameChanger: deckCard.isGameChanger,
        isBanned: deckCard.isBanned,
        price: deckCard.price,
        imageUri: deckCard.imageUri,
        artCropUri: deckCard.artCropUri,
        category: "commander",
        quantity: 1,
        isCommander: true,
        isPartner: false,
      });
    } catch (err) {
      console.error("[setCommander]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  clearCommander: async () => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          commander: null,
          partner: null, // Also clear partner — can't have partner without commander
          pairingType: "none",
          updatedAt: new Date(),
        },
      },
    }));
    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(activeDeckId, { commanderId: null, partnerId: null, pairingType: "none" });
    } catch (err) {
      console.error("[clearCommander]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  setPartner: async (card: ScryfallCard | null) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const deckCard = card ? makeDeckCard(card) : null;
    if (deckCard) deckCard.category = "commander";

    // If commander has no pairing type but partner does, derive pairingType from partner
    // e.g. Jaheira has "Choose a Background" → pairingType should be "background"
    const currentPairingType = decks[activeDeckId]?.pairingType ?? "none";
    const partnerPairingType = card ? detectPairingType(card) : "none";
    const effectivePairingType = (currentPairingType === "none" && partnerPairingType !== "none")
      ? partnerPairingType
      : currentPairingType;

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          partner: deckCard,
          pairingType: effectivePairingType,
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(activeDeckId, { partnerId: card?.id ?? null, pairingType: effectivePairingType });
      if (card && deckCard) {
        await deckApi.addCard(activeDeckId, {
          scryfallId: card.id,
          name: deckCard.name,
          manaCost: deckCard.manaCost,
          cmc: deckCard.cmc,
          typeLine: deckCard.typeLine,
          oracleText: deckCard.oracleText,
          colorIdentity: deckCard.colorIdentity,
          isGameChanger: deckCard.isGameChanger,
          isBanned: deckCard.isBanned,
          price: deckCard.price,
          imageUri: deckCard.imageUri,
          artCropUri: deckCard.artCropUri,
          category: "commander",
          quantity: 1,
          isCommander: true,
          isPartner: true,
        });
      }
    } catch (err) {
      console.error("[setPartner]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  setCompanion: async (card: ScryfallCard | null) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    const deckCard = card ? makeDeckCard(card) : null;
    if (deckCard) deckCard.category = "companion" as import("./types").CardCategory;

    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          companion: deckCard,
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(activeDeckId, { companionId: card?.id ?? null });
      if (card && deckCard) {
        await deckApi.addCard(activeDeckId, {
          scryfallId: card.id,
          name: deckCard.name,
          manaCost: deckCard.manaCost,
          cmc: deckCard.cmc,
          typeLine: deckCard.typeLine,
          oracleText: deckCard.oracleText,
          colorIdentity: deckCard.colorIdentity,
          isGameChanger: deckCard.isGameChanger,
          isBanned: deckCard.isBanned,
          price: deckCard.price,
          imageUri: deckCard.imageUri,
          artCropUri: deckCard.artCropUri,
          category: "companion" as import("./types").CardCategory,
          quantity: 1,
          isCommander: false,
          isPartner: false,
        });
      }
    } catch (err) {
      console.error("[setCompanion]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  addCard: async (card: ScryfallCard, quantity?: number) => {
    const { activeDeckId, decks, gameChangerNames, bannedNames } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;

    const isBasic = card.type_line.toLowerCase().includes("basic land");

    const { maxQuantity } = await import("@/lib/deck/multiples");
    const max = maxQuantity(card.name, card.type_line, card.oracle_text ?? "");
    const exists = deck.cards.find((c) => c.name === card.name);
    if (exists) {
      // Basic land already present — skip (caller should pass quantity on first add)
      if (isBasic) return;
      // Already at max → skip
      if (exists.quantity >= max) return;
      // Can add more → increment quantity
      get().updateCardQuantity(exists.id, 1);
      return;
    }

    const deckCard = makeDeckCard(card);
    // If a specific quantity is provided (e.g. bulk import of basics), apply it directly
    if (quantity && quantity > 1) {
      deckCard.quantity = quantity;
    }
    deckCard.isGameChanger = gameChangerNames.has(card.name);
    deckCard.isBanned = bannedNames.has(card.name);

    // Warn user when adding a Game Changer card
    if (deckCard.isGameChanger) {
      const { cards: currentCards, commander } = deck;
      const existingGCCount = currentCards.filter((c) => c.isGameChanger).length
        + (commander?.isGameChanger ? 1 : 0);
      notifyGameChangerAdded(card.name, existingGCCount + 1);
    }

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          cards: [...state.decks[activeDeckId].cards, deckCard],
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      const saved = await deckApi.addCard(activeDeckId, {
        scryfallId: card.id,
        name: deckCard.name,
        manaCost: deckCard.manaCost,
        cmc: deckCard.cmc,
        typeLine: deckCard.typeLine,
        oracleText: deckCard.oracleText,
        colorIdentity: deckCard.colorIdentity,
        isGameChanger: deckCard.isGameChanger,
        isBanned: deckCard.isBanned,
        price: deckCard.price,
        imageUri: deckCard.imageUri,
        artCropUri: deckCard.artCropUri,
        category: deckCard.category,
        quantity: deckCard.quantity,
        isCommander: false,
        isPartner: false,
      });
      // Update the card's local id to the DB-generated CUID for future ops
      set((state) => ({
        decks: {
          ...state.decks,
          [activeDeckId]: {
            ...state.decks[activeDeckId],
            cards: state.decks[activeDeckId].cards.map((c) =>
              c.id === card.id ? { ...c, id: saved.id } : c
            ),
          },
        },
        // Record in undo stack (use saved id)
        undoStack: [
          ...state.undoStack,
          { type: "ADD_CARD" as const, deckId: activeDeckId, card: { ...deckCard, id: saved.id } },
        ],
      }));
    } catch (err) {
      console.error("[addCard]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  addDeckCard: async (card: DeckCard) => {
    const { activeDeckId, decks, gameChangerNames, bannedNames } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;
    const { maxQuantity } = await import("@/lib/deck/multiples");
    const max = maxQuantity(card.name, card.typeLine, card.oracleText ?? "");
    const exists = deck.cards.find((c) => c.name === card.name);
    if (exists) {
      if (exists.quantity >= max) return;
      get().updateCardQuantity(exists.id, 1);
      return;
    }
    const enriched = {
      ...card,
      isGameChanger: gameChangerNames.has(card.name),
      isBanned: bannedNames.has(card.name),
    };

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          cards: [...state.decks[activeDeckId].cards, enriched],
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      const saved = await deckApi.addCard(activeDeckId, {
        scryfallId: card.id,
        name: card.name,
        manaCost: card.manaCost,
        cmc: card.cmc,
        typeLine: card.typeLine,
        oracleText: card.oracleText,
        colorIdentity: card.colorIdentity,
        isGameChanger: enriched.isGameChanger,
        isBanned: enriched.isBanned,
        price: card.price,
        imageUri: card.imageUri,
        artCropUri: card.artCropUri,
        category: card.category,
        quantity: card.quantity,
        isCommander: false,
        isPartner: false,
      });
      set((state) => ({
        decks: {
          ...state.decks,
          [activeDeckId]: {
            ...state.decks[activeDeckId],
            cards: state.decks[activeDeckId].cards.map((c) =>
              c.id === card.id ? { ...c, id: saved.id } : c
            ),
          },
        },
      }));
    } catch (err) {
      console.error("[addDeckCard]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  removeCard: async (cardId: string) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;

    // Capture card before removing for undo stack
    const removedCard = decks[activeDeckId]?.cards.find((c) => c.id === cardId) ?? null;

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          cards: state.decks[activeDeckId].cards.filter(
            (c) => c.id !== cardId
          ),
          updatedAt: new Date(),
        },
      },
      // Record in undo stack
      undoStack: removedCard
        ? [
            ...state.undoStack,
            { type: "REMOVE_CARD" as const, deckId: activeDeckId, card: removedCard },
          ]
        : state.undoStack,
    }));

    set({ isSyncing: true });
    try {
      await deckApi.removeCard(activeDeckId, cardId);
    } catch (err) {
      console.error("[removeCard]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  updateCardCategory: async (cardId: string, category: CardCategory) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          cards: state.decks[activeDeckId].cards.map((c) =>
            c.id === cardId ? { ...c, category } : c
          ),
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      await deckApi.updateCardCategory(activeDeckId, cardId, category);
    } catch (err) {
      console.error("[updateCardCategory]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  updateCardQuantity: async (cardId, delta) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;
    const card = deck.cards.find((c) => c.id === cardId);
    if (!card) return;

    const { maxQuantity } = await import("@/lib/deck/multiples");
    const max = maxQuantity(card.name, card.typeLine, card.oracleText ?? "");
    const newQty = Math.max(1, Math.min(max, card.quantity + delta));
    if (newQty === card.quantity) return;

    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          cards: state.decks[activeDeckId].cards.map((c) =>
            c.id === cardId ? { ...c, quantity: newQty } : c
          ),
        },
      },
    }));
    set({ isSyncing: true });
    try {
      await fetch(`/api/decks/${activeDeckId}/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
    } catch (err) {
      console.error("[updateCardQuantity]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  promoteToCommander: async (cardId) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;
    const card = deck.cards.find((c) => c.id === cardId);
    if (!card) return;

    // Build a minimal ScryfallCard from the DeckCard to reuse setCommander
    const scryfallCard = {
      id: card.scryfallId ?? card.id,
      name: card.name,
      mana_cost: card.manaCost,
      cmc: card.cmc,
      type_line: card.typeLine,
      oracle_text: card.oracleText,
      color_identity: card.colorIdentity,
      image_uris: card.imageUri ? { normal: card.imageUri, art_crop: card.artCropUri ?? card.imageUri } : undefined,
      prices: {},
      legalities: {},
      set: "", set_name: "", collector_number: "", rarity: "rare" as const,
      object: "card" as const, lang: "en", released_at: "", uri: "", scryfall_uri: "",
      layout: "normal", highres_image: false, image_status: "lowres" as const,
      keywords: [], games: [], reserved: false, foil: false, nonfoil: true,
      oversized: false, promo: false, reprint: false, variation: false,
      set_id: "", set_type: "", border_color: "black" as const, frame: "2015",
      full_art: false, textless: false, booster: false, story_spotlight: false,
    };

    // Remove from deck first, then set as commander
    await get().removeCard(cardId);
    await get().setCommander(scryfallCard as import("@/lib/scryfall/types").ScryfallCard);
  },

  swapCardPrinting: async (cardId, printing) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    const { getCardImageUri } = await import("@/lib/scryfall/images");
    const imageUri = getCardImageUri(printing, "normal");
    const artCropUri = getCardImageUri(printing, "art_crop");
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          cards: state.decks[activeDeckId].cards.map((c) =>
            c.id === cardId
              ? { ...c, scryfallId: printing.id, imageUri, artCropUri }
              : c
          ),
        },
      },
    }));
    set({ isSyncing: true });
    try {
      await fetch(`/api/decks/${activeDeckId}/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scryfallId: printing.id, imageUri, artCropUri }),
      });
    } catch (err) {
      console.error("[swapCardPrinting]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  updateCardNotes: async (cardId: string, notes: string | null) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          cards: state.decks[activeDeckId].cards.map((c) =>
            c.id === cardId ? { ...c, notes } : c
          ),
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      await deckApi.updateCardNotes(activeDeckId, cardId, notes);
    } catch (err) {
      console.error("[updateCardNotes]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  setTargetBracket: async (bracket) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          targetBracket: bracket,
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(activeDeckId, { targetBracket: bracket });
    } catch (err) {
      console.error("[setTargetBracket]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  setManualBracket: async (bracket) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          manualBracket: bracket,
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(activeDeckId, { manualBracket: bracket });
    } catch (err) {
      console.error("[setManualBracket]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  setBudget: async (budget) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          budget,
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(activeDeckId, { budget });
    } catch (err) {
      console.error("[setBudget]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  markGameChanger: (cardName: string) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          cards: state.decks[activeDeckId].cards.map((c) =>
            c.name === cardName ? { ...c, isGameChanger: true } : c
          ),
        },
      },
    }));
  },

  markBanned: (cardName: string) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          cards: state.decks[activeDeckId].cards.map((c) =>
            c.name === cardName ? { ...c, isBanned: true } : c
          ),
        },
      },
    }));
  },

  updateDeckDescription: async (deckId: string, description: string) => {
    set((state) => ({
      decks: {
        ...state.decks,
        [deckId]: { ...state.decks[deckId], description },
      },
    }));
    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(deckId, { description });
    } catch (err) {
      console.error("[updateDeckDescription]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  addTag: async (deckId: string, tag: string) => {
    const deck = get().decks[deckId];
    if (!deck) return;
    const trimmed = tag.trim();
    if (!trimmed) return;
    const existingTags = deck.tags ?? [];
    if (existingTags.includes(trimmed)) return;
    const tags = [...existingTags, trimmed];
    set((state) => ({
      decks: { ...state.decks, [deckId]: { ...state.decks[deckId], tags } },
    }));
    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(deckId, { tags });
    } catch (err) {
      console.error("[addTag]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  removeTag: async (deckId: string, tag: string) => {
    const deck = get().decks[deckId];
    if (!deck) return;
    const tags = (deck.tags ?? []).filter((t) => t !== tag);
    set((state) => ({
      decks: { ...state.decks, [deckId]: { ...state.decks[deckId], tags } },
    }));
    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(deckId, { tags });
    } catch (err) {
      console.error("[removeTag]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  getActiveDeck: () => {
    const { activeDeckId, decks } = get();
    return activeDeckId ? (decks[activeDeckId] ?? null) : null;
  },
}));
