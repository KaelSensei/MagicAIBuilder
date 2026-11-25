"use client";
// Zustand deck store — manages all deck state (synced to DB via API routes)
import { create } from "zustand";
import type { StoreApi } from "zustand";
import type {
  BracketLevel,
  Deck,
  DeckCard,
  DeckZone,
  CardCategory,
  PrintingChoice,
} from "./types";
import type { DeckFormat } from "./formats";
import { loadSortPreference, saveSortPreference } from "./sort";
import type { SortField, SortDirection, GroupBy, SortPreference } from "./sort";
import { detectPairingType, pairCommanders } from "./pairing";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { getCardById } from "@/lib/scryfall/client";
import { isBasicLand } from "@/lib/scryfall/type-line";
import { commandZoneExceptions } from "@/lib/deck/color-identity";
import {
  copiesWithinLimit,
  deckCopyLimit,
  type CopyLimitCard,
} from "@/lib/deck/multiples";
import { copiesCountedFor, isCountedZone } from "@/lib/deck/counted-copies";
import * as deckApi from "@/lib/db/deck-api";
import {
  DeckApiError,
  isStaleDeckRefusal,
  readAnsweredVersion,
} from "@/lib/db/deck-api-answer";
import { useCollectionStore } from "@/lib/collection/store";
import {
  deckOpenErrorFrom,
  type DeckOpenError,
} from "@/lib/deck/deck-open-error";
import {
  DECK_FAILURE_TOASTS,
  openFailureToast,
} from "@/lib/deck/failure-toasts";
import { useToastStore, type ToastMessage } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import {
  isBannedCompanionInCommander,
  isScryfallCompanionCard,
} from "@/lib/deck/companion";
import {
  addCardPayload,
  apiDeckToStoreDeck,
  commandCardPayload,
  createEmptyDeck,
  isDeckStub,
  makeDeckCard,
} from "./store-factories";
import { printingColumns } from "./store-card-faces";
import { cardsFromZoneSource, deckFromZoneCards } from "./zone-source";
import { withLoadedCardCount } from "./loaded-card-count";
import { withDeckToReload } from "./reload-on-next-open";
import {
  createDeckWriteQueue,
  DroppedDeckWriteError,
} from "./deck-write-queue";
import type { BulkEdit } from "./bulk-edit";
import {
  commandZoneOf,
  restoreCommanderAfterFailedSave,
  restorePartnerAfterFailedSave,
  type CommandZone,
  type FailedCommanderSave,
} from "./commander-save-recovery";
import { withSavedCommandRows } from "./command-zone-rows";
import {
  commandZoneRequest,
  savedRowsBySlot,
  type CommandSlotEdit,
  type CommandZoneEdit,
} from "./command-zone-change";
import {
  clearGuestDeck,
  createGuestDeck,
  GUEST_DECK_ID,
  isGuestDeckId,
  loadGuestDeck,
  saveGuestDeck,
} from "./guest-deck";

// ---------------------------------------------------------------------------
// Undo stack types
// ---------------------------------------------------------------------------
export type DeckAction =
  | { type: "ADD_CARD"; deckId: string; card: DeckCard }
  | { type: "REMOVE_CARD"; deckId: string; card: DeckCard }
  | { type: "MOVE_ZONE"; deckId: string; cardId: string; from: DeckZone; to: DeckZone };

function withoutCard(cards: DeckCard[], cardId: string): DeckCard[] {
  return cards.filter((card) => card.id !== cardId);
}

function restoreUndoCard(cards: DeckCard[], restored: DeckCard): DeckCard[] {
  return cards.some((card) => card.id === restored.id) ? cards : [...cards, restored];
}

function replaceUndoCardId(cards: DeckCard[], previousId: string, savedId: string): DeckCard[] {
  return cards.map((card) => card.id === previousId ? { ...card, id: savedId } : card);
}

function restoreCardCategory(cards: DeckCard[], cardId: string, attempted: CardCategory, confirmed: CardCategory): DeckCard[] {
  return cards.map((card) => card.id === cardId && card.category === attempted
    ? { ...card, category: confirmed } : card);
}

function restoreCardQuantity(cards: DeckCard[], cardId: string, quantity: number): DeckCard[] {
  return cards.map((card) => card.id === cardId ? { ...card, quantity } : card);
}

function restoreCardNotes(cards: DeckCard[], cardId: string, attempted: DeckCard["notes"], confirmed: DeckCard["notes"]): DeckCard[] {
  return cards.map((card) => card.id === cardId && card.notes === attempted
    ? { ...card, notes: confirmed } : card);
}

function restoreRemovedCard(cards: DeckCard[], removedCard: DeckCard, followingCardIds: ReadonlySet<string>): DeckCard[] {
  if (cards.some((card) => card.id === removedCard.id)) return cards;
  const followingIndex = cards.findIndex((card) => followingCardIds.has(card.id));
  const restoreIndex = followingIndex < 0 ? cards.length : followingIndex;
  return [...cards.slice(0, restoreIndex), removedCard, ...cards.slice(restoreIndex)];
}

function notifyGameChangerAdded(cardName: string, newTotal: number): void {
  const toast = useToastStore.getState();
  if (newTotal === 1) {
    toast.add(
      "warning",
      `⚡ ${cardName} is a Game Changer — your deck is now Bracket 3 minimum.`
    );
  } else if (newTotal <= 3) {
    toast.add(
      "warning",
      `⚡ ${cardName} is a Game Changer (${newTotal}/3). Bracket 3 minimum applies.`
    );
  } else {
    toast.add(
      "warning",
      `⚡ ${cardName} is a Game Changer — you now have ${newTotal} Game Changers, pushing the deck to Bracket 4.`
    );
  }
}

/**
 * Warns, before the save, when the card being added to `deck` is a Game Changer, with the
 * deck's Game Changer total once it joins: the deck list's and the commander's.
 */
function warnIfGameChangerAdded(deck: Deck, added: DeckCard): void {
  if (!added.isGameChanger) return;
  const held =
    deck.cards.filter((card) => card.isGameChanger).length +
    (deck.commander?.isGameChanger ? 1 : 0);
  notifyGameChangerAdded(added.name, held + 1);
}

function uniqueDeckCards(deck: Pick<Deck, "cards" | "maybeboard">): DeckCard[] {
  return cardsFromZoneSource(deck);
}

/**
 * The copies of `card` this deck may hold: four in a constructed deck
 * (CR 100.2a), one in a singleton deck (CR 903.5b), with the exemptions
 * `maxQuantity` grants basic lands and the cards whose own text allows more.
 * The limit is the deck's stored format, never a fixed Commander one, and a
 * commander with no maximum deck size lifts the size cap (CR 903.5e).
 */
function copyLimit(
  deck: Pick<Deck, "format" | "commander" | "partner">,
  card: CopyLimitCard
): number {
  return deckCopyLimit(card, { format: deck.format, exceptions: commandZoneExceptions(deck) });
}

/**
 * The copies of `card` the deck may still take in `zone`: its copy limit less
 * the copies already counted there. CR 100.2a: the main deck and the sideboard
 * together hold at most four; CR 903.5b: a Commander deck holds one, its
 * command zone included. Every row of the name counts, whatever its printing;
 * Considering is weighed alone (`copiesCountedFor`). Zero or less when full.
 */
function copyRoom(deck: Deck, card: CopyLimitCard, zone: DeckZone): number {
  const counted = {
    cards: uniqueDeckCards(deck),
    commander: deck.commander,
    partner: deck.partner,
  };
  return copyLimit(deck, card) - copiesCountedFor(counted, card.name, zone);
}

/**
 * A row's copies after a step of `delta`: a raise stops at the room the deck
 * has left (`copyRoom`), a lowering always goes through and keeps one copy.
 */
function steppedQuantity(
  quantity: number,
  delta: number,
  room: number
): number {
  if (delta <= 0) return Math.max(1, quantity + delta);
  return quantity + Math.max(0, Math.min(delta, room));
}

/** A row moving from one zone to another. */
interface ZoneMove {
  readonly card: DeckCard;
  readonly from: DeckZone;
  readonly to: DeckZone;
}

/**
 * Whether a move would put the deck past the card's copy limit. Only a row
 * entering the deck from Considering adds copies the limit counts (CR 100.2a,
 * CR 903.5b); a move between the main deck and the sideboard, or into
 * Considering, never does.
 */
function moveExceedsCopyLimit(
  deck: Deck,
  { card, from, to }: ZoneMove
): boolean {
  if (isCountedZone(from) || !isCountedZone(to)) return false;
  return card.quantity > copyRoom(deck, card, to);
}

/**
 * Checks whether two name sets have identical membership.
 *
 * @param current - Values already held in store state.
 * @param next - Values supplied by the latest enrichment query.
 * @returns Whether no store-visible value changed.
 */
function setsContainSameValues(
  current: ReadonlySet<string>,
  next: ReadonlySet<string>
): boolean {
  if (current.size !== next.size) return false;
  for (const value of current) {
    if (!next.has(value)) return false;
  }
  return true;
}

/**
 * Uses an owned printing of the requested card when the local collection can
 * identify one. The collection itself is read-only during deck construction.
 */
async function getOwnedPrinting(
  card: Pick<ScryfallCard, "id" | "name">
): Promise<ScryfallCard | null> {
  const { collectionCards, collectionCardsFoil } = useCollectionStore.getState();
  const ownedCards = [
    ...Object.values(collectionCards),
    ...Object.values(collectionCardsFoil),
  ];
  const ownedPrinting = ownedCards.find(
    (owned) =>
      owned.name === card.name &&
      owned.quantity > 0 &&
      owned.scryfallId !== card.id
  );
  if (!ownedPrinting) return null;

  try {
    return await getCardById(ownedPrinting.scryfallId);
  } catch {
    return null;
  }
}

/** The printing `addCard` adds: the one the player chose, or an owned printing first. */
async function printingToAdd(
  card: ScryfallCard,
  choice: PrintingChoice
): Promise<ScryfallCard> {
  switch (choice) {
    case "explicit":
      return card;
    case "owned-first":
      return (await getOwnedPrinting(card)) ?? card;
  }
  const unknownChoice: never = choice;
  return unknownChoice;
}

function syncDeckCards(deck: Deck, cards: readonly DeckCard[]): Deck {
  return deckFromZoneCards(deck, cards);
}

/**
 * The deck after an edit of its card rows: zones re-read, `cardCount` back in
 * step with the rows held, and the edit dated.
 */
function updateDeckCards(
  deck: Deck,
  update: (cards: DeckCard[]) => DeckCard[]
): Deck {
  return withLoadedCardCount({
    ...syncDeckCards(deck, update(uniqueDeckCards(deck))),
    updatedAt: new Date(),
  });
}

interface PendingQuantityWrite {
  confirmedQuantity: number;
  promise: Promise<void>;
}

const pendingQuantityWrites = new Map<string, PendingQuantityWrite>();

function setCardsZone(
  deck: Deck,
  cardIds: ReadonlySet<string>,
  zone: DeckZone
): Deck {
  return updateDeckCards(deck, (cards) =>
    cards.map((card) =>
      cardIds.has(card.id)
        ? { ...card, zone, isMaybeboard: zone === "maybeboard" }
        : card
    )
  );
}

interface PendingZoneWrite {
  confirmedZone: DeckZone;
  tail: Promise<void>;
}

const pendingZoneWrites = new Map<string, PendingZoneWrite>();

interface PendingNotesWrite {
  confirmedNotes: string | null | undefined;
  tail: Promise<void>;
}

const pendingNotesWrites = new Map<string, PendingNotesWrite>();

interface PendingCategoryWrite {
  confirmedCategory: CardCategory;
  tail: Promise<void>;
}

const pendingCategoryWrites = new Map<string, PendingCategoryWrite>();

let pendingManualBracketWrites = 0;
let pendingBudgetWrites = 0;
let pendingFormatWrites = 0;
let pendingBulkRemovals = 0;
let pendingCardAdditionsAndRemovals = 0;
let pendingRenameWrites = 0;

/**
 * The decks map with one deck's version replaced; the map itself when the
 * deck is not held or already holds that version, so nothing re-renders.
 */
function withDeckVersion(
  state: Pick<DeckStore, "decks">,
  deckId: string,
  version: number | undefined
): Pick<DeckStore, "decks"> {
  const deck = state.decks[deckId];
  if (!deck || deck.version === version) return state;
  return { decks: { ...state.decks, [deckId]: { ...deck, version } } };
}

/**
 * The queue every versioned write of this store goes through: it sends the
 * version the store holds at that moment and adopts the one answered
 * (`deck-write-queue.ts`). The store is read lazily, since this queue is
 * created before it.
 */
const deckWrites = createDeckWriteQueue(
  {
    held: (deckId) => useDeckStore.getState().decks[deckId]?.version,
    adopt: (deckId, version) =>
      useDeckStore.setState((state) => withDeckVersion(state, deckId, version)),
    forget: (deckId) =>
      useDeckStore.setState((state) => withDeckVersion(state, deckId, undefined)),
  },
  isStaleDeckRefusal
);

/** The conflict message, translated by the toast container in the player's locale. */
const CONFLICT_TOAST = { key: "deck.sync.conflictReloaded" } as const;

/**
 * Puts the server's deck back on screen after a write was refused as stale,
 * and tells the player. The reload replaces the whole deck, version included,
 * so the next write carries the version the other tab left. The undo entries
 * of the deck go: they name rows the other tab may have replaced. When the
 * reload fails, the deck stays as the rollback left it, with no version to
 * vouch for, and the player is told to retry.
 *
 * @param deckId - the deck whose write was refused
 */
async function reloadAfterConflict(deckId: string): Promise<void> {
  try {
    const apiDeck = await deckApi.fetchDeck(deckId);
    if (!useDeckStore.getState().decks[deckId]) return;
    useDeckStore.setState((state) => ({
      decks: { ...state.decks, [deckId]: apiDeckToStoreDeck(apiDeck) },
      undoStack: state.undoStack.filter((action) => action.deckId !== deckId),
    }));
    useToastStore.getState().add("warning", CONFLICT_TOAST);
  } catch (err) {
    logger.error("Unexpected error", "reloadAfterConflict", err);
    useToastStore.getState().add("error", DECK_FAILURE_TOASTS.refresh);
  }
}

/**
 * Tells the player about a write the server did not save, once the caller
 * has rolled its change back. A write refused as stale (409) reloads the deck
 * and shows the conflict message in place of `message`; a write dropped by
 * that reload says nothing, since the refused write reported the conflict;
 * any other failure shows `message`, when there is one.
 *
 * @param deckId - the deck written
 * @param error - what the write threw
 * @param message - the failure toast for an ordinary failure, as words or a
 *   catalogue key; absent when the write has never reported one
 */
async function settleFailedWrite(
  deckId: string,
  error: unknown,
  message?: ToastMessage
): Promise<void> {
  if (error instanceof DroppedDeckWriteError) return;
  if (isStaleDeckRefusal(error)) {
    await deckWrites.recover(deckId, () => reloadAfterConflict(deckId));
    return;
  }
  reportFailure(message);
}

/**
 * Raises the error toast of a failure, when it has one.
 *
 * @param message - the toast, or `undefined` for a failure the screen already
 *   reports (a deck the server does not have shows "Deck not found")
 */
function reportFailure(message: ToastMessage | undefined): void {
  if (message !== undefined) useToastStore.getState().add("error", message);
}

/**
 * One single-row PATCH the store still sends itself (`updateCardQuantity`,
 * `swapCardPrinting`; DB-16 moves them into the deck client), with the deck
 * version this tab read beside its columns. A failure names the columns it
 * carried, for the log: `[patchCardRow:quantity] HTTP 500`.
 *
 * @returns the deck's new version, when the answer carries one
 * @throws DeckApiError when the server refuses (409 for a stale version) or fails the write
 */
async function patchCardRow(
  { deckId, expectedVersion }: deckApi.DeckWriteTarget,
  cardId: string,
  columns: Record<string, unknown>
): Promise<deckApi.VersionedAnswer> {
  if (isGuestDeckId(deckId)) return {};
  const response = await fetch(`/api/decks/${deckId}/cards/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...columns, expectedVersion }),
    signal: AbortSignal.timeout(deckApi.DECK_WRITE_TIMEOUT_MS),
  });
  if (!response.ok) {
    const context = `patchCardRow:${Object.keys(columns).join(",")}`;
    throw new DeckApiError(context, response.status);
  }
  return readAnsweredVersion(response);
}

/**
 * Puts the previous command zone back after a failed commander save and tells
 * the player, in the words the failure calls for, unless a later choice has
 * already replaced the failed attempt on screen.
 *
 * @param store - Store update and read
 * @param save - The attempt that just failed
 * @param error - What the save threw
 */
async function recoverCommanderSave(
  { set, get }: StoreAccess,
  save: FailedCommanderSave,
  error: unknown
): Promise<void> {
  if (!restoreCommanderAfterFailedSave(set, get(), save)) return;
  await settleFailedWrite(save.activeDeckId, error, "Could not save commander — try again");
}

/**
 * Reports whether any deck write is still in flight.
 *
 * Every save path shares this count so one finished request cannot hide
 * another request that is still running.
 *
 * @returns True while at least one mutation has not settled
 */
function hasPendingSaves(): boolean {
  return (
    pendingQuantityWrites.size > 0 ||
    pendingZoneWrites.size > 0 ||
    pendingNotesWrites.size > 0 ||
    pendingCategoryWrites.size > 0 ||
    pendingManualBracketWrites > 0 ||
    pendingBudgetWrites > 0 ||
    pendingFormatWrites > 0 ||
    pendingBulkRemovals > 0 ||
    pendingCardAdditionsAndRemovals > 0 ||
    pendingRenameWrites > 0
  );
}

/** How {@link DeckStore.addCard} adds a card. Every field has a default. */
export interface CardAddition {
  /** Copies to add when the zone does not hold the card yet; one when omitted. */
  readonly quantity?: number;
  /** The zone the card goes to; the main deck when omitted. */
  readonly zone?: DeckZone;
  /**
   * Whether the player chose this printing; `owned-first` when omitted. The printing selector
   * passes `explicit`, so the printing picked there is never replaced (I-57 defect 1).
   */
  readonly printing?: PrintingChoice;
}

/**
 * What {@link DeckStore.addCard} did, so the caller can say why nothing was added.
 *
 * - `added`: the zone gained the card or one more copy of it; a failed save is reported by
 *   the store itself and rolled back.
 * - `at-copy-limit`: the deck already holds every copy the format allows across the zones the
 *   limit counts (CR 100.2a, CR 903.5b); `format` names that format.
 * - `basic-land-held`: the zone already holds this basic land, and an add never raises a basic
 *   land's quantity (the caller passes the quantity on its first add).
 * - `no-open-deck`: no deck is open.
 */
export type CardAdditionResult =
  | { readonly kind: "added" }
  | { readonly kind: "at-copy-limit"; readonly format: DeckFormat }
  | { readonly kind: "basic-land-held" }
  | { readonly kind: "no-open-deck" };

export interface DeckStore {
  // State
  decks: Record<string, Deck>;
  activeDeckId: string | null;
  isSyncing: boolean;
  /** Why the last deck listing failed, or null when it succeeded. */
  loadError: string | null;
  /** Individual deck hydration failure, scoped to the deck being opened: missing or failed. */
  deckOpenError: DeckOpenError | null;

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
  /**
   * Creates an account deck and makes it the active deck. A guest opens the
   * guest deck instead.
   *
   * @param name - The deck's name
   * @param opts - `format`, Commander when left out; `isAIGenerated`;
   *   `idempotencyKey`, the same for every attempt at the same deck, so a
   *   retry after a lost answer opens the deck the server already stored
   * @returns The id of the deck now active
   * @throws When the server refuses or fails the creation
   */
  createDeck: (
    name: string,
    opts?: {
      isAIGenerated?: boolean;
      format?: DeckFormat;
      idempotencyKey?: string;
    }
  ) => Promise<string>;
  duplicateDeck: (id: string) => Promise<string>;
  deleteDeck: (id: string) => Promise<void>;
  /**
   * Drops the guest deck from memory and from this browser, once an account
   * holds a copy. Memory goes first: the guest deck is written back to the
   * browser on every store change while it is held here.
   */
  forgetGuestDeck: () => void;
  renameDeck: (id: string, name: string) => Promise<void>;
  setActiveDeck: (id: string) => Promise<void>;
  /**
   * Makes the next `setActiveDeck(deckId)` read the deck from the server: the
   * held rows are dropped, as on a listing stub. For a write made outside the
   * store, such as adding a card to another deck from a row menu.
   *
   * @param deckId - a deck that is not open; one not held is left as it is
   */
  reloadDeckOnNextOpen: (deckId: string) => void;
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
  /**
   * Adds `card` to the active deck, or one more copy when its zone already holds the card.
   *
   * @param card - The card, as search, import or a suggestion found it
   * @param addition - The copies and the zone; one copy in the main deck when omitted
   * @returns What the add did; anything but `added` means the deck did not change
   */
  addCard: (
    card: ScryfallCard,
    addition?: CardAddition
  ) => Promise<CardAdditionResult>;
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
  swapCardPrinting: (
    cardId: string,
    printing: import("@/lib/scryfall/types").ScryfallCard
  ) => Promise<void>;
  updateCardNotes: (cardId: string, notes: string | null) => Promise<void>;
  moveCardToZone: (
    cardId: string,
    zone: DeckZone,
    options?: { readonly recordUndo?: boolean }
  ) => Promise<void>;
  bulkMoveToZone: (cardIds: readonly string[], zone: DeckZone) => Promise<void>;
  bulkRemoveCards: (cardIds: readonly string[]) => Promise<void>;

  // Force save (sync) — triggers a full DB refresh for the active deck
  forceSave: () => Promise<void>;
  /**
   * Replace the open deck with the database copy.
   *
   * Used after a server-side rewrite (snapshot restore, package apply). The
   * deck listing must not be used for this: it keeps an already hydrated deck.
   *
   * @returns Resolves when the open deck matches the database, or the refresh failed.
   */
  reloadActiveDeck: () => Promise<void>;
  /**
   * Saves a bulk text edit of the open deck as one atomic server change.
   *
   * @param edit - the rows the edited text changes, and the cards it adds
   * @returns Resolves once the open deck matches the saved deck.
   * @throws When the server rejected the change; the deck is then unchanged.
   */
  applyBulkEdit: (edit: BulkEdit) => Promise<void>;

  // Deck settings
  setTargetBracket: (bracket: BracketLevel) => Promise<void>;
  setManualBracket: (bracket: BracketLevel | null) => Promise<void>;
  setBudget: (budget: number | null) => Promise<void>;
  /**
   * Switches the active deck to `format` and keeps every card (I-42
   * requirement 4.2). Optimistic, as `setBudget`: a failed save puts the
   * previous format back. A guest deck keeps the format in this browser.
   *
   * @param format - The format to switch to
   * @returns true once saved; false when there was no deck to switch or the
   *   save failed and the previous format is back
   */
  setFormat: (format: DeckFormat) => Promise<boolean>;

  // Computed getters
  getActiveDeck: () => Deck | null;
}

let latestDeckListRequest = 0;
const latestRenameRequests = new Map<string, symbol>();
const latestTagSaves = new Map<string, symbol>();

/** A tag save that may still need to be undone. */
interface FailedTagSave {
  readonly deckId: string;
  readonly request: symbol;
  /** The tags this attempt put on screen. */
  readonly attempted: readonly string[];
  /** The tags on screen before this attempt. */
  readonly previous: string[];
}

function haveSameTags(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((tag, index) => tag === b[index]);
}

/**
 * Restores the tags that were on screen before a tag save failed, while that
 * attempt is still the latest tag edit of a deck that still exists.
 *
 * Every tag save sends the whole list, so a newer edit already carries this
 * attempt's change to the server. It is left alone and no error is shown.
 *
 * @param setDeckState - Store update used only when a rollback is required
 * @param state - Store snapshot taken when the save failed
 * @param save - The attempt that just failed
 * @returns Nothing. Updates the store and shows an error when the tags are restored.
 */
function restoreTagsAfterFailedSave(
  setDeckState: (partial: Pick<DeckStore, "decks">) => void,
  state: DeckStore,
  save: FailedTagSave,
): void {
  const currentDeck = state.decks[save.deckId];
  if (
    !currentDeck ||
    latestTagSaves.get(save.deckId) !== save.request ||
    !haveSameTags(currentDeck.tags, save.attempted)
  ) {
    return;
  }
  setDeckState({
    decks: {
      ...state.decks,
      [save.deckId]: { ...currentDeck, tags: save.previous },
    },
  });
  useToastStore.getState().add("error", DECK_FAILURE_TOASTS.tags);
}

/**
 * Shows a deck's new tag list at once, saves it, and puts the previous list
 * back if that save fails.
 *
 * @param set - Deck store update
 * @param get - Deck store snapshot
 * @param deck - The deck as it was before this edit
 * @param tags - The complete tag list to save
 * @param operation - Store action name, for the error log
 * @returns Resolves once the save has settled, whether or not it succeeded.
 */
/**
 * Shows a command zone on the active deck, before or after its save.
 *
 * @param set - Store update
 * @param deckId - Deck being changed
 * @param zone - The commander, partner and pairing to show
 */
function showCommandZone(
  set: StoreApi<DeckStore>["setState"],
  deckId: string,
  zone: CommandZone
): void {
  set((state) => ({
    decks: {
      ...state.decks,
      [deckId]: withLoadedCardCount({
        ...state.decks[deckId],
        ...zone,
        updatedAt: new Date(),
      }),
    },
  }));
}

/**
 * Sends one command-zone change, which the server stores in one transaction,
 * with the deck version this tab read, and gives the commander and partner on
 * screen their saved row ids. Rejects as the request does; the caller then
 * restores the zone it put on screen.
 *
 * @param set - Store update
 * @param deckId - Deck being changed
 * @param edit - The planned change
 * @returns The rows the server added and the deck's new version
 */
async function sendCommandZoneChange(
  set: StoreApi<DeckStore>["setState"],
  deckId: string,
  edit: CommandZoneEdit
): Promise<deckApi.CommandZoneSaved> {
  const saved = await deckWrites.send(deckId, ({ expectedVersion }) =>
    deckApi.changeCommandZone(deckId, {
      ...commandZoneRequest(edit),
      expectedVersion,
    })
  );
  set((state) => ({
    decks: withSavedCommandRows(state.decks, deckId, saved.cards),
  }));
  return saved;
}

/**
 * A card as the commander slot holds it: one copy, addressed by its printing
 * id until its row is saved, flagged from the store's Game Changer and banned
 * lists.
 *
 * @param card - The card as the search or the deck list holds it
 * @param lists - The store's Game Changer and banned names
 * @returns The commander to show and to save
 */
function commanderCardOf(
  card: DeckCard,
  lists: Pick<DeckStore, "gameChangerNames" | "bannedNames">
): DeckCard {
  const printingId = card.scryfallId ?? card.id;
  return {
    ...card,
    id: printingId,
    scryfallId: printingId,
    category: "commander",
    quantity: 1,
    zone: "main",
    isMaybeboard: false,
    isGameChanger: lists.gameChangerNames.has(card.name),
    isBanned: lists.bannedNames.has(card.name),
  };
}

/** The store's update and read, for a helper that runs a whole save. */
interface StoreAccess {
  readonly set: StoreApi<DeckStore>["setState"];
  readonly get: () => DeckStore;
}

/** A format save: the format written, and the one to restore if it fails. */
interface FormatChange {
  readonly deckId: string;
  readonly attempted: DeckFormat;
  readonly previous: DeckFormat;
}

/**
 * Puts the previous format back on a deck whose format save failed, unless a
 * later switch has already replaced the attempted one.
 */
function restoreFormat(
  set: StoreAccess["set"],
  { deckId, attempted, previous }: FormatChange
): void {
  set((state) => {
    const deck = state.decks[deckId];
    if (deck?.format !== attempted) return state;
    return {
      decks: { ...state.decks, [deckId]: { ...deck, format: previous } },
    };
  });
}

/**
 * Saves a format the store already shows, and restores the previous one when
 * the save fails. The cards are never touched: a switch only re-reads them
 * (I-42 requirement 4.2).
 *
 * @returns true once the server, or this browser for a guest deck, holds it
 */
async function saveFormat(
  { set }: StoreAccess,
  change: FormatChange
): Promise<boolean> {
  pendingFormatWrites += 1;
  set({ isSyncing: true });
  try {
    await deckApi.updateDeck(change.deckId, { format: change.attempted });
    return true;
  } catch (err) {
    logger.error("Unexpected error", "setFormat", err);
    restoreFormat(set, change);
    return false;
  } finally {
    pendingFormatWrites -= 1;
    set({ isSyncing: hasPendingSaves() });
  }
}

/** A commander to seat, and the deck-list card it was promoted from, if any. */
interface CommanderSeat {
  /** The commander, from {@link commanderCardOf}. */
  readonly commander: DeckCard;
  /** The deck-list card the commander was promoted from; it leaves the list with the same request. */
  readonly promoted?: DeckCard;
}

/**
 * Seats a commander: the pairing it keeps or opens, the zone on screen, the
 * one request, and the rollback with its toast when the request fails.
 *
 * @param store - Store update and read
 * @param deckId - Deck being changed
 * @param seat - The commander, and the deck-list card it came from
 */
async function seatCommander(
  { set, get }: StoreAccess,
  deckId: string,
  { commander, promoted }: CommanderSeat
): Promise<void> {
  const previous = commandZoneOf(get().decks[deckId]);
  // CR 702.124: the partner stays only when the new commander can pair with it.
  const keptPairing = previous.partner
    ? pairCommanders(commander, previous.partner)
    : null;
  const pairingType = keptPairing ?? detectPairingType(commander);
  const attempted: CommandZone = {
    commander,
    pairingType,
    partner: keptPairing ? previous.partner : null,
  };
  const partnerLeaves = previous.partner !== null && attempted.partner === null;
  // Where the promoted card sat, so a failed save puts it back in place.
  const listedBefore = promoted ? uniqueDeckCards(get().decks[deckId]) : [];
  const followingCardIds = new Set(
    listedBefore
      .slice(listedBefore.findIndex((card) => card.id === promoted?.id) + 1)
      .map((card) => card.id)
  );

  if (commander.isGameChanger) {
    useToastStore
      .getState()
      .add(
        "warning",
        `⚡ ${commander.name} is a Game Changer — your deck is automatically Bracket 3 minimum.`
      );
  }

  // Optimistic: the promoted card leaves the list as the new zone appears.
  set((state) => {
    const deck = state.decks[deckId];
    const listed = promoted
      ? updateDeckCards(deck, (cards) => withoutCard(cards, promoted.id))
      : deck;
    return {
      decks: {
        ...state.decks,
        [deckId]: withLoadedCardCount({ ...listed, ...attempted, updatedAt: new Date() }),
      },
    };
  });

  set({ isSyncing: true });
  try {
    const slots: CommandSlotEdit[] = [{ slot: "commander", card: commander }];
    if (partnerLeaves) slots.push({ slot: "partner", card: null });
    await sendCommandZoneChange(set, deckId, {
      slots,
      fields: {
        commanderId: commander.scryfallId ?? commander.id,
        // Denormalised so community discovery can match the slug in SQL
        commanderName: commander.name,
        pairingType,
        // A partner the new commander cannot keep leaves the record too
        ...(partnerLeaves ? { partnerId: null } : {}),
      },
      removeCardIds: promoted ? [promoted.id] : [],
    });
  } catch (err) {
    logger.error("Unexpected error", "setCommander", err);
    if (promoted) {
      set((state) => {
        const deck = state.decks[deckId];
        return deck
          ? {
              decks: {
                ...state.decks,
                [deckId]: updateDeckCards(deck, (cards) =>
                  restoreRemovedCard(cards, promoted, followingCardIds)
                ),
              },
            }
          : state;
      });
    }
    await recoverCommanderSave({ set, get }, { activeDeckId: deckId, attempted, previous }, err);
  } finally {
    set({ isSyncing: hasPendingSaves() });
  }
}

async function saveDeckTags(
  set: StoreApi<DeckStore>["setState"],
  get: () => DeckStore,
  deck: Deck,
  tags: string[],
  operation: "addTag" | "removeTag",
): Promise<void> {
  const deckId = deck.id;
  const request = Symbol(operation);
  latestTagSaves.set(deckId, request);
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
    logger.error("Unexpected error", operation, err);
    restoreTagsAfterFailedSave(set, get(), {
      deckId,
      request,
      attempted: tags,
      previous: deck.tags,
    });
  } finally {
    if (latestTagSaves.get(deckId) === request) latestTagSaves.delete(deckId);
    set({ isSyncing: hasPendingSaves() });
  }
}

export const useDeckStore = create<DeckStore>()((set, get) => ({
  decks: {},
  activeDeckId: null,
  isSyncing: false,
  loadError: null,
  deckOpenError: null,
  undoStack: [],
  gameChangerNames: new Set<string>(),
  bannedNames: new Set<string>(),
  searchViewMode: "grid",
  deckViewMode: "grid",
  deckGridCols: 6,

  // Sort & group — initialised from localStorage for persistence
  ...((): Pick<DeckStore, "sortField" | "sortDirection" | "groupBy"> => {
    const pref = loadSortPreference();
    return {
      sortField: pref.sortField,
      sortDirection: pref.sortDirection,
      groupBy: pref.groupBy,
    };
  })(),

  setGameChangerNames: (names) =>
    set((state) =>
      setsContainSameValues(state.gameChangerNames, names)
        ? state
        : { gameChangerNames: names }
    ),
  setBannedNames: (names) =>
    set((state) =>
      setsContainSameValues(state.bannedNames, names)
        ? state
        : { bannedNames: names }
    ),
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
    set({
      sortField: pref.sortField,
      sortDirection: pref.sortDirection,
      groupBy: pref.groupBy,
    });
    saveSortPreference(pref);
  },

  undo: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const last = undoStack.at(-1);
    if (!last) return;
    if (!get().decks[last.deckId]) {
      useToastStore
        .getState()
        .add("error", "Open the original deck before retrying undo.");
      return;
    }
    // Pop the action
    set((s) => ({ undoStack: s.undoStack.slice(0, -1) }));

    const undoAddition = async () => {
      if (last.type !== "ADD_CARD") return;
      // Undo add → remove card (skip recording in undo stack)
      const activeDeckId = last.deckId;
      if (!activeDeckId) return;
      const deck = get().decks[activeDeckId];
      const cards = deck ? uniqueDeckCards(deck) : [];
      const exactCard = cards.find(
        (candidate) => candidate.id === last.card.id
      );
      const nameMatches = exactCard
        ? []
        : cards.filter((candidate) => candidate.name === last.card.name);
      if (!exactCard && nameMatches.length > 1) {
        set((state) => ({ undoStack: [...state.undoStack, last] }));
        useToastStore
          .getState()
          .add(
            "error",
            "Could not identify the card to undo: multiple printings match."
          );
        return;
      }
      const card = exactCard ?? nameMatches[0];
      if (!card) return;
      set((state) => ({
        decks: {
          ...state.decks,
          [activeDeckId]: updateDeckCards(state.decks[activeDeckId], (cards) =>
            withoutCard(cards, card.id)
          ),
        },
      }));
      try {
        await deckWrites.send(activeDeckId, (target) =>
          deckApi.removeCard(target, card.id)
        );
      } catch (err) {
        logger.error("Unexpected error", "undo:ADD_CARD", err);
        if (!get().decks[activeDeckId]) return;
        set((state) => {
          const currentDeck = state.decks[activeDeckId];
          return {
            decks: currentDeck
              ? {
                  ...state.decks,
                  [activeDeckId]: updateDeckCards(currentDeck, (cards) =>
                    restoreUndoCard(cards, card)
                  ),
                }
              : state.decks,
            undoStack: [...state.undoStack, last],
          };
        });
        await settleFailedWrite(activeDeckId, err, "Could not undo card addition. Please retry.");
        return;
      }
      return true;
    };
    const undoRemoval = async () => {
      if (last.type !== "REMOVE_CARD") return;
      // Undo remove → re-add card
      const activeDeckId = last.deckId;
      if (!activeDeckId) return;
      const deck = get().decks[activeDeckId];
      if (
        !deck ||
        uniqueDeckCards(deck).some((card) => card.id === last.card.id)
      )
        return;
      set((state) => ({
        decks: {
          ...state.decks,
          [activeDeckId]: updateDeckCards(
            state.decks[activeDeckId],
            (cards) => [...cards, last.card]
          ),
        },
      }));
      try {
        const saved = await deckWrites.send(activeDeckId, (target) =>
          deckApi.addCard(target, addCardPayload(last.card))
        );
        set((state) => {
          const currentDeck = state.decks[activeDeckId];
          if (!currentDeck) return state;
          return {
            decks: {
              ...state.decks,
              [activeDeckId]: updateDeckCards(currentDeck, (cards) =>
                replaceUndoCardId(cards, last.card.id, saved.id)
              ),
            },
          };
        });
      } catch (err) {
        logger.error("Unexpected error", "undo:REMOVE_CARD", err);
        if (!get().decks[activeDeckId]) return;
        set((state) => {
          const currentDeck = state.decks[activeDeckId];
          return {
            decks: currentDeck
              ? {
                  ...state.decks,
                  [activeDeckId]: updateDeckCards(currentDeck, (cards) =>
                    withoutCard(cards, last.card.id)
                  ),
                }
              : state.decks,
            undoStack: [...state.undoStack, last],
          };
        });
        await settleFailedWrite(activeDeckId, err, "Could not undo card removal. Please retry.");
        return;
      }
      return true;
    };
    const undoZoneMove = async () => {
      if (last.type !== "MOVE_ZONE") return;
      const activeDeckId = last.deckId;
      const deck = get().decks[activeDeckId];
      if (!deck) return;
      const card = uniqueDeckCards(deck).find(
        (candidate) => candidate.id === last.cardId
      );
      if (!card) return;
      if (card.zone === last.from) return true;
      await get().moveCardToZone(last.cardId, last.from, { recordUndo: false });
      const updated = get().decks[activeDeckId];
      if (!updated) return;
      const restored = uniqueDeckCards(updated).find(
        (candidate) => candidate.id === last.cardId
      );
      if (restored?.zone !== last.from) {
        set((state) => ({ undoStack: [...state.undoStack, last] }));
        return;
      }
      return true;
    };
    let applied: true | undefined;
    switch (last.type) {
      case "ADD_CARD":
        applied = await undoAddition();
        break;
      case "REMOVE_CARD":
        applied = await undoRemoval();
        break;
      case "MOVE_ZONE":
        applied = await undoZoneMove();
        break;
      default: {
        const _exhaustive: never = last;
        return _exhaustive;
      }
    }
    if (!applied) return;
    if (!get().decks[last.deckId]) return;
    useToastStore.getState().add("info", "↩ Undo applied");
  },

  forceSave: async () => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    set({ isSyncing: true });
    try {
      const apiDeck = await deckApi.fetchDeck(activeDeckId);
      if (!get().decks[activeDeckId]) return;
      const fullDeck = apiDeckToStoreDeck(apiDeck);
      set((state) => ({
        decks: { ...state.decks, [activeDeckId]: fullDeck },
      }));
      useToastStore.getState().add("success", "✓ Deck saved");
    } catch (err) {
      logger.error("Unexpected error", "forceSave", err);
      if (!get().decks[activeDeckId]) return;
      useToastStore.getState().add("error", DECK_FAILURE_TOASTS.refresh);
    } finally {
      set({ isSyncing: hasPendingSaves() });
    }
  },

  reloadActiveDeck: async () => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    set({ isSyncing: true });
    try {
      const apiDeck = await deckApi.fetchDeck(activeDeckId);
      if (!get().decks[activeDeckId]) return;
      const fullDeck = apiDeckToStoreDeck(apiDeck);
      set((state) => ({
        decks: { ...state.decks, [activeDeckId]: fullDeck },
        // The previous undo entries name cards that the server just replaced.
        undoStack: state.undoStack.filter(
          (action) => action.deckId !== activeDeckId
        ),
      }));
    } catch (err) {
      logger.error("Unexpected error", "reloadActiveDeck", err);
      if (!get().decks[activeDeckId]) return;
      useToastStore.getState().add("error", DECK_FAILURE_TOASTS.refresh);
    } finally {
      set({ isSyncing: hasPendingSaves() });
    }
  },

  applyBulkEdit: async (edit) => {
    const { activeDeckId, gameChangerNames, bannedNames } = get();
    if (!activeDeckId) return;
    const flagged = (card: ScryfallCard): DeckCard => ({
      ...makeDeckCard(card),
      isGameChanger: gameChangerNames.has(card.name),
      isBanned: bannedNames.has(card.name),
    });
    const commandCards = edit.commandZone?.cards ?? [];
    set({ isSyncing: true });
    try {
      // New lines take an owned printing when there is one, as a hand-added card does.
      const additions = await Promise.all(
        edit.additions.map(async (addition) => ({
          ...addition,
          card: (await getOwnedPrinting(addition.card)) ?? addition.card,
        }))
      );
      const apiDeck = await deckWrites.send(activeDeckId, ({ expectedVersion }) =>
        deckApi.applyCardChanges(activeDeckId, {
          expectedVersion,
          removeCardIds: edit.removedCardIds,
          quantityChanges: edit.quantityChanges,
          addCards: [
            ...commandCards.map(({ card, slot }) =>
              commandCardPayload(flagged(card), slot)
            ),
            ...additions.map(({ card, quantity, zone }) =>
              addCardPayload({ ...flagged(card), quantity, zone })
            ),
          ],
          clearCommandSlots: edit.commandZone?.clearedSlots ?? [],
          commandZone: edit.commandZone?.patch,
        })
      );
      if (!get().decks[activeDeckId]) return;
      set((state) => ({
        decks: { ...state.decks, [activeDeckId]: apiDeckToStoreDeck(apiDeck) },
        // Earlier entries name rows the edit may have removed or re-added.
        undoStack: state.undoStack.filter(
          (action) => action.deckId !== activeDeckId
        ),
      }));
    } catch (err) {
      // The bulk edit is not optimistic, so there is nothing to roll back; the
      // dialog shows the failure. A stale copy still reloads the deck here.
      await settleFailedWrite(activeDeckId, err);
      throw err;
    } finally {
      set({ isSyncing: hasPendingSaves() });
    }
  },

  // Load deck listing from the DB (lightweight: only commander/partner/companion + card count)
  loadDecks: async () => {
    const requestId = ++latestDeckListRequest;
    set({ isSyncing: true });
    try {
      const response = await deckApi.fetchDecks();
      if (requestId !== latestDeckListRequest) return;

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
        return { decks, loadError: null };
      });
    } catch (err) {
      if (requestId !== latestDeckListRequest) return;
      // Record the failure as well as logging it. Swallowing it left the page
      // rendering "No decks yet" after a 500 — an outage disguised as an empty
      // account, with no way for the user to tell the difference or retry.
      logger.error("Unexpected error", "loadDecks", err);
      set({
        loadError: err instanceof Error ? err.message : "Failed to load decks",
      });
    } finally {
      if (requestId === latestDeckListRequest)
        set({ isSyncing: hasPendingSaves() });
    }
  },

  createDeck: async (name, opts) => {
    if (isGuestDeckId(get().activeDeckId ?? "")) {
      await get().setActiveDeck(GUEST_DECK_ID);
      return GUEST_DECK_ID;
    }

    set({ isSyncing: true });
    try {
      const apiDeck = await deckApi.createDeck(name, {
        isAIGenerated: opts?.isAIGenerated,
        format: opts?.format,
        idempotencyKey: opts?.idempotencyKey,
      });
      const deck = createEmptyDeck(apiDeck.id, apiDeck.name, opts?.format);
      deck.createdAt = new Date(apiDeck.createdAt);
      deck.updatedAt = new Date(apiDeck.updatedAt);
      deck.isAIGenerated = apiDeck.isAIGenerated ?? false;
      set((state) => ({
        decks: { ...state.decks, [apiDeck.id]: deck },
        activeDeckId: apiDeck.id,
      }));
      return apiDeck.id;
    } finally {
      set({ isSyncing: hasPendingSaves() });
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
          undoStack: state.undoStack.filter((action) => action.deckId !== id),
        };
      });
    } finally {
      set({ isSyncing: hasPendingSaves() });
    }
  },

  forgetGuestDeck: () => {
    set((state) => {
      const { [GUEST_DECK_ID]: _guest, ...rest } = state.decks;
      return {
        decks: rest,
        activeDeckId:
          state.activeDeckId === GUEST_DECK_ID ? null : state.activeDeckId,
        undoStack: state.undoStack.filter(
          (action) => action.deckId !== GUEST_DECK_ID
        ),
      };
    });
    clearGuestDeck();
  },

  reloadDeckOnNextOpen: (deckId: string) => {
    set((state) => ({ decks: withDeckToReload(state.decks, deckId) }));
  },

  duplicateDeck: async (id: string) => {
    set({ isSyncing: true });
    try {
      const res = await fetch(`/api/decks/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate deck");
      const copy = (await res.json()) as { id: string; name: string };
      // Set new deck as active before reloading
      set({ activeDeckId: copy.id });
      await get().loadDecks();
      useToastStore
        .getState()
        .add("success", `Deck duplicated: "${copy.name}"`);
      return copy.id;
    } finally {
      set({ isSyncing: hasPendingSaves() });
    }
  },

  renameDeck: async (id: string, name: string) => {
    const previousDeck = get().decks[id];
    if (!previousDeck) return;
    const request = Symbol();
    latestRenameRequests.set(id, request);
    pendingRenameWrites += 1;
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
      set((state) => {
        const currentDeck = state.decks[id];
        if (
          latestRenameRequests.get(id) !== request ||
          currentDeck?.name !== name
        )
          return state;
        return {
          decks: {
            ...state.decks,
            [id]: { ...currentDeck, name: previousDeck.name },
          },
        };
      });
      if (get().decks[id]) {
        useToastStore.getState().add("error", DECK_FAILURE_TOASTS.rename);
      }
    } finally {
      pendingRenameWrites -= 1;
      set({ isSyncing: hasPendingSaves() });
    }
  },

  setActiveDeck: async (id: string) => {
    if (isGuestDeckId(id)) {
      const guestDeck = loadGuestDeck() ?? createGuestDeck();
      set((state) => ({
        activeDeckId: GUEST_DECK_ID,
        decks: { ...state.decks, [GUEST_DECK_ID]: guestDeck },
      }));
      saveGuestDeck(guestDeck);
      return;
    }
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
        deckOpenError:
          state.deckOpenError?.deckId === id ? null : state.deckOpenError,
      }));
    } catch (err) {
      logger.error("Unexpected error", "setActiveDeck.lazyLoad", err);
      const openError = deckOpenErrorFrom(id, err);
      set({ deckOpenError: openError });
      reportFailure(openFailureToast(openError));
    }
  },

  updateDeckDescription: async (deckId: string, description: string) => {
    const previousDeck = get().decks[deckId];
    if (!previousDeck) return;
    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [deckId]: {
          ...state.decks[deckId],
          description,
          updatedAt: new Date(),
        },
      },
    }));
    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(deckId, { description });
    } catch (err) {
      logger.error("Unexpected error", "updateDeckDescription", err);
      set((state) => {
        const currentDeck = state.decks[deckId];
        if (currentDeck?.description !== description) return state;
        return {
          decks: {
            ...state.decks,
            [deckId]: { ...currentDeck, description: previousDeck.description },
          },
        };
      });
      if (get().decks[deckId]) {
        useToastStore.getState().add("error", DECK_FAILURE_TOASTS.description);
      }
    } finally {
      set({ isSyncing: hasPendingSaves() });
    }
  },

  addTag: async (deckId: string, tag: string) => {
    const current = get().decks[deckId];
    if (!current) return;
    const trimmed = tag.trim().slice(0, 50);
    if (!trimmed || current.tags.includes(trimmed)) return;
    await saveDeckTags(set, get, current, [...current.tags, trimmed], "addTag");
  },

  removeTag: async (deckId: string, tag: string) => {
    const current = get().decks[deckId];
    if (!current) return;
    const tags = current.tags.filter((t) => t !== tag);
    await saveDeckTags(set, get, current, tags, "removeTag");
  },

  setCommander: async (card: ScryfallCard) => {
    const state = get();
    if (!state.activeDeckId) return;
    const commander = commanderCardOf(makeDeckCard(card), state);
    await seatCommander({ set, get }, state.activeDeckId, { commander });
  },

  clearCommander: async () => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const previous = commandZoneOf(decks[activeDeckId]);
    // Also clear partner — can't have partner without commander
    const attempted: CommandZone = {
      commander: null,
      partner: null,
      pairingType: "none",
    };
    showCommandZone(set, activeDeckId, attempted);
    set({ isSyncing: true });
    try {
      await sendCommandZoneChange(set, activeDeckId, {
        slots: [
          { slot: "commander", card: null },
          { slot: "partner", card: null },
        ],
        fields: {
          commanderId: null,
          commanderName: null,
          partnerId: null,
          pairingType: "none",
        },
      });
    } catch (err) {
      logger.error("Unexpected error", "clearCommander", err);
      await recoverCommanderSave({ set, get }, { activeDeckId, attempted, previous }, err);
    } finally {
      set({ isSyncing: hasPendingSaves() });
    }
  },

  setPartner: async (card: ScryfallCard | null) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const commander = decks[activeDeckId]?.commander ?? null;
    const previousPartner = decks[activeDeckId]?.partner ?? null;
    const previousPairingType = decks[activeDeckId]?.pairingType ?? "none";
    const deckCard: DeckCard | null = card
      ? { ...makeDeckCard(card), scryfallId: card.id, category: "commander" }
      : null;

    // CR 702.124: a second commander joins only through a partner ability
    // that both cards allow.
    const pairing =
      commander && deckCard ? pairCommanders(commander, deckCard) : null;
    if (commander && deckCard && !pairing) {
      useToastStore
        .getState()
        .add(
          "warning",
          `${deckCard.name} cannot share the command zone with ${commander.name}.`
        );
      return;
    }
    // Without a commander yet, the partner's own pairing opens the slot.
    const partnerPairingType = deckCard ? detectPairingType(deckCard) : "none";
    const effectivePairingType =
      pairing ??
      (previousPairingType === "none" && partnerPairingType !== "none"
        ? partnerPairingType
        : previousPairingType);

    showCommandZone(set, activeDeckId, {
      commander,
      partner: deckCard,
      pairingType: effectivePairingType,
    });
    set({ isSyncing: true });
    try {
      await sendCommandZoneChange(set, activeDeckId, {
        slots: [{ slot: "partner", card: deckCard }],
        fields: {
          partnerId: card?.id ?? null,
          pairingType: effectivePairingType,
        },
      });
    } catch (err) {
      logger.error("Unexpected error", "setPartner", err);
      const restored = restorePartnerAfterFailedSave(set, get(), {
        activeDeckId,
        attemptedPartnerId: deckCard?.id ?? null,
        previousPartner,
        previousPairingType,
      });
      if (restored) {
        await settleFailedWrite(activeDeckId, err, "Could not save partner — try again");
      }
    } finally {
      set({ isSyncing: hasPendingSaves() });
    }
  },

  setCompanion: async (card: ScryfallCard | null) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;

    if (card === null) {
      if (!deck.companion) return;
      set({ isSyncing: true });
      try {
        await sendCommandZoneChange(set, activeDeckId, {
          slots: [{ slot: "companion", card: null }],
          fields: { companionId: null },
        });
        set((state) => ({
          decks: {
            ...state.decks,
            [activeDeckId]: withLoadedCardCount({
              ...state.decks[activeDeckId],
              companion: null,
              updatedAt: new Date(),
            }),
          },
        }));
      } catch (err) {
        logger.error("Unexpected error", "setCompanion", err);
        await settleFailedWrite(activeDeckId, err, "Could not remove companion — try again");
      } finally {
        set({ isSyncing: hasPendingSaves() });
      }
      return;
    }

    if (!deck.commander) {
      useToastStore
        .getState()
        .add("warning", "Choose a commander before setting a companion.");
      return;
    }

    if (!isScryfallCompanionCard(card)) {
      useToastStore
        .getState()
        .add("warning", "That card does not have Companion.");
      return;
    }

    if (isBannedCompanionInCommander(card)) {
      useToastStore
        .getState()
        .add("warning", "Lutri cannot be your companion in Commander.");
      return;
    }

    const deckCard: DeckCard = { ...makeDeckCard(card), category: "companion" };

    // The companion appears once saved (B2-36 covers making it optimistic).
    set({ isSyncing: true });
    try {
      const saved = await sendCommandZoneChange(set, activeDeckId, {
        slots: [{ slot: "companion", card: deckCard }],
        fields: { companionId: card.id },
      });
      const row = savedRowsBySlot(saved.cards).companion;
      set((state) => ({
        decks: {
          ...state.decks,
          [activeDeckId]: withLoadedCardCount({
            ...state.decks[activeDeckId],
            companion: {
              ...deckCard,
              id: row?.id ?? deckCard.id,
              scryfallId: row?.scryfallId ?? card.id,
            },
            updatedAt: new Date(),
          }),
        },
      }));
    } catch (err) {
      logger.error("Unexpected error", "setCompanion", err);
      await settleFailedWrite(activeDeckId, err, "Could not save companion — try again");
    } finally {
      set({ isSyncing: hasPendingSaves() });
    }
  },

  addCard: async (
    card: ScryfallCard,
    { quantity, zone = "main", printing = "owned-first" }: CardAddition = {}
  ): Promise<CardAdditionResult> => {
    const { activeDeckId, decks, gameChangerNames, bannedNames } = get();
    if (!activeDeckId) return { kind: "no-open-deck" };
    const deck = decks[activeDeckId];
    if (!deck) return { kind: "no-open-deck" };

    const isBasic = isBasicLand(card.type_line);

    const room = copyRoom(
      deck,
      {
        name: card.name,
        typeLine: card.type_line,
        oracleText: card.oracle_text,
      },
      zone
    );
    // At the limit across every row and zone the limit counts → skip, and say so
    if (room < 1) return { kind: "at-copy-limit", format: deck.format };
    const exists = uniqueDeckCards(deck).find(
      (c) => c.name === card.name && c.zone === zone
    );
    if (exists) {
      // Basic land already present — skip (caller should pass quantity on first add)
      if (isBasic) return { kind: "basic-land-held" };
      // Can add more → increment quantity
      await get().updateCardQuantity(exists.id, 1);
      return { kind: "added" };
    }

    const selectedCard = await printingToAdd(card, printing);
    const deckCard = makeDeckCard(selectedCard);
    // The first add clamps to the copy limit, as an edit does (CR 100.2a, CR 903.5b).
    deckCard.quantity = copiesWithinLimit(quantity, room);
    // Apply target zone (sideboard / maybeboard / main)
    deckCard.zone = zone;
    deckCard.isMaybeboard = zone === "maybeboard";
    deckCard.isGameChanger = gameChangerNames.has(selectedCard.name);
    deckCard.isBanned = bannedNames.has(selectedCard.name);

    warnIfGameChangerAdded(deck, deckCard);

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: updateDeckCards(state.decks[activeDeckId], (cards) => [
          ...cards,
          deckCard,
        ]),
      },
    }));

    pendingCardAdditionsAndRemovals += 1;
    set({ isSyncing: true });
    try {
      const saved = await deckWrites.send(activeDeckId, (target) =>
        deckApi.addCard(target, addCardPayload(deckCard))
      );
      // Update the card's local id to the DB-generated CUID for future ops
      set((state) => ({
        decks: {
          ...state.decks,
          [activeDeckId]: {
            ...state.decks[activeDeckId],
            ...updateDeckCards(state.decks[activeDeckId], (cards) =>
              cards.map((c) =>
                c.id === deckCard.id ? { ...c, id: saved.id } : c
              )
            ),
          },
        },
        // Record in undo stack (use saved id)
        undoStack: [
          ...state.undoStack,
          {
            type: "ADD_CARD" as const,
            deckId: activeDeckId,
            card: { ...deckCard, id: saved.id },
          },
        ],
      }));
    } catch (err) {
      logger.error("Unexpected error", "addCard", err);
      if (get().decks[activeDeckId]) {
        set((state) => ({
          decks: {
            ...state.decks,
            [activeDeckId]: updateDeckCards(
              state.decks[activeDeckId],
              (cards) => withoutCard(cards, deckCard.id)
            ),
          },
        }));
        await settleFailedWrite(activeDeckId, err, "Could not add card. Please retry.");
      }
    } finally {
      pendingCardAdditionsAndRemovals -= 1;
      set({ isSyncing: hasPendingSaves() });
    }
    return { kind: "added" };
  },

  addDeckCard: async (card: DeckCard) => {
    const { activeDeckId, decks, gameChangerNames, bannedNames } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;
    const room = copyRoom(deck, card, card.zone);
    if (room < 1) return;
    const exists = uniqueDeckCards(deck).find(
      (c) => c.name === card.name && c.zone === card.zone
    );
    if (exists) {
      await get().updateCardQuantity(exists.id, 1);
      return;
    }
    const ownedPrinting = card.scryfallId
      ? await getOwnedPrinting({ id: card.scryfallId, name: card.name })
      : null;
    const enriched = {
      ...(ownedPrinting ? makeDeckCard(ownedPrinting) : card),
      category: card.category,
      quantity: copiesWithinLimit(card.quantity, room),
      zone: card.zone,
      isGameChanger: gameChangerNames.has(card.name),
      isBanned: bannedNames.has(card.name),
      isMaybeboard: card.zone === "maybeboard",
    };

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: updateDeckCards(state.decks[activeDeckId], (cards) => [
          ...cards,
          enriched,
        ]),
      },
    }));

    set({ isSyncing: true });
    try {
      const saved = await deckWrites.send(activeDeckId, (target) =>
        deckApi.addCard(target, addCardPayload(enriched))
      );
      set((state) => ({
        decks: {
          ...state.decks,
          [activeDeckId]: {
            ...state.decks[activeDeckId],
            ...updateDeckCards(state.decks[activeDeckId], (cards) =>
              cards.map((c) =>
                c.id === enriched.id ? { ...c, id: saved.id } : c
              )
            ),
          },
        },
      }));
    } catch (err) {
      logger.error("Unexpected error", "addDeckCard", err);
      // No rollback and no toast today (B2-36); a stale copy still reloads.
      await settleFailedWrite(activeDeckId, err);
    } finally {
      set({ isSyncing: hasPendingSaves() });
    }
  },

  removeCard: async (cardId: string) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;

    // Capture card before removing for undo stack
    const removedCard = decks[activeDeckId]
      ? (uniqueDeckCards(decks[activeDeckId]).find((c) => c.id === cardId) ??
        null)
      : null;
    if (!removedCard) return;
    const originalCards = uniqueDeckCards(decks[activeDeckId]);
    const removedIndex = originalCards.findIndex((card) => card.id === cardId);
    const followingCardIds = new Set(
      originalCards.slice(removedIndex + 1).map((card) => card.id)
    );
    const removalAction: DeckAction = {
      type: "REMOVE_CARD",
      deckId: activeDeckId,
      card: removedCard,
    };

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: updateDeckCards(state.decks[activeDeckId], (cards) =>
          cards.filter((c) => c.id !== cardId)
        ),
      },
      // Record in undo stack
      undoStack: [...state.undoStack, removalAction],
    }));

    pendingCardAdditionsAndRemovals += 1;
    set({ isSyncing: true });
    try {
      await deckWrites.send(activeDeckId, (target) =>
        deckApi.removeCard(target, cardId)
      );
    } catch (err) {
      logger.error("Unexpected error", "removeCard", err);
      set((state) => {
        const currentDeck = state.decks[activeDeckId];
        return {
          decks: currentDeck
            ? {
                ...state.decks,
                [activeDeckId]: updateDeckCards(currentDeck, (cards) => {
                  if (cards.some((card) => card.id === cardId)) return cards;
                  const followingIndex = cards.findIndex((card) =>
                    followingCardIds.has(card.id)
                  );
                  const restoreIndex =
                    followingIndex < 0 ? cards.length : followingIndex;
                  return [
                    ...cards.slice(0, restoreIndex),
                    removedCard,
                    ...cards.slice(restoreIndex),
                  ];
                }),
              }
            : state.decks,
          undoStack: state.undoStack.filter(
            (action) => action !== removalAction
          ),
        };
      });
      await settleFailedWrite(activeDeckId, err, DECK_FAILURE_TOASTS.cardRemoval);
    } finally {
      pendingCardAdditionsAndRemovals -= 1;
      set({ isSyncing: hasPendingSaves() });
    }
  },

  updateCardCategory: async (cardId: string, category: CardCategory) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;
    const previousCard = uniqueDeckCards(deck).find(
      (card) => card.id === cardId
    );
    if (!previousCard) return;
    const key = `${activeDeckId}:${cardId}`;
    const pending = pendingCategoryWrites.get(key) ?? {
      confirmedCategory: previousCard.category,
      tail: Promise.resolve(),
    };
    pendingCategoryWrites.set(key, pending);

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: updateDeckCards(state.decks[activeDeckId], (cards) =>
          cards.map((c) => (c.id === cardId ? { ...c, category } : c))
        ),
      },
    }));

    set({ isSyncing: true });
    const write = pending.tail.then(async () => {
      try {
        await deckWrites.send(activeDeckId, (target) =>
          deckApi.updateCardCategory(target, cardId, category)
        );
        pending.confirmedCategory = category;
      } catch (err) {
        logger.error("Unexpected error", "updateCardCategory", err);
        if (pending.tail === write) {
          set((state) => {
            const currentDeck = state.decks[activeDeckId];
            if (!currentDeck) return state;
            return {
              decks: {
                ...state.decks,
                [activeDeckId]: updateDeckCards(currentDeck, (cards) =>
                  restoreCardCategory(
                    cards,
                    cardId,
                    category,
                    pending.confirmedCategory
                  )
                ),
              },
            };
          });
          await settleFailedWrite(activeDeckId, err, "Could not save card category. Please retry.");
        }
      } finally {
        if (pending.tail === write) {
          pendingCategoryWrites.delete(key);
          set({ isSyncing: hasPendingSaves() });
        }
      }
    });
    pending.tail = write;
    await write;
  },

  updateCardQuantity: async (cardId, delta) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;
    const card = uniqueDeckCards(deck).find((c) => c.id === cardId);
    if (!card) return;

    const newQty = steppedQuantity(
      card.quantity,
      delta,
      copyRoom(deck, card, card.zone)
    );
    if (newQty === card.quantity) return;
    const writeKey = `${activeDeckId}:${cardId}`;
    const previousWrite = pendingQuantityWrites.get(writeKey);
    const confirmedQuantity = previousWrite?.confirmedQuantity ?? card.quantity;

    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: updateDeckCards(state.decks[activeDeckId], (cards) =>
          cards.map((c) => (c.id === cardId ? { ...c, quantity: newQty } : c))
        ),
      },
    }));
    set({ isSyncing: true });
    const write: PendingQuantityWrite = {
      confirmedQuantity,
      promise: Promise.resolve(),
    };
    pendingQuantityWrites.set(writeKey, write);
    write.promise = (async () => {
      await previousWrite?.promise;
      try {
        await deckWrites.send(activeDeckId, (target) =>
          patchCardRow(target, cardId, { quantity: newQty })
        );
        write.confirmedQuantity = newQty;
      } catch (err) {
        logger.error("Unexpected error", "updateCardQuantity", err);
        if (pendingQuantityWrites.get(writeKey) === write) {
          const savedQuantity = write.confirmedQuantity;
          set((state) => {
            const currentDeck = state.decks[activeDeckId];
            if (
              !currentDeck ||
              !uniqueDeckCards(currentDeck).some(
                (c) => c.id === cardId && c.quantity === newQty
              )
            )
              return state;
            return {
              decks: {
                ...state.decks,
                [activeDeckId]: updateDeckCards(currentDeck, (cards) =>
                  restoreCardQuantity(cards, cardId, savedQuantity)
                ),
              },
            };
          });
          await settleFailedWrite(
            activeDeckId,
            err,
            "Could not save card quantity — previous quantity restored."
          );
        }
      } finally {
        const nextWrite = pendingQuantityWrites.get(writeKey);
        if (nextWrite && nextWrite !== write)
          nextWrite.confirmedQuantity = write.confirmedQuantity;
        if (nextWrite === write) {
          pendingQuantityWrites.delete(writeKey);
          set({ isSyncing: hasPendingSaves() });
        }
      }
    })();
    await write.promise;
  },

  promoteToCommander: async (cardId) => {
    const state = get();
    const { activeDeckId } = state;
    if (!activeDeckId) return;
    const card = state.decks[activeDeckId]?.cards.find((c) => c.id === cardId);
    if (!card) return;
    // The card leaves the deck list and takes the commander slot in one request.
    await seatCommander({ set, get }, activeDeckId, {
      commander: commanderCardOf(card, state),
      promoted: card,
    });
  },

  swapCardPrinting: async (cardId, printing) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    const previousCard = get().decks[activeDeckId]?.cards.find(
      (card) => card.id === cardId
    );
    if (!previousCard) return;
    // The printing, its images and its price change together (I-57 defect 2).
    const swapped = printingColumns(printing);
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: updateDeckCards(state.decks[activeDeckId], (cards) =>
          cards.map((c) => (c.id === cardId ? { ...c, ...swapped } : c))
        ),
      },
    }));
    set({ isSyncing: true });
    try {
      await deckWrites.send(activeDeckId, (target) =>
        patchCardRow(target, cardId, swapped)
      );
    } catch (err) {
      logger.error("Unexpected error", "swapCardPrinting", err);
      set((state) => {
        const deck = state.decks[activeDeckId];
        if (!deck) return state;
        return {
          decks: {
            ...state.decks,
            [activeDeckId]: updateDeckCards(deck, (cards) =>
              cards.map((card) =>
                card.id === cardId &&
                card.scryfallId === swapped.scryfallId &&
                card.imageUri === swapped.imageUri
                  ? {
                      ...card,
                      scryfallId: previousCard.scryfallId,
                      imageUri: previousCard.imageUri,
                      artCropUri: previousCard.artCropUri,
                      price: previousCard.price,
                    }
                  : card
              )
            ),
          },
        };
      });
      await settleFailedWrite(activeDeckId, err, "Could not save card printing — try again");
    } finally {
      set({ isSyncing: hasPendingSaves() });
    }
  },

  updateCardNotes: async (cardId: string, notes: string | null) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    const deck = get().decks[activeDeckId];
    const currentCard =
      deck && uniqueDeckCards(deck).find((card) => card.id === cardId);
    if (!currentCard) return;
    const key = `${activeDeckId}:${cardId}`;
    const pending = pendingNotesWrites.get(key) ?? {
      confirmedNotes: currentCard.notes,
      tail: Promise.resolve(),
    };
    pendingNotesWrites.set(key, pending);

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: updateDeckCards(state.decks[activeDeckId], (cards) =>
          cards.map((c) => (c.id === cardId ? { ...c, notes } : c))
        ),
      },
    }));

    set({ isSyncing: true });
    const write = pending.tail.then(async () => {
      try {
        await deckWrites.send(activeDeckId, (target) =>
          deckApi.updateCardNotes(target, cardId, notes)
        );
        pending.confirmedNotes = notes;
      } catch (err) {
        logger.error("Unexpected error", "updateCardNotes", err);
        if (pending.tail === write) {
          set((state) => {
            const currentDeck = state.decks[activeDeckId];
            if (!currentDeck) return state;
            return {
              decks: {
                ...state.decks,
                [activeDeckId]: updateDeckCards(currentDeck, (cards) =>
                  restoreCardNotes(cards, cardId, notes, pending.confirmedNotes)
                ),
              },
            };
          });
          await settleFailedWrite(activeDeckId, err, "Could not save card notes. Try again.");
        }
      } finally {
        if (pending.tail === write) {
          pendingNotesWrites.delete(key);
          set({ isSyncing: hasPendingSaves() });
        }
      }
    });
    pending.tail = write;
    await write;
  },

  moveCardToZone: async (cardId, zone, options) => {
    const recordUndo = options?.recordUndo !== false;
    const { activeDeckId } = get();
    if (!activeDeckId) return;

    const deck = get().decks[activeDeckId];
    if (!deck) return;
    const stored = deck.cards.find((card) => card.id === cardId);
    const mirror = stored
      ? undefined
      : deck.maybeboard.find((card) => card.id === cardId);
    const moved = stored ?? mirror;
    if (!moved) return;
    const currentZone = stored?.zone ?? "maybeboard";
    const persistedZone = stored?.zone ?? mirror?.zone ?? "main";
    if (currentZone === zone && persistedZone === zone) return;
    if (
      moveExceedsCopyLimit(deck, { card: moved, from: currentZone, to: zone })
    )
      return;

    const key = `${activeDeckId}:${cardId}`;
    const pending = pendingZoneWrites.get(key) ?? {
      confirmedZone: persistedZone,
      tail: Promise.resolve(),
    };
    pendingZoneWrites.set(key, pending);

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: setCardsZone(
          state.decks[activeDeckId],
          new Set([cardId]),
          zone
        ),
      },
    }));

    set({ isSyncing: true });
    const write = pending.tail.then(async () => {
      try {
        await deckWrites.send(activeDeckId, (target) =>
          deckApi.updateCardZone(target, cardId, zone)
        );
        pending.confirmedZone = zone;
        if (recordUndo && persistedZone !== zone) {
          set((state) => ({
            undoStack: [
              ...state.undoStack,
              {
                type: "MOVE_ZONE",
                deckId: activeDeckId,
                cardId,
                from: persistedZone,
                to: zone,
              },
            ],
          }));
        }
      } catch (err) {
        logger.error("Unexpected error", "moveCardToZone", err);
        const deckAtFailure = get().decks[activeDeckId];
        if (
          pending.tail === write &&
          deckAtFailure &&
          uniqueDeckCards(deckAtFailure).some((card) => card.id === cardId)
        ) {
          set((state) => {
            const currentDeck = state.decks[activeDeckId];
            const latestCard = currentDeck
              ? uniqueDeckCards(currentDeck).find((card) => card.id === cardId)
              : undefined;
            if (latestCard?.zone !== zone) return state;
            return {
              decks: {
                ...state.decks,
                [activeDeckId]: setCardsZone(
                  currentDeck,
                  new Set([cardId]),
                  pending.confirmedZone
                ),
              },
            };
          });
          await settleFailedWrite(activeDeckId, err, "Could not move card. Try again.");
        }
      } finally {
        if (pending.tail === write) {
          pendingZoneWrites.delete(key);
          set({ isSyncing: hasPendingSaves() });
        }
      }
    });
    pending.tail = write;
    await write;
  },

  bulkMoveToZone: async (cardIds, zone) => {
    await Promise.all(cardIds.map((id) => get().moveCardToZone(id, zone)));
  },

  bulkRemoveCards: async (cardIds) => {
    // The failures of the rows that were put back, to report once.
    const failures: unknown[] = [];
    const { activeDeckId } = get();
    if (!activeDeckId || cardIds.length === 0) return;

    const previousDeck = get().decks[activeDeckId];
    if (!previousDeck) return;
    const originalCards = uniqueDeckCards(previousDeck);

    const selectedIds = new Set(cardIds);
    const idSet = new Set(
      originalCards
        .filter((card) => selectedIds.has(card.id))
        .map((card) => card.id)
    );
    if (idSet.size === 0) return;
    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: updateDeckCards(state.decks[activeDeckId], (cards) =>
          cards.filter((c) => !idSet.has(c.id))
        ),
      },
    }));

    set({ isSyncing: true });
    pendingBulkRemovals += 1;
    try {
      await Promise.all(
        [...idSet].map(async (id) => {
          try {
            await deckWrites.send(activeDeckId, (target) =>
              deckApi.removeCard(target, id)
            );
          } catch (err) {
            logger.error("Unexpected error", "bulkRemoveCards", err);
            const removedCard = originalCards.find((card) => card.id === id);
            if (!removedCard) return;
            const removedIndex = originalCards.findIndex(
              (card) => card.id === id
            );
            const followingCardIds = new Set(
              originalCards.slice(removedIndex + 1).map((card) => card.id)
            );
            set((state) => {
              const currentDeck = state.decks[activeDeckId];
              if (!currentDeck) return state;
              return {
                decks: {
                  ...state.decks,
                  [activeDeckId]: updateDeckCards(currentDeck, (cards) =>
                    restoreRemovedCard(cards, removedCard, followingCardIds)
                  ),
                },
              };
            });
            failures.push(err);
          }
        })
      );
    } catch (err) {
      logger.error("Unexpected error", "bulkRemoveCards", err);
    } finally {
      // One report for the whole removal: the stale refusal when there was
      // one (the rows behind it were dropped, not refused), else the first
      // failure that was not a drop.
      const reported =
        failures.find(isStaleDeckRefusal) ??
        failures.find((failure) => !(failure instanceof DroppedDeckWriteError));
      if (reported !== undefined && get().decks[activeDeckId]) {
        await settleFailedWrite(activeDeckId, reported, DECK_FAILURE_TOASTS.cardRemoval);
      }
      pendingBulkRemovals -= 1;
      set({ isSyncing: hasPendingSaves() });
    }
  },

  setTargetBracket: async (bracket) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    const previousDeck = get().decks[activeDeckId];
    if (!previousDeck) return;

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
      set((state) => {
        const currentDeck = state.decks[activeDeckId];
        if (currentDeck?.targetBracket !== bracket) return state;
        return {
          decks: {
            ...state.decks,
            [activeDeckId]: {
              ...currentDeck,
              targetBracket: previousDeck.targetBracket,
            },
          },
        };
      });
      if (get().decks[activeDeckId]) {
        useToastStore
          .getState()
          .add("error", DECK_FAILURE_TOASTS.targetBracket);
      }
    } finally {
      set({ isSyncing: hasPendingSaves() });
    }
  },

  setManualBracket: async (bracket) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    const previousDeck = get().decks[activeDeckId];
    if (!previousDeck) return;

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
      pendingManualBracketWrites += 1;
      await deckApi.updateDeck(activeDeckId, { manualBracket: bracket });
    } catch (err) {
      logger.error("Unexpected error", "setManualBracket", err);
      set((state) => {
        const currentDeck = state.decks[activeDeckId];
        if (currentDeck?.manualBracket !== bracket) return state;
        return {
          decks: {
            ...state.decks,
            [activeDeckId]: {
              ...currentDeck,
              manualBracket: previousDeck.manualBracket,
            },
          },
        };
      });
      if (get().decks[activeDeckId]) {
        useToastStore
          .getState()
          .add("error", DECK_FAILURE_TOASTS.manualBracket);
      }
    } finally {
      pendingManualBracketWrites -= 1;
      set({ isSyncing: hasPendingSaves() });
    }
  },

  setBudget: async (budget) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;
    const previousDeck = get().decks[activeDeckId];
    if (!previousDeck) return;

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

    pendingBudgetWrites += 1;
    set({ isSyncing: true });
    try {
      await deckApi.updateDeck(activeDeckId, { budget });
    } catch (err) {
      logger.error("Unexpected error", "setBudget", err);
      set((state) => {
        const currentDeck = state.decks[activeDeckId];
        if (currentDeck?.budget !== budget) return state;
        return {
          decks: {
            ...state.decks,
            [activeDeckId]: { ...currentDeck, budget: previousDeck.budget },
          },
        };
      });
      if (get().decks[activeDeckId]) {
        useToastStore.getState().add("error", DECK_FAILURE_TOASTS.budget);
      }
    } finally {
      pendingBudgetWrites -= 1;
      set({ isSyncing: hasPendingSaves() });
    }
  },

  setFormat: async (format) => {
    const { activeDeckId } = get();
    const deck = activeDeckId ? get().decks[activeDeckId] : undefined;
    if (!activeDeckId || !deck) return false;

    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: { ...deck, format, updatedAt: new Date() },
      },
    }));
    return saveFormat(
      { set, get },
      { deckId: activeDeckId, attempted: format, previous: deck.format }
    );
  },

  addToMaybeboard: async (card: ScryfallCard) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;

    // As in the deck (CR 903.5b), a basic land may sit in the maybeboard more than once.
    const exists =
      !isBasicLand(card.type_line ?? "") &&
      uniqueDeckCards(deck).find(
        (c) => c.name === card.name && c.zone === "maybeboard"
      );
    if (exists) return;

    const deckCard = makeDeckCard(card);
    deckCard.zone = "maybeboard";
    deckCard.isMaybeboard = true;

    // Optimistic update
    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: updateDeckCards(state.decks[activeDeckId], (cards) => [
          ...cards,
          deckCard,
        ]),
      },
    }));

    try {
      const saved = await deckWrites.send(activeDeckId, (target) =>
        deckApi.addCard(target, addCardPayload(deckCard))
      );
      // Update id to DB-generated id
      set((state) => ({
        decks: {
          ...state.decks,
          [activeDeckId]: {
            ...updateDeckCards(state.decks[activeDeckId], (cards) =>
              cards.map((c) => (c.id === card.id ? { ...c, id: saved.id } : c))
            ),
          },
        },
      }));
    } catch (err) {
      logger.error("Unexpected error", "addToMaybeboard", err);
      set((state) => {
        const currentDeck = state.decks[activeDeckId];
        if (!currentDeck) return state;
        return {
          decks: {
            ...state.decks,
            [activeDeckId]: updateDeckCards(currentDeck, (cards) =>
              cards.filter(
                (current) =>
                  current.id !== deckCard.id || current.zone !== "maybeboard"
              )
            ),
          },
        };
      });
      // No toast today for the maybeboard; a stale copy still reloads.
      await settleFailedWrite(activeDeckId, err);
    }
  },

  removeFromMaybeboard: async (cardId: string) => {
    const { activeDeckId } = get();
    if (!activeDeckId) return;

    set((state) => ({
      decks: {
        ...state.decks,
        [activeDeckId]: updateDeckCards(state.decks[activeDeckId], (cards) =>
          cards.filter((c) => c.id !== cardId)
        ),
      },
    }));

    try {
      await deckWrites.send(activeDeckId, (target) =>
        deckApi.removeCard(target, cardId)
      );
    } catch (err) {
      logger.error("Unexpected error", "removeFromMaybeboard", err);
      // No rollback and no toast today; a stale copy still reloads.
      await settleFailedWrite(activeDeckId, err);
    }
  },

  moveToMaybeboard: async (cardId: string) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;

    const card = uniqueDeckCards(deck).find((c) => c.id === cardId);
    if (!card || card.zone === "maybeboard") return;

    await get().moveCardToZone(cardId, "maybeboard");
  },

  moveToDeck: async (cardId: string) => {
    const { activeDeckId, decks } = get();
    if (!activeDeckId) return;
    const deck = decks[activeDeckId];
    if (!deck) return;

    const cards = uniqueDeckCards(deck);
    const card = cards.find(
      (candidate) => candidate.id === cardId && candidate.zone === "maybeboard"
    );
    if (!card) return;

    const alreadyInDeck = cards.some(
      (candidate) =>
        candidate.name === card.name && candidate.zone !== "maybeboard"
    );
    if (alreadyInDeck) return;

    await get().moveCardToZone(cardId, "main");
  },

  getActiveDeck: () => {
    const { activeDeckId, decks } = get();
    return activeDeckId ? (decks[activeDeckId] ?? null) : null;
  },
}));

if (typeof window !== "undefined") {
  useDeckStore.subscribe((state) => {
    const guestDeck = state.decks[GUEST_DECK_ID];
    if (guestDeck) saveGuestDeck(guestDeck);
  });
}
