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
    budget: null,
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
  deleteDeck: (id: string) => Promise<void>;
  renameDeck: (id: string, name: string) => Promise<void>;
  setActiveDeck: (id: string) => void;
  loadDecks: () => Promise<void>;

  // Card management
  setCommander: (card: ScryfallCard) => Promise<void>;
  setPartner: (card: ScryfallCard | null) => Promise<void>;
  setCompanion: (card: ScryfallCard | null) => Promise<void>;
  addCard: (card: ScryfallCard) => Promise<void>;
  addDeckCard: (card: DeckCard) => Promise<void>;
  removeCard: (cardId: string) => Promise<void>;
  updateCardCategory: (cardId: string, category: CardCategory) => Promise<void>;

  // Force save (sync) — triggers a full DB refresh for the active deck
  forceSave: () => Promise<void>;

  // Deck settings
  setTargetBracket: (bracket: 1 | 2 | 3 | 4) => Promise<void>;
  setBudget: (budget: number | null) => Promise<void>;

  // Game Changer / banlist enrichment
  markGameChanger: (cardName: string) => void;
  markBanned: (cardName: string) => void;

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
        const partnerCard = allCards.find((c) => c.isPartner) ?? null;
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
        });

        decks[d.id] = {
          id: d.id,
          name: d.name,
          format: d.format as "commander" | "brawl",
          targetBracket: d.targetBracket as 1 | 2 | 3 | 4,
          budget: d.budget,
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
          // Clear partner if new commander doesn't support pairing
          partner: supportsPartner(pairingType) ? state.decks[activeDeckId].partner : null,
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

  setPartner: async (card: ScryfallCard | null) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    const deckCard = card ? makeDeckCard(card) : null;
    if (deckCard) deckCard.category = "commander";

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          partner: deckCard,
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(activeDeckId, { partnerId: card?.id ?? null });
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

  addCard: async (card: ScryfallCard) => {
    const { activeDeckId, decks, gameChangerNames, bannedNames } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;

    const isBasic = card.type_line.toLowerCase().includes("basic land");
    const exists = deck.cards.find((c) => c.name === card.name);
    if (exists && !isBasic) return;

    const deckCard = makeDeckCard(card);
    deckCard.isGameChanger = gameChangerNames.has(card.name);
    deckCard.isBanned = bannedNames.has(card.name);

    // Warn user when adding a Game Changer card
    if (deckCard.isGameChanger) {
      const { cards: currentCards, commander } = deck;
      const existingGCCount = currentCards.filter((c) => c.isGameChanger).length
        + (commander?.isGameChanger ? 1 : 0);
      const newTotal = existingGCCount + 1;

      if (newTotal === 1) {
        useToastStore.getState().add(
          "warning",
          `⚡ ${card.name} is a Game Changer — your deck is now Bracket 3 minimum.`
        );
      } else if (newTotal <= 3) {
        useToastStore.getState().add(
          "warning",
          `⚡ ${card.name} is a Game Changer (${newTotal}/3). Bracket 3 minimum applies.`
        );
      } else {
        useToastStore.getState().add(
          "warning",
          `⚡ ${card.name} is a Game Changer — you now have ${newTotal} Game Changers, pushing the deck to Bracket 4.`
        );
      }
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
    const isBasic = card.typeLine.toLowerCase().includes("basic land");
    const exists = deck.cards.find((c) => c.name === card.name);
    if (exists && !isBasic) return;
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

  getActiveDeck: () => {
    const { activeDeckId, decks } = get();
    return activeDeckId ? (decks[activeDeckId] ?? null) : null;
  },
}));
