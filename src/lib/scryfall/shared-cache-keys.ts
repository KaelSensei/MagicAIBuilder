/**
 * Keys of the shared Scryfall cache, read from a request's query string.
 *
 * Every row the server writes is keyed under `SHARED_CACHE_NAMESPACE`. Rows
 * written before the server became the only writer were keyed differently —
 * `sha256(query|page)` for searches and the bare Scryfall id for cards — and any
 * signed-in user could forge them. The namespace is what guarantees those rows
 * are never read again: no key built here can equal one of them. Change the
 * namespace to retire every stored row at once.
 */
import "server-only";
import { createHash } from "node:crypto";
import { isScryfallId } from "./scryfall-id";

/** Prefix of every row key the server writes; rows without it are retired. */
export const SHARED_CACHE_NAMESPACE = "srv1:";

/** Longest search query the cache accepts; Scryfall itself refuses much longer ones. */
export const MAX_SEARCH_QUERY_LENGTH = 1000;

/** Highest search page the cache accepts; Scryfall pages hold 175 cards. */
const MAX_SEARCH_PAGE = 100;

/**
 * Letters, marks and digits of any script, punctuation, symbols and the plain
 * space: everything Scryfall's query syntax and card names use. Control and
 * format characters, line breaks and other whitespace are refused.
 */
const SEARCH_QUERY_PATTERN = /^[\p{L}\p{M}\p{N}\p{P}\p{S} ]+$/u;

const PAGE_PATTERN = /^\d{1,3}$/;

/** One Scryfall search page, exactly as the server will ask Scryfall for it. */
export interface SearchCacheKey {
  readonly query: string;
  readonly page: number;
  /** Sent as `include_multilingual`, which a `lang:` filter needs. */
  readonly multilingual: boolean;
}

/** A parsed key, or why the request cannot name a cache entry. */
export type ParsedKey<T> =
  | { readonly ok: true; readonly key: T }
  | { readonly ok: false; readonly reason: string };

function parsePage(raw: string | null): number | null {
  if (raw === null) return 1;
  if (!PAGE_PATTERN.test(raw)) return null;
  const page = Number(raw);
  return page >= 1 && page <= MAX_SEARCH_PAGE ? page : null;
}

function parseMultilingual(raw: string | null): boolean | null {
  if (raw === null) return false;
  return raw === "1" ? true : null;
}

/**
 * @param params - `query`, optional `page` (1–100, default 1) and optional `multilingual=1`
 * @returns the search page to read, or the reason the request is refused
 */
export function parseSearchCacheKey(
  params: URLSearchParams
): ParsedKey<SearchCacheKey> {
  const query = params.get("query") ?? "";
  if (query.length === 0 || query.length > MAX_SEARCH_QUERY_LENGTH) {
    return {
      ok: false,
      reason: `query must be 1-${MAX_SEARCH_QUERY_LENGTH} characters`,
    };
  }
  if (!SEARCH_QUERY_PATTERN.test(query)) {
    return {
      ok: false,
      reason: "query contains characters a search cannot use",
    };
  }
  const page = parsePage(params.get("page"));
  if (page === null) {
    return {
      ok: false,
      reason: `page must be a whole number from 1 to ${MAX_SEARCH_PAGE}`,
    };
  }
  const multilingual = parseMultilingual(params.get("multilingual"));
  if (multilingual === null) {
    return { ok: false, reason: "multilingual must be 1 or absent" };
  }
  return { ok: true, key: { query, page, multilingual } };
}

/**
 * @param params - `id`, a Scryfall card id
 * @returns the id in lower case, as Scryfall writes it, or the reason it is refused
 */
export function parseCardCacheId(params: URLSearchParams): ParsedKey<string> {
  const id = params.get("id") ?? "";
  if (!isScryfallId(id)) {
    return { ok: false, reason: "id must be a Scryfall card id" };
  }
  return { ok: true, key: id.toLowerCase() };
}

/**
 * @param key - a parsed search page
 * @returns its row key: the namespace, then a sha256 of every request input
 */
export function searchCacheRowKey(key: SearchCacheKey): string {
  const digest = createHash("sha256")
    .update(`${key.multilingual ? 1 : 0}|${key.page}|${key.query}`)
    .digest("hex");
  return `${SHARED_CACHE_NAMESPACE}${digest}`;
}

/**
 * @param id - a parsed Scryfall card id
 * @returns its row key: the namespace, then the id
 */
export function cardCacheRowKey(id: string): string {
  return `${SHARED_CACHE_NAMESPACE}${id}`;
}
