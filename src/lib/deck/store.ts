"use client";
// Zustand deck store — manages all deck state
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Deck, DeckCard, CardCategory } from "./types";
import { categorizeCard } from "./categories";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { getCardImageUri } from "@/lib/scryfall/images";

function makeDeckCard(scryfallCard: ScryfallCard): DeckCard {
  return {
    id: scryfallCard.id,
    name: scryfallCard.name,
    manaCost: scryfallCard.mana_cost ?? "",
    cmc: scryfallCard.cmc,
    typeLine: scryfallCard.type_line,
    oracleText: scryfallCard.oracle_text ?? "",
    colorIdentity: scryfallCard.color_identity,
    isGameChanger: false, // Will be enriched via API
    isBanned: false, // Will be enriched via validation
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
  createDeck: (name: string) => string;
  deleteDeck: (id: string) => void;
  renameDeck: (id: string, name: string) => void;
  setActiveDeck: (id: string) => void;

  // Card management
  setCommander: (card: ScryfallCard) => void;
  setPartner: (card: ScryfallCard | null) => void;
  addCard: (card: ScryfallCard) => void;
  removeCard: (cardId: string) => void;
  updateCardCategory: (cardId: string, category: CardCategory) => void;

  // Deck settings
  setTargetBracket: (bracket: 1 | 2 | 3 | 4) => void;
  setBudget: (budget: number | null) => void;

  // Game Changer / banlist enrichment
  markGameChanger: (cardName: string) => void;
  markBanned: (cardName: string) => void;

  // Computed getters
  getActiveDeck: () => Deck | null;
}

export const useDeckStore = create<DeckStore>()(
  persist(
    (set, get) => ({
      decks: {},
      activeDeckId: null,
      gameChangerNames: new Set<string>(),
      bannedNames: new Set<string>(),
      searchViewMode: "grid",
      deckViewMode: "list",

      setGameChangerNames: (names) => set({ gameChangerNames: names }),
      setBannedNames: (names) => set({ bannedNames: names }),
      setSearchViewMode: (mode) => set({ searchViewMode: mode }),
      setDeckViewMode: (mode) => set({ deckViewMode: mode }),

      createDeck: (name: string) => {
        const id = crypto.randomUUID();
        const deck = createEmptyDeck(id, name);
        set((state) => ({
          decks: { ...state.decks, [id]: deck },
          activeDeckId: id,
        }));
        return id;
      },

      deleteDeck: (id: string) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _removed, ...rest } = state.decks;
          return {
            decks: rest,
            activeDeckId: state.activeDeckId === id ? null : state.activeDeckId,
          };
        });
      },

      renameDeck: (id: string, name: string) => {
        set((state) => ({
          decks: {
            ...state.decks,
            [id]: { ...state.decks[id], name, updatedAt: new Date() },
          },
        }));
      },

      setActiveDeck: (id: string) => {
        set({ activeDeckId: id });
      },

      setCommander: (card: ScryfallCard) => {
        const { activeDeckId, gameChangerNames, bannedNames } = get();
        if (!activeDeckId) return;
        const deckCard = makeDeckCard(card);
        deckCard.category = "commander";
        deckCard.isGameChanger = gameChangerNames.has(card.name);
        deckCard.isBanned = bannedNames.has(card.name);
        set((state) => ({
          decks: {
            ...state.decks,
            [activeDeckId]: {
              ...state.decks[activeDeckId],
              commander: deckCard,
              updatedAt: new Date(),
            },
          },
        }));
      },

      setPartner: (card: ScryfallCard | null) => {
        const { activeDeckId } = get();
        if (!activeDeckId) return;
        const deckCard = card ? makeDeckCard(card) : null;
        if (deckCard) deckCard.category = "commander";
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
      },

      addCard: (card: ScryfallCard) => {
        const { activeDeckId, decks, gameChangerNames, bannedNames } = get();
        if (!activeDeckId) return;
        const deck = decks[activeDeckId];
        if (!deck) return;

        // Check if already exists (singleton)
        const isBasic = card.type_line.toLowerCase().includes("basic land");
        const exists = deck.cards.find((c) => c.name === card.name);
        if (exists && !isBasic) {
          // Increment quantity for basics
          return;
        }

        const deckCard = makeDeckCard(card);
        // Cross-reference enrichment sets
        deckCard.isGameChanger = gameChangerNames.has(card.name);
        deckCard.isBanned = bannedNames.has(card.name);

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
      },

      removeCard: (cardId: string) => {
        const { activeDeckId } = get();
        if (!activeDeckId) return;
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
        }));
      },

      updateCardCategory: (cardId: string, category: CardCategory) => {
        const { activeDeckId } = get();
        if (!activeDeckId) return;
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
      },

      setTargetBracket: (bracket) => {
        const { activeDeckId } = get();
        if (!activeDeckId) return;
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
      },

      setBudget: (budget) => {
        const { activeDeckId } = get();
        if (!activeDeckId) return;
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
    }),
    {
      name: "magic-ai-builder-decks",
      // Only persist decks and view preferences (not runtime enrichment sets)
      partialize: (state) => ({
        decks: state.decks,
        activeDeckId: state.activeDeckId,
        searchViewMode: state.searchViewMode,
        deckViewMode: state.deckViewMode,
      }),
      // Revive dates after hydration
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        for (const deck of Object.values(state.decks)) {
          if (typeof deck.createdAt === "string") {
            deck.createdAt = new Date(deck.createdAt);
          }
          if (typeof deck.updatedAt === "string") {
            deck.updatedAt = new Date(deck.updatedAt);
          }
        }
      },
    }
  )
);
