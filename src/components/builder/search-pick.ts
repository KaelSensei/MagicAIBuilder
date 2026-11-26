/**
 * The command-slot pick the builder's search panel runs instead of its tab's own search.
 *
 * Card catalog context, builder search panel. The Name tab's commander, partner and companion
 * toggles start a pick; while one is on, its query replaces the tab's (`buildSearchQueryFromMode`
 * in the builder page). One value holds the pick, so at most one runs and ending it is a single
 * assignment to `null`, never three flags to reset in step.
 *
 * @module components/builder/search-pick
 */

/** The command-zone card a pick searches for: a commander, a partner or a companion. */
export type SearchPick = "commander" | "partner" | "companion";

/**
 * The pick after the player presses one of the toggles.
 *
 * @param current - the pick that is on, or `null` when none is
 * @param pressed - the pick whose toggle the player pressed
 * @returns `null` when `pressed` was already on, which ends the pick; else `pressed`, which
 *   replaces any other pick
 */
export function togglePick(
  current: SearchPick | null,
  pressed: SearchPick
): SearchPick | null {
  return current === pressed ? null : pressed;
}
