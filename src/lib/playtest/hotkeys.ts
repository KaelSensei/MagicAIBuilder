/**
 * The playtest's keys: one table that says which key does what, and the one function that reads
 * a key press against it.
 *
 * Context: playtest. `usePlaytestHotkeys` (components) feeds every key press it may act on to
 * `resolvePlaytestHotkey` and sends the command it returns through the store's `dispatch`, the
 * path every button takes, so a key writes the button's log line and is one undo step. The
 * cheat sheet (`PlaytestKeysDialog`) lists `PLAYTEST_HOTKEYS` itself, so the two cannot
 * disagree. The letters follow Moxfield's (D, S, N, G, E, B) and stay the same in every
 * language; only their descriptions are translated.
 * Not responsible for: whether the focus is in a text field or which card has the focus, which
 * the hook reads from the page; or what a command does (`engine/commands.ts`).
 *
 * @module playtest/hotkeys
 */

import type { CardZone, PlaytestCommand } from "./engine";

// ─── The table ────────────────────────────────────────────────────────────
/** The zones a focused card can be in for a move key to act on it. */
export type FocusableCardZone = Extract<CardZone, "hand" | "battlefield">;

/** The zones a move key sends the focused card to. */
export type HotkeyDestination = Extract<
  CardZone,
  "graveyard" | "exile" | "battlefield" | "hand"
>;

/** What a key does: send one command, move the focused card, or show the cheat sheet. */
export type PlaytestHotkeyAction =
  | { readonly kind: "command"; readonly command: PlaytestCommand }
  | { readonly kind: "moveFocusedCard"; readonly to: HotkeyDestination }
  | { readonly kind: "showKeys" };

/** Names a key in the cheat sheet; each is a message under `playtest.hotkeys.actions`. */
export type PlaytestHotkeyId =
  | "draw"
  | "nextTurn"
  | "shuffle"
  | "untapAll"
  | "toGraveyard"
  | "toExile"
  | "toBattlefield"
  | "toHand"
  | "showKeys"
  | "undo";

/** One key of the playtest. */
export interface PlaytestHotkey {
  readonly id: PlaytestHotkeyId;
  /** The `KeyboardEvent.key` it answers to, lower case (Caps Lock and Shift give the same key). */
  readonly key: string;
  /**
   * True for a Ctrl or ⌘ chord. A chord works when the player has turned single-key shortcuts
   * off (WCAG 2.2 SC 2.1.4); a single key does not.
   */
  readonly chord: boolean;
  /** How the cheat sheet prints the key; the same in every language. */
  readonly labels: readonly string[];
  readonly action: PlaytestHotkeyAction;
}

const singleKey = (
  id: PlaytestHotkeyId,
  key: string,
  action: PlaytestHotkeyAction
): PlaytestHotkey => ({
  id,
  key,
  chord: false,
  labels: [key.toUpperCase()],
  action,
});

/** Every key of the playtest, in the order the cheat sheet lists them. */
export const PLAYTEST_HOTKEYS: readonly PlaytestHotkey[] = [
  singleKey("draw", "d", { kind: "command", command: { type: "draw" } }),
  singleKey("nextTurn", "n", {
    kind: "command",
    command: { type: "nextTurn" },
  }),
  singleKey("shuffle", "s", {
    kind: "command",
    command: { type: "shuffleLibrary" },
  }),
  singleKey("untapAll", "u", {
    kind: "command",
    command: { type: "untapAll" },
  }),
  singleKey("toGraveyard", "g", { kind: "moveFocusedCard", to: "graveyard" }),
  singleKey("toExile", "e", { kind: "moveFocusedCard", to: "exile" }),
  singleKey("toBattlefield", "b", {
    kind: "moveFocusedCard",
    to: "battlefield",
  }),
  singleKey("toHand", "h", { kind: "moveFocusedCard", to: "hand" }),
  singleKey("showKeys", "?", { kind: "showKeys" }),
  {
    id: "undo",
    key: "z",
    chord: true,
    labels: ["Ctrl+Z", "⌘Z"],
    action: { kind: "command", command: { type: "undo" } },
  },
];

// ─── Reading a key press ──────────────────────────────────────────────────
/** The parts of a key press the table reads. */
export interface PlaytestKeyPress {
  readonly key: string;
  /** Ctrl, or ⌘ on a Mac. */
  readonly chordModifier: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
}

/** The card that has the focus in the hand or on the battlefield. */
export interface FocusedPlaytestCard {
  readonly cardId: string;
  readonly zone: FocusableCardZone;
}

/** What the page knows when a key is pressed. */
export interface PlaytestKeyContext {
  readonly focusedCard: FocusedPlaytestCard | null;
  /** The player's single-key switch (I-04 AC-04-06); chords ignore it. */
  readonly singleKeysEnabled: boolean;
}

/** What a key press asks for: one command to dispatch, or the cheat sheet. */
export type PlaytestHotkeyOutcome =
  | { readonly kind: "dispatch"; readonly command: PlaytestCommand }
  | { readonly kind: "showKeys" };

/**
 * The key of the table a press matches, or undefined. Shift is allowed on a single key (it is
 * how `?` is typed) but not on a chord, where Ctrl+Shift+Z means redo in most apps.
 */
function matchingHotkey(press: PlaytestKeyPress): PlaytestHotkey | undefined {
  if (press.altKey) return undefined;
  const key = press.key.toLowerCase();
  return PLAYTEST_HOTKEYS.find(
    (hotkey) =>
      hotkey.key === key &&
      hotkey.chord === press.chordModifier &&
      !(hotkey.chord && press.shiftKey)
  );
}

/**
 * The move that sends the focused card to `to`, or null when no card has the focus or it is
 * already there (a move to the same zone would log a move that did not happen).
 */
function moveFocusedCard(
  focusedCard: FocusedPlaytestCard | null,
  to: HotkeyDestination
): PlaytestHotkeyOutcome | null {
  if (focusedCard === null || focusedCard.zone === to) return null;
  return {
    kind: "dispatch",
    command: {
      type: "moveToZone",
      cardId: focusedCard.cardId,
      from: focusedCard.zone,
      to,
    },
  };
}

/**
 * What a key press asks the playtest to do, or null when the press is not one of its keys or
 * cannot act now: a single key while the player has single keys off, or a move key with no
 * focused card. Pure; the hook decides beforehand whether the focus is in a text field.
 */
export function resolvePlaytestHotkey(
  press: PlaytestKeyPress,
  context: PlaytestKeyContext
): PlaytestHotkeyOutcome | null {
  const hotkey = matchingHotkey(press);
  if (hotkey === undefined) return null;
  if (!hotkey.chord && !context.singleKeysEnabled) return null;

  const { action } = hotkey;
  switch (action.kind) {
    case "command":
      return { kind: "dispatch", command: action.command };
    case "moveFocusedCard":
      return moveFocusedCard(context.focusedCard, action.to);
    case "showKeys":
      return { kind: "showKeys" };
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
