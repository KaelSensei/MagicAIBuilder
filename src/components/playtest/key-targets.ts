/**
 * Which element a key press inside the playtest belongs to: a field the player types into, or
 * the playtest itself.
 *
 * Context: playtest, the UI. `PlaytestDialog` leaves Escape to a text field, so the action log
 * can cancel an edit without closing the game; `usePlaytestHotkeys` leaves every key to a
 * control that reads plain keys, and finds the card a move key acts on from the
 * `data-playtest-card` and `data-playtest-zone` attributes the hand and battlefield put on it.
 * Not responsible for: what a key does (the dialog and `lib/playtest/hotkeys.ts` decide).
 *
 * @module components/playtest/key-targets
 */

import type {
  FocusableCardZone,
  FocusedPlaytestCard,
} from "@/lib/playtest/hotkeys";

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

/**
 * Controls that read plain keys themselves, or sit inside one: a select jumps to the option a
 * letter starts, editable content takes the letter, and these ARIA widgets type ahead or move
 * with the keys.
 */
const PLAIN_KEY_CONTROL_SELECTOR = [
  "select",
  '[contenteditable]:not([contenteditable="false"])',
  ...[
    "combobox",
    "listbox",
    "menu",
    "searchbox",
    "slider",
    "spinbutton",
    "textbox",
  ].map((role) => `[role="${role}"]`),
].join(", ");

/**
 * Whether a key event belongs to the control it comes from rather than to the playtest.
 * @param target - The keyboard event's target
 * @returns True for a text field, a select, editable content or a widget that reads keys
 */
export function readsPlainKeys(target: EventTarget | null): boolean {
  if (isTextEntryTarget(target)) return true;
  return (
    target instanceof Element &&
    target.closest(PLAIN_KEY_CONTROL_SELECTOR) !== null
  );
}

/** The marker a hand or battlefield card carries so a move key can find it. */
export interface PlaytestCardAttributes {
  readonly "data-playtest-card": string;
  readonly "data-playtest-zone": FocusableCardZone;
}

/**
 * The attributes the hand and the battlefield put on each card's element, read back by
 * `focusedPlaytestCard`; one definition, so the writer and the reader cannot drift.
 */
export function playtestCardAttributes(
  cardId: string,
  zone: FocusableCardZone
): PlaytestCardAttributes {
  return { "data-playtest-card": cardId, "data-playtest-zone": zone };
}

const FOCUSABLE_ZONES: readonly FocusableCardZone[] = ["hand", "battlefield"];

function isFocusableZone(zone: string | undefined): zone is FocusableCardZone {
  return FOCUSABLE_ZONES.some((candidate) => candidate === zone);
}

/**
 * The hand or battlefield card the focus is on or inside, read from the attributes its zone
 * puts on it, or null when the focus is anywhere else.
 * @param target - The keyboard event's target
 */
export function focusedPlaytestCard(
  target: EventTarget | null
): FocusedPlaytestCard | null {
  if (!(target instanceof Element)) return null;
  const card = target.closest<HTMLElement>("[data-playtest-card]");
  const cardId = card?.dataset.playtestCard;
  const zone = card?.dataset.playtestZone;
  if (!cardId || !isFocusableZone(zone)) return null;
  return { cardId, zone };
}
