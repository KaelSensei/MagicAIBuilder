/**
 * Which element a key press inside the playtest belongs to: a field the player types into, or
 * the playtest itself.
 *
 * Context: playtest, the UI. `PlaytestDialog` leaves Escape to a text field, so the action log
 * can cancel an edit without closing the game.
 * Not responsible for: what a key does (the dialog and the playtest's keys decide).
 *
 * @module components/playtest/key-targets
 */

/** Input types a player types text into; the life total field is a number. */
const TEXT_ENTRY_INPUT_TYPES: ReadonlySet<string> = new Set([
  "text",
  "search",
  "number",
  "url",
  "tel",
  "email",
  "password",
]);

/**
 * Whether a key event comes from a field the player types text into.
 * @param target - The keyboard event's target
 * @returns True for a textarea or a text-entry input
 */
export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (target instanceof HTMLTextAreaElement) return true;
  return (
    target instanceof HTMLInputElement &&
    TEXT_ENTRY_INPUT_TYPES.has(target.type)
  );
}
