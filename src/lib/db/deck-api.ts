// HTTP client for the deck API routes
import type {
  Deck,
  DeckCard,
  DeckZone,
  CardCategory,
  CommanderPairingType,
} from "@/lib/deck/types";
import {
  COMMAND_SLOT_ROWS,
  type CommandSlot,
  type CommandZonePatch,
} from "@/lib/deck/bulk-edit-command-zone";
import {
  createGuestDeck,
  isGuestDeckId,
  loadGuestDeck,
} from "@/lib/deck/guest-deck";

/** Shape returned by the API (dates as ISO strings) */
export interface ApiDeck extends Omit<
  Deck,
  | "createdAt"
  | "updatedAt"
  | "commander"
  | "partner"
  | "cards"
  | "manualBracket"
  | "cardCount"
> {
  createdAt: string;
  updatedAt: string;
  commanderId: string | null;
  commanderName: string | null;
  partnerId: string | null;
  companionId: string | null;
  pairingType: CommanderPairingType;
  /** Raw DB value — cast to 1|2|3|4|null in store */
  manualBracket: number | null;
  isAIGenerated: boolean;
  isPublic: boolean;
  forkedFromDeckId?: string | null;
  forkedFromDeckName?: string | null;
  forkedFromUserName?: string | null;
  cards: ApiDeckCard[];
  /** Prisma _count — present on listing responses */
  _count?: { cards: number };
}

export interface ApiDeckCard extends Omit<DeckCard, "id" | "zone"> {
  id: string; // DB-generated CUID (not scryfall id)
  deckId: string;
  scryfallId: string;
  isCommander: boolean;
  isPartner: boolean;
  zone: DeckZone;
}

/** Paginated deck listing response */
export interface ApiDeckListResponse {
  decks: ApiDeck[];
  total: number;
  page: number;
  limit: number;
}

function guestCardToApiCard(
  card: DeckCard,
  isCommander = false,
  isPartner = false
): ApiDeckCard {
  return {
    ...card,
    deckId: "guest",
    scryfallId: card.scryfallId ?? card.id,
    isCommander,
    isPartner,
  };
}

function getGuestApiDeck(): ApiDeck {
  const deck = loadGuestDeck() ?? createGuestDeck();
  const cards = deck.cards.map((card) => guestCardToApiCard(card));
  if (deck.commander) cards.push(guestCardToApiCard(deck.commander, true));
  if (deck.partner) cards.push(guestCardToApiCard(deck.partner, true, true));
  if (deck.companion) cards.push(guestCardToApiCard(deck.companion));
  return {
    ...deck,
    createdAt: deck.createdAt.toISOString(),
    updatedAt: deck.updatedAt.toISOString(),
    commanderId: deck.commander?.scryfallId ?? deck.commander?.id ?? null,
    commanderName: deck.commander?.name ?? null,
    partnerId: deck.partner?.scryfallId ?? deck.partner?.id ?? null,
    companionId: deck.companion?.scryfallId ?? deck.companion?.id ?? null,
    cards,
  };
}

function getGuestApiCard(cardId: string): ApiDeckCard {
  const deck = loadGuestDeck() ?? createGuestDeck();
  const card = [
    ...deck.cards,
    ...deck.maybeboard,
    deck.commander,
    deck.partner,
    deck.companion,
  ].find((candidate) => candidate?.id === cardId);
  return guestCardToApiCard(
    card ?? {
      id: cardId,
      name: "",
      manaCost: "",
      cmc: 0,
      typeLine: "",
      oracleText: "",
      colorIdentity: [],
      isGameChanger: false,
      isBanned: false,
      price: null,
      imageUri: "",
      artCropUri: "",
      category: "other",
      quantity: 1,
      zone: "main",
    }
  );
}

/** Longest server-supplied message we will forward to the UI. */
const MAX_API_ERROR_LENGTH = 200;

/**
 * Throws with the server's own `error` string when it sent one.
 *
 * A bare "HTTP 500" told the user nothing and told us nothing either; the deck
 * routes already return a short, fixed reason, so surface it. Only the `error`
 * field is read — never the whole body — so nothing unexpected reaches the UI.
 */
async function handleApiError(res: Response, context: string): Promise<never> {
  let detail = "";
  try {
    const body: unknown = await res.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      detail = body.error.slice(0, MAX_API_ERROR_LENGTH);
    }
  } catch {
    // Non-JSON error body (a proxy timeout page, say) — the status is all we have.
  }
  const suffix = detail ? `: ${detail}` : "";
  throw new Error(`[${context}] HTTP ${res.status}${suffix}`);
}

// ─── Deck CRUD ────────────────────────────────────────────────────────────────

export async function fetchDecks(
  page = 0,
  limit = 20
): Promise<ApiDeckListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`/api/decks?${params}`, { signal: controller.signal });
    if (!res.ok) await handleApiError(res, "fetchDecks");
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDeck(id: string): Promise<ApiDeck> {
  if (isGuestDeckId(id)) return getGuestApiDeck();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`/api/decks/${id}`, { signal: controller.signal });
    if (!res.ok) await handleApiError(res, "fetchDeck");
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function createDeck(
  name: string,
  opts?: {
    format?: string;
    targetBracket?: number;
    budget?: number | null;
    commanderId?: string | null;
    commanderName?: string | null;
    partnerId?: string | null;
    isAIGenerated?: boolean;
  }
): Promise<ApiDeck> {
  const res = await fetch("/api/decks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ...opts }),
  });
  if (!res.ok) await handleApiError(res, "createDeck");
  return res.json();
}

export async function updateDeck(
  id: string,
  patch: Partial<{
    name: string;
    format: string;
    targetBracket: number;
    manualBracket: number | null;
    budget: number | null;
    commanderId: string | null;
    commanderName: string | null;
    partnerId: string | null;
    companionId?: string | null;
    pairingType: CommanderPairingType;
    description: string;
    tags: string[];
    isAIGenerated?: boolean;
    isPublic?: boolean;
    seekingFeedback?: boolean;
    feedbackQuestion?: string | null;
  }>
): Promise<ApiDeck> {
  if (isGuestDeckId(id)) return getGuestApiDeck();
  const res = await fetch(`/api/decks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) await handleApiError(res, "updateDeck");
  return res.json();
}

export async function deleteDeck(id: string): Promise<void> {
  if (isGuestDeckId(id)) return;
  const res = await fetch(`/api/decks/${id}`, { method: "DELETE" });
  if (!res.ok) await handleApiError(res, "deleteDeck");
}

export async function duplicateDeck(id: string): Promise<ApiDeck> {
  const res = await fetch(`/api/decks/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) await handleApiError(res, "duplicateDeck");
  return res.json();
}

export async function forkPublicDeck(id: string): Promise<ApiDeck> {
  const res = await fetch(`/api/decks/${id}/fork`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) await handleApiError(res, "forkPublicDeck");
  return res.json();
}

// ─── Card CRUD ────────────────────────────────────────────────────────────────

export interface AddCardPayload {
  scryfallId: string;
  name: string;
  manaCost?: string;
  cmc?: number;
  typeLine?: string;
  oracleText?: string;
  power?: string | null;
  toughness?: string | null;
  colorIdentity?: string[];
  isGameChanger?: boolean;
  isBanned?: boolean;
  price?: number | null;
  imageUri?: string;
  artCropUri?: string;
  category?: string;
  quantity?: number;
  isCommander?: boolean;
  isPartner?: boolean;
  zone?: "main" | "sideboard" | "maybeboard"; // Target zone (defaults to "main")
}

/**
 * The row the guest deck keeps for a card the server would have inserted.
 *
 * @param deckId - the guest deck id
 * @param id - the row id to give it
 * @param payload - the card as sent to the add-card route
 * @returns the row, with the defaults the database would apply
 */
function guestRowFromPayload(deckId: string, id: string, payload: AddCardPayload): ApiDeckCard {
  return {
    id,
    deckId,
    scryfallId: payload.scryfallId,
    name: payload.name,
    manaCost: payload.manaCost ?? "",
    cmc: payload.cmc ?? 0,
    typeLine: payload.typeLine ?? "",
    oracleText: payload.oracleText ?? "",
    power: payload.power,
    toughness: payload.toughness,
    colorIdentity: payload.colorIdentity ?? [],
    isGameChanger: payload.isGameChanger ?? false,
    isBanned: payload.isBanned ?? false,
    price: payload.price ?? null,
    imageUri: payload.imageUri ?? "",
    artCropUri: payload.artCropUri ?? "",
    category: normalizeCardCategory(payload.category),
    quantity: payload.quantity ?? 1,
    notes: null,
    isCommander: payload.isCommander ?? false,
    isPartner: payload.isPartner ?? false,
    zone: payload.zone ?? "main",
  };
}

export async function addCard(
  deckId: string,
  payload: AddCardPayload
): Promise<ApiDeckCard> {
  if (isGuestDeckId(deckId)) return guestRowFromPayload(deckId, payload.scryfallId, payload);
  const res = await fetch(`/api/decks/${deckId}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await handleApiError(res, "addCard");
  return res.json();
}

export async function removeCard(
  deckId: string,
  cardId: string
): Promise<void> {
  if (isGuestDeckId(deckId)) return;
  const res = await fetch(`/api/decks/${deckId}/cards/${cardId}`, {
    method: "DELETE",
  });
  if (!res.ok) await handleApiError(res, "removeCard");
}

export async function updateCardCategory(
  deckId: string,
  cardId: string,
  category: CardCategory
): Promise<ApiDeckCard> {
  if (isGuestDeckId(deckId)) return getGuestApiCard(cardId);
  const res = await fetch(`/api/decks/${deckId}/cards/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
  });
  if (!res.ok) await handleApiError(res, "updateCardCategory");
  return res.json();
}

export async function updateCardNotes(
  deckId: string,
  cardId: string,
  notes: string | null
): Promise<ApiDeckCard> {
  if (isGuestDeckId(deckId)) return getGuestApiCard(cardId);
  const res = await fetch(`/api/decks/${deckId}/cards/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) await handleApiError(res, "updateCardNotes");
  return res.json();
}

export async function updateCardZone(
  deckId: string,
  cardId: string,
  zone: "main" | "sideboard" | "maybeboard"
): Promise<ApiDeckCard> {
  if (isGuestDeckId(deckId)) return getGuestApiCard(cardId);
  const res = await fetch(`/api/decks/${deckId}/cards/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zone }),
  });
  if (!res.ok) await handleApiError(res, "updateCardZone");
  return res.json();
}

export async function updateCardMaybeboard(
  deckId: string,
  cardId: string,
  isMaybeboard: boolean
): Promise<ApiDeckCard> {
  return updateCardZone(deckId, cardId, isMaybeboard ? "maybeboard" : "main");
}

/** Row changes the server applies to a deck in one transaction. */
export interface DeckCardChanges {
  readonly removeCardIds: readonly string[];
  readonly quantityChanges: readonly { readonly cardId: string; readonly quantity: number }[];
  readonly addCards: readonly AddCardPayload[];
  /** Command-zone slots whose rows are removed, whichever rows hold them. */
  readonly clearCommandSlots?: readonly CommandSlot[];
  /** The deck's command-zone fields, sent only when the edit changes them. */
  readonly commandZone?: CommandZonePatch;
}

/**
 * Applies a change set to the guest deck the way the server applies it to rows.
 *
 * New rows get ids from their printing, role and zone: the guest deck has no
 * database to hand them out, and one printing can sit in two zones.
 *
 * @param deckId - the guest deck id
 * @param changes - rows to remove, resize and add
 * @returns the guest deck with the changes applied
 */
function applyGuestCardChanges(deckId: string, changes: DeckCardChanges): ApiDeck {
  const deck = getGuestApiDeck();
  const removed = new Set(changes.removeCardIds);
  const clearedRoles = (changes.clearCommandSlots ?? []).map((slot) => COMMAND_SLOT_ROWS[slot]);
  const quantities = new Map(changes.quantityChanges.map((change) => [change.cardId, change.quantity]));
  const kept = deck.cards
    .filter((card) => !removed.has(card.id))
    .filter((card) => !clearedRoles.some((role) => holdsRole(card, role)))
    .map((card) => ({ ...card, quantity: quantities.get(card.id) ?? card.quantity }));
  const added = changes.addCards.map((payload) =>
    guestRowFromPayload(deckId, guestRowId(payload), payload)
  );
  return { ...deck, ...changes.commandZone, cards: [...kept, ...added] };
}

/**
 * Whether a row carries every flag of a command-zone role.
 *
 * @param card - a guest deck row
 * @param role - the flags that mark the slot
 * @returns true when the row fills that slot
 */
function holdsRole(card: ApiDeckCard, role: (typeof COMMAND_SLOT_ROWS)[CommandSlot]): boolean {
  return (
    (role.isCommander === undefined || role.isCommander === card.isCommander) &&
    (role.isPartner === undefined || role.isPartner === card.isPartner) &&
    (role.category === undefined || role.category === card.category)
  );
}

/**
 * A guest row id that two rows of one change set cannot share.
 *
 * @param payload - the card being added
 * @returns its printing, its role in the deck and its zone
 */
function guestRowId(payload: AddCardPayload): string {
  let role = "card";
  if (payload.isCommander) role = payload.isPartner ? "partner" : "commander";
  else if (payload.category === "companion") role = "companion";
  return `${payload.scryfallId}:${role}:${payload.zone ?? "main"}`;
}

/**
 * Applies a set of row changes to a deck atomically: either every change is
 * saved or none is.
 *
 * @param deckId - deck to change
 * @param changes - rows to remove, resize and add, and the command zone
 * @returns the deck with all its cards, as saved
 * @throws When the server refused the change set; the deck is then unchanged
 */
export async function applyCardChanges(
  deckId: string,
  changes: DeckCardChanges
): Promise<ApiDeck> {
  if (isGuestDeckId(deckId)) return applyGuestCardChanges(deckId, changes);
  const res = await fetch(`/api/decks/${deckId}/cards`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!res.ok) await handleApiError(res, "applyCardChanges");
  return res.json();
}

export async function removeAllCards(deckId: string): Promise<void> {
  if (isGuestDeckId(deckId)) return;
  const res = await fetch(`/api/decks/${deckId}/cards`, {
    method: "DELETE",
  });
  if (!res.ok) await handleApiError(res, "removeAllCards");
}

function normalizeCardCategory(category: string | undefined): CardCategory {
  const categories: readonly CardCategory[] = [
    "commander",
    "companion",
    "creature",
    "instant",
    "sorcery",
    "artifact",
    "enchantment",
    "planeswalker",
    "land",
    "ramp",
    "draw",
    "removal",
    "boardWipe",
    "winCondition",
    "protection",
    "other",
  ];
  return categories.find((candidate) => candidate === category) ?? "other";
}

// ─── Scryfall Cache ───────────────────────────────────────────────────────────
// Read-only from the browser: the server fills the shared cache on a miss, from
// Scryfall answers it fetched itself, and accepts no writes from clients.

/** The body's `data`, whether the server served it from the cache or just fetched it. */
async function readCacheData(res: Response): Promise<unknown> {
  if (!res.ok) return null;
  const body: unknown = await res.json();
  return typeof body === "object" && body !== null && "data" in body
    ? body.data
    : null;
}

/**
 * Reads a card through the shared cache.
 * @param scryfallId - Scryfall card id
 * @returns the card body, or null when the server could not provide one
 */
export async function lookupCardCache(scryfallId: string): Promise<unknown> {
  try {
    const res = await fetch(
      `/api/cache/cards?id=${encodeURIComponent(scryfallId)}`
    );
    return await readCacheData(res);
  } catch {
    return null;
  }
}

/**
 * Reads a search page through the shared cache (the key is hashed server-side).
 * @param query - Scryfall query
 * @param page - 1-based page
 * @param multilingual - whether Scryfall must include non-English printings
 * @returns the page body, or null when the server could not provide one
 */
export async function lookupSearchCache(
  query: string,
  page: number,
  multilingual = false
): Promise<unknown> {
  try {
    const params = new URLSearchParams({ query, page: String(page) });
    if (multilingual) params.set("multilingual", "1");
    const res = await fetch(`/api/cache/search?${params}`);
    return await readCacheData(res);
  } catch {
    return null;
  }
}
