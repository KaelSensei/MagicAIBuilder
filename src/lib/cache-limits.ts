/**
 * Bounds of the shared Scryfall cache, which only the server writes.
 *
 * A page or card over its byte cap is still served, just not stored. The row
 * caps bound the tables against anyone who asks for many distinct keys: once a
 * table holds its cap of unexpired rows, a miss is served from Scryfall without
 * being stored. Worst case, the search table holds 200 × 500 KB = 100 MB of JSON
 * and the card table 2 000 × 50 KB = 100 MB, before Postgres compresses it, on
 * the 512 MB free-tier database. Real card bodies are 3–10 KB.
 */
export const MAX_SEARCH_CACHE_BYTES = 500 * 1024;

/** Largest card body stored in the card cache. */
export const MAX_CARD_CACHE_BYTES = 50 * 1024;

/** Most unexpired search pages kept at once (TTL 1 h). */
export const MAX_SEARCH_CACHE_ROWS = 200;

/** Most unexpired cards kept at once (TTL 24 h). */
export const MAX_CARD_CACHE_ROWS = 2000;
