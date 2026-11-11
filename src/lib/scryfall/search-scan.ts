/**
 * Reads a Scryfall search page after page until enough wanted cards are found, the results end,
 * or the page budget is spent.
 *
 * Card catalog context. The "Collection only" search filters Scryfall's answer in the browser,
 * because Scryfall cannot know a player's collection. One page may hold few cards the player owns,
 * so the filter reads on, within a fixed budget and Scryfall's rate limit, and reports how much
 * of the search it covered. Caller: `hooks/useCardSearchResults.ts`.
 * Not responsible for: what counts as wanted (the caller's predicate), or caching pages
 * (`searchCards` reads through the shared cache first).
 *
 * @module scryfall/search-scan
 */
import { logger } from "@/lib/logger";
import type { ScryfallCard, ScryfallSearchResponse } from "./types";

/**
 * Cards in one Scryfall search page.
 * Source: https://scryfall.com/docs/api/cards/search (read 2026-11-11).
 */
export const SCRYFALL_SEARCH_PAGE_SIZE = 175;

/**
 * Least spacing between two page requests of one scan, in milliseconds. Scryfall allows
 * 2 requests per second on /cards/search, and a 429 answer blocks the caller for 30 seconds.
 * Source: https://scryfall.com/docs/api/rate-limits (read 2026-11-10).
 */
export const SEARCH_PAGE_INTERVAL_MS = 500;

/**
 * Most pages one scan reads: 700 cards, in four requests and 1.5 s of spacing at most.
 * Product choice: a search that matches more is reported as partly checked, and the player is
 * asked to narrow it, rather than paging through Scryfall for many seconds.
 */
export const MAX_SCANNED_PAGES = 4;

/** What a scan read. */
export interface SearchScan {
  /** Every card read, in Scryfall's order, wanted or not. */
  readonly cards: readonly ScryfallCard[];
  /** Cards matching the query in all of Scryfall, read or not. */
  readonly totalMatches: number;
  /** True when every matching card was read. */
  readonly complete: boolean;
}

/** How a scan reaches Scryfall and waits between pages. */
export interface SearchScanPorts {
  /** Reads one page of the search, numbered from 1. */
  readonly fetchPage: (page: number) => Promise<ScryfallSearchResponse>;
  /** Waits `ms` milliseconds; rejects when `signal` aborts. */
  readonly pause: (ms: number, signal?: AbortSignal) => Promise<void>;
}

/** When a scan stops. */
export interface SearchScanOptions {
  readonly isWanted: (card: ScryfallCard) => boolean;
  /** Stop once this many wanted cards were read. Default: one Scryfall page. */
  readonly wantedTarget?: number;
  /** Default: `MAX_SCANNED_PAGES`. */
  readonly maxPages?: number;
  /** Aborting it stops the scan before its next page. */
  readonly signal?: AbortSignal;
}

function countWanted(
  cards: readonly ScryfallCard[],
  isWanted: (card: ScryfallCard) => boolean
): number {
  let wanted = 0;
  for (const card of cards) if (isWanted(card)) wanted += 1;
  return wanted;
}

/**
 * Reads the search from page 1, one page at a time, `SEARCH_PAGE_INTERVAL_MS` apart.
 *
 * A failure on page 1 rejects, as a failed search would. A failure on a later page ends the scan
 * with what was read, reported as incomplete, so the cards already found are still shown.
 *
 * @throws the page-1 error, or an `AbortError` when `signal` aborts during a pause
 */
export async function scanSearch(
  ports: SearchScanPorts,
  options: SearchScanOptions
): Promise<SearchScan> {
  const {
    isWanted,
    wantedTarget = SCRYFALL_SEARCH_PAGE_SIZE,
    maxPages = MAX_SCANNED_PAGES,
    signal,
  } = options;

  const first = await ports.fetchPage(1);
  const cards: ScryfallCard[] = [...first.data];
  let wanted = countWanted(first.data, isWanted);
  let hasMore = first.has_more;
  let pagesRead = 1;

  while (hasMore && wanted < wantedTarget && pagesRead < maxPages) {
    await ports.pause(SEARCH_PAGE_INTERVAL_MS, signal);
    let next: ScryfallSearchResponse;
    try {
      next = await ports.fetchPage(pagesRead + 1);
    } catch (error) {
      logger.warn("Search scan stopped early", "scanSearch", error);
      break;
    }
    pagesRead += 1;
    cards.push(...next.data);
    wanted += countWanted(next.data, isWanted);
    hasMore = next.has_more;
  }

  return { cards, totalMatches: first.total_cards, complete: !hasMore };
}

/**
 * Waits `ms` milliseconds with a timer, the default `pause` port.
 *
 * @throws an `AbortError` `DOMException` as soon as `signal` aborts
 */
export function pauseFor(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () =>
      reject(new DOMException("The search scan was aborted.", "AbortError"));
    if (signal?.aborted) {
      abort();
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      abort();
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
