"use client";
// Zustand deck store — manages all deck state (synced to DB via API routes)
import { create } from "zustand";
import type { Deck, DeckCard, DeckZone, CardCategory, CardFace } from "./types";
import { loadSortPreference, saveSortPreference } from "./sort";
import type { SortField, SortDirection, GroupBy, SortPreference } from "./sort";
import { categorizeCard, categorizeDfcCard } from "./categories";
import { detectPairingType, supportsPartner } from "./pairing";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { DFC_LAYOUTS } from "@/lib/scryfall/types";
import { getCardImageUri, buildScryfallImageUrl } from "@/lib/scryfall/images";
import * as deckApi from "@/lib/db/deck-api";
import { useToastStore } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import {
  isBannedCompanionInCommander,
  isScryfallCompanionCard,
} from "@/lib/deck/companion";

// ---------------------------------------------------------------------------
// Undo stack types
// ---------------------------------------------------------------------------
export type DeckAction =
  | { type: "ADD_CARD"; deckId: string; card: DeckCard }
  | { type: "REMOVE_CARD"; deckId: string; card: DeckCard };

function buildCardFaces(sc: ScryfallCard): [CardFace, CardFace] | undefined {
  if (!DFC_LAYOUTS.has(sc.layout ?? "")) return undefined;
  const faces = sc.card_faces;
  if (!faces || faces.length < 2) return undefined;
  const [f0, f1] = faces;
  return [
    { name: f0.name, manaCost: f0.mana_cost ?? "", typeLine: f0.type_line ?? "", oracleText: f0.oracle_text ?? "", imageUri: f0.image_uris?.normal ?? getCardImageUri(sc, "normal", "front"), artCropUri: f0.image_uris?.art_crop ?? getCardImageUri(sc, "art_crop", "front") },
    { name: f1.name, manaCost: f1.mana_cost ?? "", typeLine: f1.type_line ?? "", oracleText: f1.oracle_text ?? "", imageUri: f1.image_uris?.normal ?? getCardImageUri(sc, "normal", "back"), artCropUri: f1.image_uris?.art_crop ?? getCardImageUri(sc, "art_crop", "back") },
  ];
}
function makeDeckCard(scryfallCard: ScryfallCard): DeckCard {
  const cardFaces = buildCardFaces(scryfallCard);
  const isDfc = cardFaces !== undefined;
  const manaCost = scryfallCard.mana_cost ?? cardFaces?.[0].manaCost ?? "";
  const isFlexibleLand = isDfc && scryfallCard.layout === "modal_dfc" && (cardFaces?.[1].typeLine ?? "").toLowerCase().includes("land");
  const face0 = scryfallCard.card_faces?.[0];
  const power = (face0?.power ?? scryfallCard.power ?? null) || null;
  const toughness = (face0?.toughness ?? scryfallCard.toughness ?? null) || null;
  return {
    id: scryfallCard.id, name: scryfallCard.name, manaCost, cmc: scryfallCard.cmc,
    typeLine: scryfallCard.type_line, oracleText: scryfallCard.oracle_text ?? cardFaces?.[0].oracleText ?? "",
    colorIdentity: scryfallCard.color_identity, isGameChanger: false, isBanned: false,
    price: scryfallCard.prices?.usd ? Number.parseFloat(scryfallCard.prices.usd) : null,
    imageUri: cardFaces?.[0].imageUri ?? getCardImageUri(scryfallCard, "normal"),
    artCropUri: cardFaces?.[0].artCropUri ?? getCardImageUri(scryfallCard, "art_crop"),
    category: isDfc ? categorizeDfcCard(scryfallCard) : categorizeCard(scryfallCard),
    power,
    toughness,
    quantity: 1, zone: "main", layout: scryfallCard.layout, cardFaces, isFlexibleLand,
  };
}

/**
 * Reconstruct cardFaces from DB-stored fields for DFC/MDFC cards.
 * DFC cards have names like "Front Name // Back Name" and their images
 * can be fetched via Scryfall's front/back face URLs using the scryfallId.
 */
function rebuildCardFaces(scryfallId: string, name: string, typeLine: string, manaCost: string, oracleText: string): [CardFace, CardFace] | undefined {
  if (!name.includes(" // ")) return undefined;
  const [frontName, backName] = name.split(" // ");
  const [frontType, backType] = typeLine.includes(" // ") ? typeLine.split(" // ") : [typeLine, ""];
  const [frontOracle, backOracle] = oracleText.includes(" // ") ? oracleText.split(" // ") : [oracleText, ""];
  const [frontMana, backMana] = manaCost.includes(" // ") ? manaCost.split(" // ") : [manaCost, ""];
  return [
    { name: frontName, manaCost: frontMana, typeLine: frontType, oracleText: frontOracle, imageUri: buildScryfallImageUrl(scryfallId, "normal", "front"), artCropUri: buildScryfallImageUrl(scryfallId, "art_crop", "front") },
    { name: backName, manaCost: backMana, typeLine: backType, oracleText: backOracle, imageUri: buildScryfallImageUrl(scryfallId, "normal", "back"), artCropUri: buildScryfallImageUrl(scryfallId, "art_crop", "back") },
  ];
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

function createEmptyDeck(id: string, name: string, format: Deck["format"] = "commander"): Deck {
  return {
    id,
    name,
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format,
    cardCount: 0,
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Convert an API deck response to a store Deck object.
 * Extracts commander/partner/companion from the cards array and builds the Deck.
 *
 * @param d - API deck response (may contain all cards or just commander/partner/companion)
 * @returns Store-ready Deck object
 */
function apiDeckToStoreDeck(d: deckApi.ApiDeck): Deck {
  const allCards = d.cards ?? [];
  const commanderCard = allCards.find((c) => c.isCommander && !c.isPartner) ?? null;
  const rawPartnerCard = allCards.find((c) => c.isPartner) ?? null;
  const partnerCard = (rawPartnerCard && rawPartnerCard.name !== commanderCard?.name)
    ? rawPartnerCard
    : null;
  const companionCard = allCards.find((c) => !c.isCommander && !c.isPartner && c.category === "companion") ?? null;
  const mainCards = allCards.filter((c) => !c.isCommander && !c.isPartner && c.category !== "companion");

  const toDeckCard = (c: deckApi.ApiDeckCard): DeckCard => {
    const cardFaces = rebuildCardFaces(c.scryfallId, c.name, c.typeLine, c.manaCost, c.oracleText);
    const isFlexibleLand = cardFaces?.[1].typeLine.toLowerCase().includes("land") ?? false;
    return {
      id: c.id,
      scryfallId: c.scryfallId,
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
      category: c.category,
      power: c.power ?? null,
      toughness: c.toughness ?? null,
      quantity: c.quantity,
      notes: c.notes ?? null,
      zone: c.zone ?? "main",
      cardFaces,
      isFlexibleLand: isFlexibleLand || undefined,
    };
  };

  // cardCount: use _count from listing endpoint, or derive from full card list
  const cardCount = d._count?.cards ?? allCards.length;

  return {
    id: d.id,
    name: d.name,
    format: d.format,
    targetBracket: d.targetBracket,
    manualBracket: (d.manualBracket ?? null) as 1 | 2 | 3 | 4 | null,
    budget: d.budget,
    description: d.description ?? "",
    tags: d.tags ?? [],
    shareToken: d.shareToken ?? null,
    shareEnabled: d.shareEnabled ?? false,
    isPublic: d.isPublic ?? false,
    isAIGenerated: d.isAIGenerated ?? false,
    commander: commanderCard ? toDeckCard(commanderCard) : null,
    partner: partnerCard ? toDeckCard(partnerCard) : null,
    companion: companionCard ? toDeckCard(companionCard) : null,
    pairingType: d.pairingType ?? "none",
    cards: mainCards.map(toDeckCard),
    cardCount,
    maybeboard: [],
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
  };
}

/**
 * Whether a deck in the store is still the lightweight listing version.
 *
 * `GET /api/decks` returns only commander / partner / companion plus a total
 * count, so a stub reports fewer loaded cards than `cardCount`. The full deck
 * comes from `GET /api/decks/[id]`.
 *
 * @param deck - a deck held in the store
 * @returns true when its main-deck cards have not been loaded yet
 */
function isDeckStub(deck: Deck): boolean {
  const loaded =
    deck.cards.length +
    (deck.commander ? 1 : 0) +
    (deck.partner ? 1 : 0) +
    (deck.companion ? 1 : 0);

  return loaded < deck.cardCount;
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
  deckGridCols: 2 | 3 | 4 | 6 | 8;
  setSearchViewMode: (mode: "grid" | "list") => void;
  setDeckViewMode: (mode: "grid" | "list") => void;
  setDeckGridCols: (cols: 2 | 3 | 4 | 6 | 8) => void;

  // Sort & group preferences
  sortField: SortField;
  sortDirection: SortDirection;
  groupBy: GroupBy;
  setSortField: (field: SortField) => void;
  setSortDirection: (dir: SortDirection) => void;
  setGroupBy: (groupBy: GroupBy) => void;
  setSortPreference: (pref: SortPreference) => void;

  // Deck management
  createDeck: (name: string, opts?: { isAIGenerated?: boolean }) => Promise<string>;
  duplicateDeck: (id: string) => Promise<string>;
  deleteDeck: (id: string) => Promise<void>;
  renameDeck: (id: string, name: string) => Promise<void>;
  setActiveDeck: (id: string) => Promise<void>;
  loadDecks: () => Promise<void>;

  // Deck description & tags
  updateDeckDescription: (deckId: string, description: string) => Promise<void>;
  addTag: (deckId: string, tag: string) => Promise<void>;
  removeTag: (deckId: string, tag: string) => Promise<void>;

  // Card management
  setCommander: (card: ScryfallCard) => Promise<void>;
  clearCommander: () => Promise<void>;
  setPartner: (card: ScryfallCard | null) => Promise<void>;
  setCompanion: (card: ScryfallCard | null) => Promise<void>;
  addCard: (card: ScryfallCard, quantity?: number, zone?: DeckZone) => Promise<void>;
  addDeckCard: (card: DeckCard) => Promise<void>;
  removeCard: (cardId: string) => Promise<void>;
  updateCardCategory: (cardId: string, category: CardCategory) => Promise<void>;
  updateCardQuantity: (cardId: string, delta: number) => Promise<void>;
  promoteToCommander: (cardId: string) => Promise<void>;

  // Maybeboard management
  addToMaybeboard: (card: ScryfallCard) => Promise<void>;
  removeFromMaybeboard: (cardId: string) => Promise<void>;
  moveToMaybeboard: (cardId: string) => Promise<void>;
  moveToDeck: (cardId: string) => Promise<void>;
  swapCardPrinting: (cardId: string, printing: import("@/lib/scryfall/types").ScryfallCard) => Promise<void>;
  updateCardNotes: (cardId: string, notes: string | null) => Promise<void>;
  moveCardToZone: (cardId: string, zone: DeckZone) => Promise<void>;
  bulkMoveToZone: (cardIds: readonly string[], zone: DeckZone) => Promise<void>;
  bulkRemoveCards: (cardIds: readonly string[]) => Promise<void>;

  // Force save (sync) — triggers a full DB refresh for the active deck
  forceSave: () => Promise<void>;

  // Deck settings
  setTargetBracket: (bracket: 1 | 2 | 3 | 4) => Promise<void>;
  setManualBracket: (bracket: 1 | 2 | 3 | 4 | null) => Promise<void>;
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
  deckGridCols: 6,

  // Sort & group — initialised from localStorage for persistence
  ...((): Pick<DeckStore, "sortField" | "sortDirection" | "groupBy"> => {
    const pref = loadSortPreference();
    return { sortField: pref.sortField, sortDirection: pref.sortDirection, groupBy: pref.groupBy };
  })(),

  setGameChangerNames: (names) => set({ gameChangerNames: names }),
  setBannedNames: (names) => set({ bannedNames: names }),
  setSearchViewMode: (mode) => set({ searchViewMode: mode }),
  setDeckViewMode: (mode) => set({ deckViewMode: mode }),
  setDeckGridCols: (cols) => set({ deckGridCols: cols }),

  setSortField: (field) => {
    set({ sortField: field });
    const { sortDirection, groupBy } = get();
    saveSortPreference({ sortField: field, sortDirection, groupBy });
  },
  setSortDirection: (dir) => {
    set({ sortDirection: dir });
    const { sortField, groupBy } = get();
    saveSortPreference({ sortField, sortDirection: dir, groupBy });
  },
  setGroupBy: (groupBy) => {
    set({ groupBy });
    const { sortField, sortDirection } = get();
    saveSortPreference({ sortField, sortDirection, groupBy });
  },
  setSortPreference: (pref) => {
    set({ sortField: pref.sortField, sortDirection: pref.sortDirection, groupBy: pref.groupBy });
    saveSortPreference(pref);
  },

  undo: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const last = undoStack.at(-1);
    if (!last) return;
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
        logger.error("Unexpected error", "undo:ADD_CARD", err);
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
          power: last.card.power ?? null,
          toughness: last.card.toughness ?? null,
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
        logger.error("Unexpected error", "undo:REMOVE_CARD", err);
      }
    }
    useToastStore.getState().add("info", "↩ Undo applied");
  },

  forceSave: async () => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    set({ isSyncing: true });
    try {
      const apiDeck = await deckApi.fetchDeck(activeDeckId);
      const fullDeck = apiDeckToStoreDeck(apiDeck);
      set((state) => ({
        decks: { ...state.decks, [activeDeckId]: fullDeck },
      }));
      useToastStore.getState().add("success", "✓ Deck saved");
    } catch (err) {
      logger.error("Unexpected error", "forceSave", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  // Load deck listing from the DB (lightweight: only commander/partner/companion + card count)
  loadDecks: async () => {
    set({ isSyncing: true });
    try {
      const response = await deckApi.fetchDecks();

      set((state) => {
        const decks: Record<string, Deck> = {};
        for (const d of response.decks) {
          const incoming = apiDeckToStoreDeck(d);
          const existing = state.decks[d.id];

          // Keep the fuller copy. The listing is deliberately lightweight, so
          // overwriting wholesale threw away cards that setActiveDeck had just
          // fetched — the deck went back to empty moments after loading.
          decks[d.id] = existing && !isDeckStub(existing) ? existing : incoming;
        }
        // Decks absent from the listing were deleted server-side, so the
        // rebuilt map drops them rather than merging them back in.
        return { decks };
      });
    } catch (err) {
      logger.error("Unexpected error", "loadDecks", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  createDeck: async (name: string, opts?: { isAIGenerated?: boolean }) => {
    set({ isSyncing: true });
    try {
      const apiDeck = await deckApi.createDeck(name, { isAIGenerated: opts?.isAIGenerated });
      const deck = createEmptyDeck(apiDeck.id, apiDeck.name);
      deck.createdAt = new Date(apiDeck.createdAt);
      deck.updatedAt = new Date(apiDeck.updatedAt);
      deck.isAIGenerated = apiDeck.isAIGenerated ?? false;
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructuring to omit the deleted deck from state
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
      logger.error("Unexpected error", "renameDeck", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  setActiveDeck: async (id: string) => {
    set({ activeDeckId: id });

    // Load full card data when the store does not already hold it. Two cases:
    // the deck is absent entirely (direct navigation to /builder/<id>, before
    // loadDecks has run), or it came from the lightweight listing, which
    // carries only commander/partner/companion plus a count.
    //
    // The absent case used to be skipped — the guard required `deck` to exist —
    // so a bookmark, a refresh or a freshly imported deck opened with no cards
    // at all, and nothing ever re-triggered the load.
    const deck = get().decks[id];
    if (deck && !isDeckStub(deck)) return;

    try {
      const apiDeck = await deckApi.fetchDeck(id);
      const fullDeck = apiDeckToStoreDeck(apiDeck);
      set((state) => ({
        decks: { ...state.decks, [id]: fullDeck },
      }));
    } catch (err) {
      logger.error("Unexpected error", "setActiveDeck.lazyLoad", err);
    }
  },

  updateDeckDescription: async (deckId: string, description: string) => {
    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [deckId]: { ...state.decks[deckId], description, updatedAt: new Date() },
      },
    }));
    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(deckId, { description });
    } catch (err) {
      logger.error("Unexpected error", "updateDeckDescription", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  addTag: async (deckId: string, tag: string) => {
    const current = get().decks[deckId];
    if (!current) return;
    const trimmed = tag.trim().slice(0, 50);
    if (!trimmed || current.tags.includes(trimmed)) return;
    const tags = [...current.tags, trimmed];
    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [deckId]: { ...state.decks[deckId], tags, updatedAt: new Date() },
      },
    }));
    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(deckId, { tags });
    } catch (err) {
      logger.error("Unexpected error", "addTag", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  removeTag: async (deckId: string, tag: string) => {
    const current = get().decks[deckId];
    if (!current) return;
    const tags = current.tags.filter((t) => t !== tag);
    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [deckId]: { ...state.decks[deckId], tags, updatedAt: new Date() },
      },
    }));
    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(deckId, { tags });
    } catch (err) {
      logger.error("Unexpected error", "removeTag", err);
    } finally {
      set({ isSyncing: false });
    }
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
        power: deckCard.power ?? null,
        toughness: deckCard.toughness ?? null,
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
      logger.error("Unexpected error", "setCommander", err);
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
      logger.error("Unexpected error", "clearCommander", err);
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
          power: deckCard.power ?? null,
          toughness: deckCard.toughness ?? null,
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
      logger.error("Unexpected error", "setPartner", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  setCompanion: async (card: ScryfallCard | null) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;

    const prev = deck.companion;

    if (card === null) {
      if (!prev) return;
      set({ isSyncing: true });
      try {
        await deckApi.removeCard(activeDeckId, prev.id);
        await deckApi.updateDeck(activeDeckId, { companionId: null });
        set((state) => ({
          decks: {
            ...state.decks,
            [activeDeckId]: {
              ...state.decks[activeDeckId],
              companion: null,
              updatedAt: new Date(),
            },
          },
        }));
      } catch (err) {
        logger.error("Unexpected error", "setCompanion", err);
        useToastStore.getState().add("error", "Could not remove companion — try again");
      } finally {
        set({ isSyncing: false });
      }
      return;
    }

    if (!deck.commander) {
      useToastStore.getState().add("warning", "Choose a commander before setting a companion.");
      return;
    }

    if (!isScryfallCompanionCard(card)) {
      useToastStore.getState().add("warning", "That card does not have Companion.");
      return;
    }

    if (isBannedCompanionInCommander(card)) {
      useToastStore.getState().add("warning", "Lutri cannot be your companion in Commander.");
      return;
    }

    const deckCard = makeDeckCard(card);
    deckCard.category = "companion" as import("./types").CardCategory;

    set({ isSyncing: true });
    try {
      if (prev) {
        await deckApi.removeCard(activeDeckId, prev.id);
      }
      const created = await deckApi.addCard(activeDeckId, {
        scryfallId: card.id,
        name: deckCard.name,
        manaCost: deckCard.manaCost,
        cmc: deckCard.cmc,
        typeLine: deckCard.typeLine,
        oracleText: deckCard.oracleText,
        power: deckCard.power ?? null,
        toughness: deckCard.toughness ?? null,
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
      await deckApi.updateDeck(activeDeckId, { companionId: card.id });
      set((state) => ({
        decks: {
          ...state.decks,
          [activeDeckId]: {
            ...state.decks[activeDeckId],
            companion: {
              ...deckCard,
              id: created.id,
              scryfallId: created.scryfallId,
            },
            updatedAt: new Date(),
          },
        },
      }));
    } catch (err) {
      logger.error("Unexpected error", "setCompanion", err);
      useToastStore.getState().add("error", "Could not save companion — try again");
    } finally {
      set({ isSyncing: false });
    }
  },

  addCard: async (card: ScryfallCard, quantity?: number, zone: DeckZone = "main") => {
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
    // Apply target zone (sideboard / maybeboard / main)
    deckCard.zone = zone;
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
        power: deckCard.power ?? null,
        toughness: deckCard.toughness ?? null,
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
        zone: deckCard.zone,
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
      logger.error("Unexpected error", "addCard", err);
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
        power: card.power ?? null,
        toughness: card.toughness ?? null,
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
      logger.error("Unexpected error", "addDeckCard", err);
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
      logger.error("Unexpected error", "removeCard", err);
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
      logger.error("Unexpected error", "updateCardCategory", err);
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
      logger.error("Unexpected error", "updateCardQuantity", err);
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
      logger.error("Unexpected error", "swapCardPrinting", err);
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
      logger.error("Unexpected error", "updateCardNotes", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  moveCardToZone: async (cardId: string, zone: DeckZone) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          cards: state.decks[activeDeckId].cards.map((c) =>
            c.id === cardId ? { ...c, zone } : c
          ),
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      await deckApi.updateCardZone(activeDeckId, cardId, zone);
    } catch (err) {
      logger.error("Unexpected error", "moveCardToZone", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  bulkMoveToZone: async (cardIds, zone) => {
    const { activeDeckId } = get();
    if (!activeDeckId || cardIds.length === 0) return;

    const idSet = new Set(cardIds);
    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          cards: state.decks[activeDeckId].cards.map((c) =>
            idSet.has(c.id) ? { ...c, zone } : c
          ),
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      await Promise.all(
        cardIds.map((id) => deckApi.updateCardZone(activeDeckId, id, zone))
      );
    } catch (err) {
      logger.error("Unexpected error", "bulkMoveToZone", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  bulkRemoveCards: async (cardIds) => {
    const { activeDeckId } = get();
    if (!activeDeckId || cardIds.length === 0) return;

    const idSet = new Set(cardIds);
    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          cards: state.decks[activeDeckId].cards.filter((c) => !idSet.has(c.id)),
          updatedAt: new Date(),
        },
      },
    }));

    set({ isSyncing: true });
    try {
      await Promise.all(
        cardIds.map((id) => deckApi.removeCard(activeDeckId, id))
      );
    } catch (err) {
      logger.error("Unexpected error", "bulkRemoveCards", err);
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
      logger.error("Unexpected error", "setTargetBracket", err);
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
      logger.error("Unexpected error", "setManualBracket", err);
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
      logger.error("Unexpected error", "setBudget", err);
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

  addToMaybeboard: async (card: ScryfallCard) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;

    const isBasicLand = (card.type_line ?? "").toLowerCase().includes("basic land");
    const exists = !isBasicLand && deck.maybeboard.find((c) => c.name === card.name);
    if (exists) return;

    const deckCard = makeDeckCard(card);
    deckCard.isMaybeboard = true;

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          maybeboard: [...state.decks[activeDeckId].maybeboard, deckCard],
          updatedAt: new Date(),
        },
      },
    }));

    try {
      const saved = await deckApi.addCard(activeDeckId, {
        scryfallId: card.id,
        name: deckCard.name,
        manaCost: deckCard.manaCost,
        cmc: deckCard.cmc,
        typeLine: deckCard.typeLine,
        oracleText: deckCard.oracleText,
        power: deckCard.power ?? null,
        toughness: deckCard.toughness ?? null,
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
      // Update id to DB-generated id
      set((state) => ({
        decks: {
          ...state.decks,
          [activeDeckId]: {
            ...state.decks[activeDeckId],
            maybeboard: state.decks[activeDeckId].maybeboard.map((c) =>
              c.id === card.id ? { ...c, id: saved.id } : c
            ),
          },
        },
      }));
    } catch (err) {
      logger.error("Unexpected error", "addToMaybeboard", err);
    }
  },

  removeFromMaybeboard: async (cardId: string) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;

    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          maybeboard: state.decks[activeDeckId].maybeboard.filter((c) => c.id !== cardId),
          updatedAt: new Date(),
        },
      },
    }));

    try {
      await deckApi.removeCard(activeDeckId, cardId);
    } catch (err) {
      logger.error("Unexpected error", "removeFromMaybeboard", err);
    }
  },

  moveToMaybeboard: async (cardId: string) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;

    const card = deck.cards.find((c) => c.id === cardId);
    if (!card) return;

    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          cards: state.decks[activeDeckId].cards.filter((c) => c.id !== cardId),
          maybeboard: [...state.decks[activeDeckId].maybeboard, { ...card, isMaybeboard: true }],
          updatedAt: new Date(),
        },
      },
    }));

    try {
      await deckApi.updateCardMaybeboard(activeDeckId, cardId, true);
    } catch (err) {
      logger.error("Unexpected error", "moveToMaybeboard", err);
    }
  },

  moveToDeck: async (cardId: string) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;

    const card = deck.maybeboard.find((c) => c.id === cardId);
    if (!card) return;

    // Don't move if the deck already has a card with the same name
    const alreadyInDeck = deck.cards.some((c) => c.name === card.name);
    if (alreadyInDeck) return;

    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: {
          ...state.decks[activeDeckId],
          maybeboard: state.decks[activeDeckId].maybeboard.filter((c) => c.id !== cardId),
          cards: [...state.decks[activeDeckId].cards, { ...card, isMaybeboard: false }],
          updatedAt: new Date(),
        },
      },
    }));

    try {
      await deckApi.updateCardMaybeboard(activeDeckId, cardId, false);
    } catch (err) {
      logger.error("Unexpected error", "moveToDeck", err);
    }
  },

  getActiveDeck: () => {
    const { activeDeckId, decks } = get();
    return activeDeckId ? (decks[activeDeckId] ?? null) : null;
  },
}));
