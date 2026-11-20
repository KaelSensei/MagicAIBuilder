/**
 * Solitary tests of the playtest's key table and the function that reads a key press against
 * it. The keys acting on a real game are covered in `usePlaytestHotkeys.test.tsx`.
 */

import { describe, expect, it } from "vitest";
import {
  PLAYTEST_HOTKEYS,
  resolvePlaytestHotkey,
  type PlaytestKeyContext,
  type PlaytestKeyPress,
} from "./hotkeys";

const press = (
  key: string,
  overrides: Partial<PlaytestKeyPress> = {}
): PlaytestKeyPress => ({
  key,
  chordModifier: false,
  shiftKey: false,
  altKey: false,
  ...overrides,
});

const NOTHING_FOCUSED: PlaytestKeyContext = {
  focusedCard: null,
  singleKeysEnabled: true,
};

const HAND_CARD_FOCUSED: PlaytestKeyContext = {
  focusedCard: { cardId: "c1", zone: "hand" },
  singleKeysEnabled: true,
};

describe("the key table", () => {
  it("gives every key one action and one cheat-sheet line", () => {
    const keys = PLAYTEST_HOTKEYS.map(
      (hotkey) => `${hotkey.chord}:${hotkey.key}`
    );
    const ids = PLAYTEST_HOTKEYS.map((hotkey) => hotkey.id);

    expect(new Set(keys).size).toBe(PLAYTEST_HOTKEYS.length);
    expect(new Set(ids).size).toBe(PLAYTEST_HOTKEYS.length);
  });
});

describe("resolvePlaytestHotkey", () => {
  it("reads D, N, S and U as their commands, with Caps Lock or Shift too", () => {
    expect(resolvePlaytestHotkey(press("d"), NOTHING_FOCUSED)).toEqual({
      kind: "dispatch",
      command: { type: "draw" },
    });
    expect(resolvePlaytestHotkey(press("N"), NOTHING_FOCUSED)).toEqual({
      kind: "dispatch",
      command: { type: "nextTurn" },
    });
    expect(
      resolvePlaytestHotkey(press("S", { shiftKey: true }), NOTHING_FOCUSED)
    ).toEqual({ kind: "dispatch", command: { type: "shuffleLibrary" } });
    expect(resolvePlaytestHotkey(press("u"), NOTHING_FOCUSED)).toEqual({
      kind: "dispatch",
      command: { type: "untapAll" },
    });
  });

  it("moves the focused card from its own zone", () => {
    expect(resolvePlaytestHotkey(press("e"), HAND_CARD_FOCUSED)).toEqual({
      kind: "dispatch",
      command: { type: "moveToZone", cardId: "c1", from: "hand", to: "exile" },
    });
  });

  it("does nothing for a move to the zone the card is already in", () => {
    expect(resolvePlaytestHotkey(press("h"), HAND_CARD_FOCUSED)).toBeNull();
    expect(
      resolvePlaytestHotkey(press("b"), {
        ...HAND_CARD_FOCUSED,
        focusedCard: { cardId: "p1", zone: "battlefield" },
      })
    ).toBeNull();
  });

  it("does nothing for a move key with no focused card", () => {
    expect(resolvePlaytestHotkey(press("g"), NOTHING_FOCUSED)).toBeNull();
  });

  it("reads ? as the cheat sheet", () => {
    expect(
      resolvePlaytestHotkey(press("?", { shiftKey: true }), NOTHING_FOCUSED)
    ).toEqual({ kind: "showKeys" });
  });

  it("reads Ctrl or ⌘ + Z as undo, even with single keys off", () => {
    const keysOff = { ...NOTHING_FOCUSED, singleKeysEnabled: false };

    expect(
      resolvePlaytestHotkey(press("z", { chordModifier: true }), keysOff)
    ).toEqual({ kind: "dispatch", command: { type: "undo" } });
    expect(resolvePlaytestHotkey(press("d"), keysOff)).toBeNull();
  });

  it("leaves Ctrl+Shift+Z, Alt chords, other chords and unknown keys alone", () => {
    const redo = press("Z", { chordModifier: true, shiftKey: true });

    expect(resolvePlaytestHotkey(redo, NOTHING_FOCUSED)).toBeNull();
    expect(
      resolvePlaytestHotkey(press("d", { altKey: true }), NOTHING_FOCUSED)
    ).toBeNull();
    expect(
      resolvePlaytestHotkey(
        press("d", { chordModifier: true }),
        NOTHING_FOCUSED
      )
    ).toBeNull();
    expect(resolvePlaytestHotkey(press("x"), NOTHING_FOCUSED)).toBeNull();
  });
});
