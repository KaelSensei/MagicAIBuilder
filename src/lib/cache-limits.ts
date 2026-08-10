/**
 * Shared cache payload limits — used by both the /api/cache/search route
 * (to reject oversized writes) and the client (to skip sending them).
 */
export const MAX_SEARCH_CACHE_BYTES = 500 * 1024;
