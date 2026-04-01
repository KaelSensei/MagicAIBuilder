// Scryfall API client with rate limiting (max 10 req/s = 100ms between requests)
// Cards are cached in the DB via /api/cache/cards (TTL: 24h)
import type {
  ScryfallCard,
  ScryfallSearchResponse,
  ScryfallAutocompleteResponse,
  ScryfallCollectionIdentifier,
  ScryfallCollectionResponse,
} from "./types";
import { lookupCardCache, storeCardCache } from "@/lib/db/deck-api";

const SCRYFALL_BASE = "https://api.scryfall.com";
const MIN_DELAY_MS = 100;

const defaultHeaders = {
  "User-Agent": "MagicAIBuilder/1.0",
  Accept: "application/json",
};

// Simple rate-limiting queue
let lastRequestTime = 0;

async function rateLimitedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_DELAY_MS - elapsed)
    );
  }
  lastRequestTime = Date.now();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  });

  return response;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      details: response.statusText,
    }));
    throw new Error(
      `Scryfall API error ${response.status}: ${error.details ?? response.statusText}`
    );
  }
  return response.json() as Promise<T>;
}

/** Search cards using Scryfall query syntax */
export async function searchCards(
  query: string,
  page = 1
): Promise<ScryfallSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    order: "edhrec",
  });
  const response = await rateLimitedFetch(
    `${SCRYFALL_BASE}/cards/search?${params}`
  );
  return handleResponse<ScryfallSearchResponse>(response);
}

/** Look up a single card by exact name */
export async function getCardByName(name: string): Promise<ScryfallCard> {
  const params = new URLSearchParams({ exact: name });
  const response = await rateLimitedFetch(
    `${SCRYFALL_BASE}/cards/named?${params}`
  );
  return handleResponse<ScryfallCard>(response);
}

/** Fuzzy card name lookup */
export async function getCardByNameFuzzy(name: string): Promise<ScryfallCard> {
  const params = new URLSearchParams({ fuzzy: name });
  const response = await rateLimitedFetch(
    `${SCRYFALL_BASE}/cards/named?${params}`
  );
  return handleResponse<ScryfallCard>(response);
}

/** Get a single card by Scryfall ID — with DB cache (TTL 24h) */
export async function getCardById(id: string): Promise<ScryfallCard> {
  // Check DB cache first (only available in browser / server-rendered contexts)
  try {
    const cached = await lookupCardCache(id);
    if (cached) {
      return cached as ScryfallCard;
    }
  } catch {
    // Cache lookup failure is non-fatal — fall through to Scryfall
  }

  const response = await rateLimitedFetch(`${SCRYFALL_BASE}/cards/${id}`);
  const card = await handleResponse<ScryfallCard>(response);

  // Store in DB cache (fire-and-forget)
  storeCardCache(id, card).catch(() => {
    /* non-fatal */
  });

  return card;
}

/** Autocomplete partial card name */
export async function autocompleteCardName(
  partial: string
): Promise<string[]> {
  const params = new URLSearchParams({ q: partial });
  const response = await rateLimitedFetch(
    `${SCRYFALL_BASE}/cards/autocomplete?${params}`
  );
  const data =
    await handleResponse<ScryfallAutocompleteResponse>(response);
  return data.data;
}

/** Batch lookup up to 75 cards by identifier */
export async function getCardCollection(
  identifiers: ScryfallCollectionIdentifier[]
): Promise<ScryfallCollectionResponse> {
  const response = await rateLimitedFetch(
    `${SCRYFALL_BASE}/cards/collection`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers }),
    }
  );
  return handleResponse<ScryfallCollectionResponse>(response);
}

/** Get all Game Changers (cached 24h via TanStack Query) */
export async function getGameChangers(): Promise<ScryfallSearchResponse> {
  return searchCards("is:gamechanger");
}

/** Get commander banlist */
export async function getCommanderBanlist(): Promise<ScryfallSearchResponse> {
  return searchCards("banned:commander");
}

/** Fetch all printings of a card by exact name (unique=prints) */
export async function searchCardPrintings(cardName: string): Promise<ScryfallSearchResponse> {
  const params = new URLSearchParams({
    // Do NOT filter by legality here: banned cards still have many printings/arts (e.g. Black Lotus).
    q: `!"${cardName}" game:paper`,
    unique: "prints",
    order: "released",
    dir: "desc",
  });
  const response = await rateLimitedFetch(`${SCRYFALL_BASE}/cards/search?${params}`);
  return handleResponse<ScryfallSearchResponse>(response);
}
