/**
 * How often a combo lookup may run: per client address towards
 * `POST /api/combos`, and per server instance towards Commander Spellbook.
 *
 * Domain of the combos context: numbers only, so the route and the Edge-safe
 * `index.ts` can read them. The route spends the per-client limit; the
 * `ComboSourceBudget` adapter (`infrastructure/spellbook-budget.ts`) spends the
 * Spellbook one. Both counters live in `lib/rate-limit.ts`, per instance.
 *
 * @module combos/domain/lookup-policy
 */

/** Window every combo lookup limit is counted over: one minute, Spellbook's own unit. */
export const COMBO_LOOKUP_WINDOW_MS = 60_000;

/**
 * Lookups one client address may make per window.
 *
 * The deck view asks once per distinct card list, so this allows one edit every
 * two seconds for a minute before a client is told to wait.
 */
export const COMBO_LOOKUPS_PER_CLIENT = 30;

/**
 * Calls this server instance may make to Commander Spellbook per window.
 *
 * Commander Spellbook publishes no hard limit; its API root says 80 requests
 * per minute "should be a safe rate", asks clients to stay sparse and to
 * handle 429 (https://backend.commanderspellbook.com/, read 2026-11-12). 60
 * stays under it whatever mix of clients is asking. Cache hits do not count,
 * and a refused call spends nothing.
 */
export const SPELLBOOK_CALLS_PER_WINDOW = 60;
