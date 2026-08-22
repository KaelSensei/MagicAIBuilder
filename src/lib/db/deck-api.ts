// HTTP client for the deck API routes
import type { Deck, DeckCard, DeckZone, CardCategory, CommanderPairingType } from "@/lib/deck/types";
import { logger } from "@/lib/logger";
import { MAX_SEARCH_CACHE_BYTES } from "@/lib/cache-limits";

/** Shape returned by the API (dates as ISO strings) */
export interface ApiDeck extends Omit<Deck, "createdAt" | "updatedAt" | "commander" | "partner" | "cards" | "manualBracket" | "cardCount"> {
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

export async function fetchDecks(page = 0, limit = 20): Promise<ApiDeckListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`/api/decks?${params}`);
  if (!res.ok) await handleApiError(res, "fetchDecks");
  return res.json();
}

export async function fetchDeck(id: string): Promise<ApiDeck> {
  const res = await fetch(`/api/decks/${id}`);
  if (!res.ok) await handleApiError(res, "fetchDeck");
  return res.json();
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
  }>
): Promise<ApiDeck> {
  const res = await fetch(`/api/decks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) await handleApiError(res, "updateDeck");
  return res.json();
}

export async function deleteDeck(id: string): Promise<void> {
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

export async function addCard(
  deckId: string,
  payload: AddCardPayload
): Promise<ApiDeckCard> {
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
  const res = await fetch(`/api/decks/${deckId}/cards/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isMaybeboard }),
  });
  if (!res.ok) await handleApiError(res, "updateCardMaybeboard");
  return res.json();
}

export async function removeAllCards(deckId: string): Promise<void> {
  const res = await fetch(`/api/decks/${deckId}/cards`, {
    method: "DELETE",
  });
  if (!res.ok) await handleApiError(res, "removeAllCards");
}

// ─── Scryfall Cache ───────────────────────────────────────────────────────────

export async function lookupCardCache(
  scryfallId: string
): Promise<unknown> {
  try {
    const res = await fetch(`/api/cache/cards?id=${encodeURIComponent(scryfallId)}`);
    if (!res.ok) return null;
    const body = await res.json();
    return body.hit ? body.data : null;
  } catch {
    return null;
  }
}

export async function storeCardCache(
  scryfallId: string,
  data: unknown
): Promise<void> {
  try {
    await fetch("/api/cache/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scryfallId, data }),
    });
  } catch (err) {
    logger.warn("Failed to cache card", "storeCardCache", err);
  }
}

// ─── Scryfall Search Cache ────────────────────────────────────────────────────

/** Look up a cached search result by query + page (hash computation happens server-side) */
export async function lookupSearchCache(
  query: string,
  page: number
): Promise<unknown> {
  try {
    const params = new URLSearchParams({ query, page: String(page) });
    const res = await fetch(`/api/cache/search?${params}`);
    if (!res.ok) return null;
    const body = await res.json();
    return body.hit ? body.data : null;
  } catch {
    return null;
  }
}

/** Store a search result in the cache (hash computation happens server-side) */
export async function storeSearchCache(
  query: string,
  page: number,
  data: unknown
): Promise<void> {
  try {
    const body = JSON.stringify({ query, page, data });
    // The server rejects oversized cache writes with 413 — skip them entirely
    if (body.length > MAX_SEARCH_CACHE_BYTES) return;
    await fetch("/api/cache/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (err) {
    logger.warn("Failed to cache search result", "storeSearchCache", err);
  }
}
