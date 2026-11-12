// HTTP client for the deck API routes
import type {
  Deck,
  DeckCard,
  DeckZone,
  CardCategory,
  CommanderPairingType,
} from "@/lib/deck/types";
import {
  rowFillsCommandSlot,
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
  | "targetBracket"
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
  /** Raw DB value — read as an official bracket (1–5) in the store */
  targetBracket: number;
  /** Raw DB value — read as an official bracket (1–5) or null in the store */
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

/** A whole deck, command zone and cards included, for `POST /api/decks`. */
export interface CreateDeckWithCardsBody {
  readonly name: string;
  readonly format: string;
  readonly targetBracket: number;
  readonly manualBracket: number | null;
  readonly budget: number | null;
  readonly description: string;
  readonly tags: readonly string[];
  readonly commanderId: string | null;
  readonly commanderName: string | null;
  readonly partnerId: string | null;
  readonly companionId: string | null;
  readonly pairingType: CommanderPairingType;
  readonly cards: readonly AddCardPayload[];
}

/**
 * Creates a deck with all of its cards in one request.
 *
 * The server keeps the key with the deck: repeating the request with the same
 * key returns that deck instead of writing a second one, so a double click or a
 * retry after a lost response is safe.
 *
 * @param body - the deck and its cards
 * @param idempotencyKey - the same value for every attempt at the same deck
 * @returns the created deck, or the one an earlier attempt created
 */
export async function createDeckWithCards(
  body: CreateDeckWithCardsBody,
  idempotencyKey: string
): Promise<ApiDeck> {
  const res = await fetch("/api/decks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) await handleApiError(res, "createDeckWithCards");
  return res.json();
}

/**
 * The deck fields `PATCH /api/decks/[id]` writes: metadata only. The command
 * zone is not among them; `changeCommandZone` is its one write path.
 */
export type DeckMetadataPatch = Partial<{
  name: string;
  format: string;
  targetBracket: number;
  manualBracket: number | null;
  budget: number | null;
  description: string;
  tags: string[];
  isAIGenerated?: boolean;
  isPublic?: boolean;
  seekingFeedback?: boolean;
  feedbackQuestion?: string | null;
}>;

/**
 * Writes a deck's metadata through `PATCH /api/decks/[id]`.
 *
 * @param id - The deck; a guest deck answers locally and writes nothing.
 * @param patch - The fields to write; an absent key keeps the stored value.
 * @returns The deck as stored after the write.
 * @throws Error when the server refuses or fails the write (`handleApiError`).
 */
export async function updateDeck(
  id: string,
  patch: DeckMetadataPatch
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
  const clearedSlots = changes.clearCommandSlots ?? [];
  const quantities = new Map(changes.quantityChanges.map((change) => [change.cardId, change.quantity]));
  const kept = deck.cards
    .filter((card) => !removed.has(card.id))
    .filter(
      (card) => !clearedSlots.some((slot) => rowFillsCommandSlot(card, slot))
    )
    .map((card) => ({ ...card, quantity: quantities.get(card.id) ?? card.quantity }));
  const added = changes.addCards.map((payload) =>
    guestRowFromPayload(deckId, guestRowId(payload), payload)
  );
  return { ...deck, ...changes.commandZone, cards: [...kept, ...added] };
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

/**
 * One change of the command zone, which the server stores in one transaction
 * (`PATCH /api/decks/[id]/command-zone`): the rows that leave, the rows that
 * enter and the deck fields that record the result.
 */
export interface CommandZoneChangeRequest {
  /** Main-deck rows that leave with the change, such as a promoted card's row. */
  readonly removeCardIds: readonly string[];
  /** Slots whose rows are removed, whichever rows hold them. */
  readonly clearCommandSlots: readonly CommandSlot[];
  /** The rows that fill the changed slots. */
  readonly addCards: readonly AddCardPayload[];
  /** The deck fields to write; an absent key keeps the stored value. */
  readonly commandZone: Partial<CommandZonePatch>;
  /** The deck version the client last read; absent means "do not check". */
  readonly expectedVersion?: number;
}

/** What a saved command-zone change answers: the rows it added, in the order sent, and the deck's new version. */
export interface CommandZoneSaved {
  readonly cards: ApiDeckCard[];
  readonly version: number;
}

/**
 * Changes the command zone atomically: either every row and field of the
 * change is saved or none is. The guest deck keeps no version, so its answer
 * carries version 0 and rows whose id is their printing id, as `addCard` does.
 *
 * @param deckId - deck to change
 * @param change - rows to remove and add, and the deck fields to write
 * @returns the added rows and the deck's new version
 * @throws When the server refused the change (400, 409 for a stale copy, 500); the deck is then unchanged
 */
export async function changeCommandZone(
  deckId: string,
  change: CommandZoneChangeRequest
): Promise<CommandZoneSaved> {
  if (isGuestDeckId(deckId)) {
    return {
      cards: change.addCards.map((payload) =>
        guestRowFromPayload(deckId, payload.scryfallId, payload)
      ),
      version: 0,
    };
  }
  const res = await fetch(`/api/decks/${deckId}/command-zone`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(change),
  });
  if (!res.ok) await handleApiError(res, "changeCommandZone");
  return res.json();
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
