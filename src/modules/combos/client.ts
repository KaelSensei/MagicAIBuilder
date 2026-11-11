/**
 * Combos context: the browser entry point (ADR 0002).
 *
 * The hook that looks the active deck up, the typed client of
 * `POST /api/combos` it calls, and the combo shape both return. Nothing here
 * reaches `server.ts` or `infrastructure/`. The panel is imported by path,
 * `@/modules/combos/ui/CombosPanel`, never through this file.
 *
 * `SpellbookVariant` is published here because it is still declared next to
 * the API client; it moves to `index.ts` once the domain owns a combo type.
 *
 * @module combos/client
 */
export {
  fetchCombosForDeck,
  type SpellbookVariant,
} from "@/modules/combos/client/api";
export { useCombos } from "@/modules/combos/client/useCombos";
