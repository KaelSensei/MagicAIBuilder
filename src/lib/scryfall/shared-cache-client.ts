/**
 * The browser's read path into the shared Scryfall cache: a card by Scryfall id
 * through `GET /api/cache/cards`, and a search page through `GET /api/cache/search`.
 *
 * Card catalog. `client.ts` asks here first and goes to api.scryfall.com itself
 * only when a lookup returns `null` or a body that fails its guards.
 * Read-only on purpose: the server fills the cache on a miss from Scryfall
 * answers it fetched itself (`shared-cache.ts`), and accepts no writes from
 * clients. A 200 answer may come from Vercel's CDN (#1375).
 * Not responsible for: checking the body's shape (`client.ts`), the cache keys
 * (`shared-cache-keys.ts`) or the lifetimes (`shared-cache.ts`).
 *
 * @module scryfall/shared-cache-client
 */

/** The body's `data`, whether the server served it from the cache or just fetched it. */
async function readCacheData(res: Response): Promise<unknown> {
  if (!res.ok) return null;
  const body: unknown = await res.json();
  return typeof body === "object" && body !== null && "data" in body
    ? body.data
    : null;
}

/**
 * Reads one card through the shared cache.
 *
 * The URL is relative, so the lookup only reaches the route from a page; on a
 * server `fetch` rejects and the lookup returns `null`. Never throws.
 *
 * @param scryfallId - Scryfall card id, sent URL-encoded
 * @returns the card body as the server sent it, unchecked; `null` on a non-2xx
 *   answer, an answer without `data`, or a network failure
 */
export async function lookupCardCache(scryfallId: string): Promise<unknown> {
  try {
    const res = await fetch(
      `/api/cache/cards?id=${encodeURIComponent(scryfallId)}`
    );
    return await readCacheData(res);
  } catch {
    return null;
  }
}

/**
 * Reads one search page through the shared cache. The server hashes the query,
 * the page and the multilingual flag into the row key, so each combination is
 * cached on its own.
 *
 * Same transport as `lookupCardCache`: relative URL, `null` on any failure,
 * never throws.
 *
 * @param query - Scryfall search syntax, sent as given
 * @param page - 1-based page number
 * @param multilingual - whether Scryfall must include non-English printings
 * @returns the page body as the server sent it, unchecked; `null` when the
 *   server could not provide one
 */
export async function lookupSearchCache(
  query: string,
  page: number,
  multilingual = false
): Promise<unknown> {
  try {
    const params = new URLSearchParams({ query, page: String(page) });
    if (multilingual) params.set("multilingual", "1");
    const res = await fetch(`/api/cache/search?${params}`);
    return await readCacheData(res);
  } catch {
    return null;
  }
}
