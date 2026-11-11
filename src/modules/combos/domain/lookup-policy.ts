// How often `POST /api/combos` may run, per client and towards Commander Spellbook.

/** Window every combo lookup limit is counted over. */
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
 * Spellbook's API guide calls 80 requests per minute a safe rate and asks for
 * sparse use; 60 stays under it whatever mix of clients is asking. Cache hits
 * do not count.
 */
export const SPELLBOOK_CALLS_PER_WINDOW = 60;
