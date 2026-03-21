// HTTP client for the deck API routes
import type { Deck, DeckCard, CardCategory, CommanderPairingType } from "@/lib/deck/types";

/** Shape returned by the API (dates as ISO strings) */
export interface ApiDeck extends Omit<Deck, "createdAt" | "updatedAt" | "commander" | "partner" | "cards"> {
  createdAt: string;
  updatedAt: string;
  commanderId: string | null;
  partnerId: string | null;
  pairingType: CommanderPairingType;
  cards: ApiDeckCard[];
}

export interface ApiDeckCard extends Omit<DeckCard, "id"> {
  id: string; // DB-generated CUID (not scryfall id)
  deckId: string;
  scryfallId: string;
  isCommander: boolean;
  isPartner: boolean;
}

function handleApiError(res: Response, context: string): never {
  throw new Error(`[${context}] HTTP ${res.status}: ${res.statusText}`);
}

// ─── Deck CRUD ────────────────────────────────────────────────────────────────

export async function fetchDecks(): Promise<ApiDeck[]> {
  const res = await fetch("/api/decks");
  if (!res.ok) handleApiError(res, "fetchDecks");
  return res.json();
}

export async function createDeck(
  name: string,
  opts?: {
    format?: string;
    targetBracket?: number;
    budget?: number | null;
    commanderId?: string | null;
    partnerId?: string | null;
  }
): Promise<ApiDeck> {
  const res = await fetch("/api/decks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ...opts }),
  });
  if (!res.ok) handleApiError(res, "createDeck");
  return res.json();
}

export async function updateDeck(
  id: string,
  patch: Partial<{
    name: string;
    format: string;
    targetBracket: number;
    budget: number | null;
    commanderId: string | null;
    partnerId: string | null;
    pairingType: CommanderPairingType;
  }>
): Promise<ApiDeck> {
  const res = await fetch(`/api/decks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) handleApiError(res, "updateDeck");
  return res.json();
}

export async function deleteDeck(id: string): Promise<void> {
  const res = await fetch(`/api/decks/${id}`, { method: "DELETE" });
  if (!res.ok) handleApiError(res, "deleteDeck");
}

// ─── Card CRUD ────────────────────────────────────────────────────────────────

export interface AddCardPayload {
  scryfallId: string;
  name: string;
  manaCost?: string;
  cmc?: number;
  typeLine?: string;
  oracleText?: string;
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
  if (!res.ok) handleApiError(res, "addCard");
  return res.json();
}

export async function removeCard(
  deckId: string,
  cardId: string
): Promise<void> {
  const res = await fetch(`/api/decks/${deckId}/cards/${cardId}`, {
    method: "DELETE",
  });
  if (!res.ok) handleApiError(res, "removeCard");
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
  if (!res.ok) handleApiError(res, "updateCardCategory");
  return res.json();
}

export async function removeAllCards(deckId: string): Promise<void> {
  const res = await fetch(`/api/decks/${deckId}/cards`, {
    method: "DELETE",
  });
  if (!res.ok) handleApiError(res, "removeAllCards");
}

// ─── Scryfall Cache ───────────────────────────────────────────────────────────

export async function lookupCardCache(
  scryfallId: string
): Promise<unknown | null> {
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
    console.warn("[storeCardCache] Failed to cache card:", err);
  }
}
