/**
 * Combos context: the pure entry point (ADR 0002).
 *
 * The card list one combo lookup is for (its bounds, its validation and its
 * canonical form) and the rate limits of a lookup. Everything here is data or
 * a pure function from `domain/`, so it is safe on the server, in the browser
 * and in the Edge middleware. The server-side lookup is in `server.ts`, the
 * hook and the browser API client in `client.ts`, the panel at
 * `@/modules/combos/ui/CombosPanel`.
 *
 * @module combos
 */
export {
  MAX_MAIN_CARDS,
  MAX_QUERY_BODY_BYTES,
  deckComboQuerySchema,
  normalizeDeckComboQuery,
  type DeckComboQuery,
} from "@/modules/combos/domain/deck-query";
export {
  COMBO_LOOKUPS_PER_CLIENT,
  COMBO_LOOKUP_WINDOW_MS,
  SPELLBOOK_CALLS_PER_WINDOW,
} from "@/modules/combos/domain/lookup-policy";
