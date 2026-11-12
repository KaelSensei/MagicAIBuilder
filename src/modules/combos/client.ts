/**
 * Combos context: the browser entry point (ADR 0002).
 *
 * The hook that looks the active deck up and the typed client of
 * `POST /api/combos` it calls. Both return the `Combo` type that `index.ts`
 * publishes. Nothing here reaches `server.ts` or `infrastructure/`. The panel
 * is imported by path, `@/modules/combos/ui/CombosPanel`, never through this
 * file.
 *
 * @module combos/client
 */
export { fetchCombosForDeck } from "@/modules/combos/client/api";
export { useCombos } from "@/modules/combos/client/useCombos";
