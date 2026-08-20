// Scryfall API client with rate limiting (max 10 req/s = 100ms between requests)
// Cards are cached in the DB via /api/cache/cards (TTL: 24h)
// Search results are cached in the DB via /api/cache/search (TTL: 1h)
import type {
  ScryfallCard,
  ScryfallSearchResponse,
  ScryfallAutocompleteResponse,
  ScryfallCollectionIdentifier,
  ScryfallCollectionResponse,
} from "./types";
import {
  lookupCardCache,
  storeCardCache,
  lookupSearchCache,
  storeSearchCache,
} from "@/lib/db/deck-api";
import { buildLocalizedNamesQueries } from "./localized";

const SCRYFALL_BASE = "https://api.scryfall.com";
const MIN_DELAY_MS = 100;

const defaultHeaders = {
  "User-Agent": "MagicAIBuilder/1.0",
  Accept: "application/json",
};

// Detect if we're in a test environment (vitest sets globalThis.vi)
function isTestMode(): boolean {
  return typeof globalThis !== "undefined" && "vi" in globalThis;
}

// Serialized rate-limiting with async mutex (prevents concurrent request race)
// In test mode (vi.useFakeTimers), bypass delay to avoid timeout issues
let lastRequestTime = 0;
let queue: Promise<Response | undefined> = Promise.resolve(undefined);

/**
 * Reset the rate limiter state (for tests only)
 * @internal
 */
export function __resetRateLimiter() {
  lastRequestTime = 0;
  queue = Promise.resolve(undefined);
}

function rateLimitedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return queue
    .then(async () => {
      const now = Date.now();
      const elapsed = now - lastRequestTime;
      // Only apply delay in non-test environments (skip in test mode to avoid setTimeout issues)
      if (elapsed < MIN_DELAY_MS && !isTestMode()) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, MIN_DELAY_MS - elapsed)
        );
      }
      lastRequestTime = Date.now();

      return fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options?.headers,
        },
      });
    })
    .then(
      (res) => {
        queue = Promise.resolve(undefined);
        return res;
      },
      (err) => {
        // Reset queue even on error so future requests can still proceed
        queue = Promise.resolve(undefined);
        throw err;
      }
    );
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

/** Empty search response — Scryfall answers 404 when a valid query matches nothing */
const EMPTY_SEARCH_RESPONSE: ScryfallSearchResponse = {
  object: "list",
  total_cards: 0,
  has_more: false,
  data: [],
};

/**
 * Search cards using Scryfall query syntax — results cached 1h.
 *
 * `includeMultilingual` must be set whenever the query carries a `lang:`
 * filter: Scryfall hides non-English cards from search without it, so the
 * filter alone returns nothing at all. The DB cache stays correct because the
 * flag is implied by the query text it always travels with.
 */
export async function searchCards(
  query: string,
  page = 1,
  includeMultilingual = false
): Promise<ScryfallSearchResponse> {
  // Check cache first
  try {
    const cached = await lookupSearchCache(query, page);
    if (cached) {
      return cached as ScryfallSearchResponse;
    }
  } catch {
    // Cache lookup failure is non-fatal — fall through to Scryfall
  }

  const params = new URLSearchParams({
    q: query,
    page: String(page),
    order: "edhrec",
  });
  if (includeMultilingual) params.set("include_multilingual", "true");
  const response = await rateLimitedFetch(
    `${SCRYFALL_BASE}/cards/search?${params}`
  );

  // Scryfall returns 404 for a valid query with zero matches — treat as empty, not an error
  if (response.status === 404) {
    return EMPTY_SEARCH_RESPONSE;
  }

  const data = await handleResponse<ScryfallSearchResponse>(response);

  // Store in DB cache (fire-and-forget)
  storeSearchCache(query, page, data).catch(() => {
    /* non-fatal */
  });

  return data;
}

/** Look up a single card by exact name */
export async function getCardByName(name: string): Promise<ScryfallCard> {
  const params = new URLSearchParams({ exact: name });
  const response = await rateLimitedFetch(
    `${SCRYFALL_BASE}/cards/named?${params}`
  );
  const card = await handleResponse<ScryfallCard>(response);
  // Cache the card by its ID for future lookups
  storeCardCache(card.id, card).catch(() => {
    /* non-fatal */
  });
  return card;
}

/** Fuzzy card name lookup */
export async function getCardByNameFuzzy(name: string): Promise<ScryfallCard> {
  const params = new URLSearchParams({ fuzzy: name });
  const response = await rateLimitedFetch(
    `${SCRYFALL_BASE}/cards/named?${params}`
  );
  const card = await handleResponse<ScryfallCard>(response);
  // Cache the card by its ID for future lookups
  storeCardCache(card.id, card).catch(() => {
    /* non-fatal */
  });
  return card;
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

/** Fetch all pages of a Scryfall search query */
export async function fetchAllPages(
  query: string,
  includeMultilingual = false
): Promise<ScryfallCard[]> {
  const allCards: ScryfallCard[] = [];
  let page = 1;
  const PAGE_SAFETY_CAP = 20;

  let hasMore = true;
  while (hasMore && page <= PAGE_SAFETY_CAP) {
    const response = await searchCards(query, page, includeMultilingual);
    allCards.push(...response.data);
    hasMore = response.has_more ?? false;
    page++;
  }

  return allCards;
}

/**
 * Fetch one printing per card, in `lang`, for a list of English names.
 *
 * Chunks run sequentially through the rate limiter; a chunk that fails is
 * skipped rather than failing the whole batch — a deck with one untranslated
 * chunk is still better read than a deck shown wholly in English. Each chunk
 * fits in a single page (20 names < 175 per page), so only page 1 is read.
 *
 * @param names - English card names, duplicates allowed
 * @param lang - Scryfall language code; "en" returns an empty list without a request
 */
export async function fetchLocalizedPrintingsByNames(
  names: readonly string[],
  lang: string
): Promise<ScryfallCard[]> {
  const cards: ScryfallCard[] = [];
  for (const query of buildLocalizedNamesQueries(names, lang)) {
    try {
      const response = await searchCards(query, 1, true);
      cards.push(...response.data);
    } catch {
      // Leave this chunk English.
    }
  }
  return cards;
}

/** Get all Game Changers (cached 24h via TanStack Query) */
export async function getGameChangers(): Promise<ScryfallSearchResponse> {
  return searchCards("is:gamechanger");
}

/** Get commander banlist */
export async function getCommanderBanlist(): Promise<ScryfallSearchResponse> {
  return searchCards("banned:commander");
}

/**
 * Fetch all printings of a card by exact name (unique=prints).
 *
 * Passing a non-English `lang` asks Scryfall for that language's printings.
 * Scryfall hides non-English cards from search unless `include_multilingual` is
 * set, so the flag and the filter travel together — sending `lang:fr` alone
 * returns nothing at all, which reads as "no French printing exists" rather
 * than as the mistake it is.
 *
 * @param cardName - exact English card name
 * @param lang - Scryfall language code; omit or pass "en" for English printings
 * @returns the printings, newest first
 */
export async function searchCardPrintings(
  cardName: string,
  lang?: string
): Promise<ScryfallSearchResponse> {
  const wantsTranslation = lang !== undefined && lang !== "en";
  const langFilter = wantsTranslation ? ` lang:${lang}` : "";
  const params = new URLSearchParams({
    // Do NOT filter by legality here: banned cards still have many printings/arts (e.g. Black Lotus).
    q: `!"${cardName}" game:paper${langFilter}`,
    unique: "prints",
    order: "released",
    dir: "desc",
  });
  if (wantsTranslation) params.set("include_multilingual", "true");

  const response = await rateLimitedFetch(`${SCRYFALL_BASE}/cards/search?${params}`);
  return handleResponse<ScryfallSearchResponse>(response);
}
