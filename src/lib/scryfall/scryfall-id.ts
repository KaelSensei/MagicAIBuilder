/**
 * Recognising a Scryfall card id before it reaches a URL, a cache key or the
 * database.
 *
 * Card catalog context. A Scryfall id names one printing. Scryfall types it
 * as a UUID (https://scryfall.com/docs/api/cards, field `id`, read 2026-11-11)
 * and writes it in lower case. The deck card schemas (`lib/validation/card.ts`) and the shared
 * cache's card key (`shared-cache-keys.ts`) both check ids with this one
 * pattern.
 *
 * @module scryfall/scryfall-id
 */

/**
 * A Scryfall id: a UUID, hexadecimal digits grouped 8-4-4-4-12, in either
 * case. Anchored, so nothing may precede or follow it. For Zod's
 * `.regex()`; elsewhere call `isScryfallId`.
 */
export const SCRYFALL_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether a string has the shape of a Scryfall card id.
 *
 * Upper-case digits pass, although Scryfall writes ids in lower case: a caller
 * that keys or compares ids lower-cases them first, as `parseCardCacheId`
 * does. It checks the shape only, not that the card exists.
 */
export function isScryfallId(value: string): boolean {
  return SCRYFALL_ID_PATTERN.test(value);
}
