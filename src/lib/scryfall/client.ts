// Scryfall API client with rate limiting (max 10 req/s = 100ms between requests)
// Cards by id and search pages are read through the shared server cache
// (/api/cache/cards, 24h; /api/cache/search, 1h). Only the server writes it, from
// Scryfall answers it fetched itself; this client never writes it back.
import { forEachSequential } from "@/lib/async/sequential";
import {
  EMPTY_SEARCH_RESPONSE,
  type ScryfallCard,
  type ScryfallSearchResponse,
  type ScryfallAutocompleteResponse,
  type ScryfallCollectionIdentifier,
  type ScryfallCollectionResponse,
} from "./types";
import { lookupCardCache, lookupSearchCache } from "@/lib/db/deck-api";
import { isScryfallCard, isScryfallSearchResponse } from "./guards";
import { resetScryfallQueue, scheduleScryfallRequest } from "./request-queue";
import { buildLocalizedNamesQueries } from "./localized";
import { logger } from "@/lib/logger";

const SCRYFALL_BASE = "https://api.scryfall.com";

const defaultHeaders = {
  "User-Agent": "MagicAIBuilder/1.0",
  Accept: "application/json",
};

/**
 * Reset the rate limiter state (for tests only)
 * @internal
 */
export function __resetRateLimiter() {
  resetScryfallQueue();
}

function rateLimitedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return scheduleScryfallRequest(() =>
    fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    })
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

/**
 * Search cards using Scryfall query syntax — results cached 1h.
 *
 * `includeMultilingual` must be set whenever the query carries a `lang:`
 * filter: Scryfall hides non-English cards from search without it, so the
 * filter alone returns nothing at all. The flag is part of the cache key.
 *
 * The page is read through the shared cache, which the server fills from
 * Scryfall on a miss. Only when the server cannot answer does the browser ask
 * Scryfall itself, and it never stores that answer.
 */
export async function searchCards(
  query: string,
  page = 1,
  includeMultilingual = false
): Promise<ScryfallSearchResponse> {
  try {
    const cached = await lookupSearchCache(query, page, includeMultilingual);
    if (isScryfallSearchResponse(cached)) {
      return cached;
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
  const startedAt = performance.now();
  let status: number | null = null;
  try {
    const response = await rateLimitedFetch(
      `${SCRYFALL_BASE}/cards/search?${params}`
    );
    status = response.status;

    // Scryfall returns 404 for a valid query with zero matches — treat as empty, not an error
    if (status === 404) {
      return EMPTY_SEARCH_RESPONSE;
    }

    return await handleResponse<ScryfallSearchResponse>(response);
  } finally {
    logger.info("Scryfall search completed", "Scryfall search", {
      status,
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
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

/**
 * Get a single card by Scryfall ID — read through the shared cache (TTL 24h),
 * which the server fills from Scryfall on a miss. Only when the server cannot
 * answer does the browser ask Scryfall itself, and it never stores that answer.
 */
export async function getCardById(id: string): Promise<ScryfallCard> {
  try {
    const cached = await lookupCardCache(id);
    if (isScryfallCard(cached)) {
      return cached;
    }
  } catch {
    // Cache lookup failure is non-fatal — fall through to Scryfall
  }

  const startedAt = performance.now();
  let status: number | null = null;
  try {
    const response = await rateLimitedFetch(`${SCRYFALL_BASE}/cards/${id}`);
    status = response.status;
    return await handleResponse<ScryfallCard>(response);
  } finally {
    logger.info("Scryfall card lookup completed", "Scryfall card lookup", {
      status,
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
}

/** Autocomplete partial card name */
export async function autocompleteCardName(partial: string): Promise<string[]> {
  const params = new URLSearchParams({ q: partial });
  const response = await rateLimitedFetch(
    `${SCRYFALL_BASE}/cards/autocomplete?${params}`
  );
  const data = await handleResponse<ScryfallAutocompleteResponse>(response);
  return data.data;
}

/** Batch lookup up to 75 cards by identifier */
export async function getCardCollection(
  identifiers: ScryfallCollectionIdentifier[]
): Promise<ScryfallCollectionResponse> {
  const response = await rateLimitedFetch(`${SCRYFALL_BASE}/cards/collection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifiers }),
  });
  return handleResponse<ScryfallCollectionResponse>(response);
}

/** Fetch all pages of a Scryfall search query */
export async function fetchAllPages(
  query: string,
  includeMultilingual = false
): Promise<ScryfallCard[]> {
  const allCards: ScryfallCard[] = [];
  const PAGE_SAFETY_CAP = 20;
  async function appendPage(page: number): Promise<void> {
    const response = await searchCards(query, page, includeMultilingual);
    allCards.push(...response.data);
    if (response.has_more && page < PAGE_SAFETY_CAP) {
      await appendPage(page + 1);
    }
  }
  await appendPage(1);
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
  await forEachSequential(
    buildLocalizedNamesQueries(names, lang),
    async (query) => {
      try {
        const response = await searchCards(query, 1, true);
        cards.push(...response.data);
      } catch {
        // Leave this chunk English.
      }
    }
  );
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

  const response = await rateLimitedFetch(
    `${SCRYFALL_BASE}/cards/search?${params}`
  );
  return handleResponse<ScryfallSearchResponse>(response);
}
