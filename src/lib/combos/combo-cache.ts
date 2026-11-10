// Server-side cache of combo lookups, keyed by a hash of the canonical card list.
import { createHash } from "node:crypto";
import {
  deckComboQueryKey,
  type DeckComboQuery,
} from "@/lib/combos/deck-query";
import type { SpellbookVariant } from "@/lib/combos/spellbook";

/**
 * How long a lookup is reused. Spellbook adds combos over days, not minutes,
 * and the browser already keeps a result for an hour; six hours lets every
 * viewer of the same list share one Spellbook call.
 */
export const COMBO_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/** Most lists kept at once; the oldest is dropped first. A typical entry is a few KB. */
export const COMBO_CACHE_MAX_ENTRIES = 500;

interface CacheEntry {
  readonly combos: readonly SpellbookVariant[];
  readonly storedAt: number;
}

// Per server instance, like the rate limiter: a cold instance asks Spellbook again.
const entries = new Map<string, CacheEntry>();

function cacheKey(query: DeckComboQuery): string {
  return createHash("sha256")
    .update(deckComboQueryKey(query), "utf8")
    .digest("hex");
}

/**
 * @param query - a card list in canonical form
 * @param now - current time in ms, for tests
 * @returns the combos stored for that list, or null when none are fresh
 */
export function readCachedCombos(
  query: DeckComboQuery,
  now: number = Date.now()
): readonly SpellbookVariant[] | null {
  const key = cacheKey(query);
  const entry = entries.get(key);
  if (!entry) return null;
  if (now - entry.storedAt >= COMBO_CACHE_TTL_MS) {
    entries.delete(key);
    return null;
  }
  return entry.combos;
}

/**
 * Stores a successful lookup. Failures are never stored, so Spellbook is asked
 * again as soon as it recovers.
 *
 * @param query - a card list in canonical form
 * @param combos - the combos Spellbook found for it
 * @param now - current time in ms, for tests
 */
export function storeCachedCombos(
  query: DeckComboQuery,
  combos: readonly SpellbookVariant[],
  now: number = Date.now()
): void {
  const key = cacheKey(query);
  entries.delete(key);
  entries.set(key, { combos, storedAt: now });
  if (entries.size > COMBO_CACHE_MAX_ENTRIES) {
    const oldest = entries.keys().next();
    if (!oldest.done) entries.delete(oldest.value);
  }
}
