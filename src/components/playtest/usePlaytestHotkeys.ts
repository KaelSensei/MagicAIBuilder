"use client";
/**
 * The playtest's keyboard: D, N, S, U, the move keys, `?` and Ctrl/⌘+Z, while the playtest is
 * open.
 *
 * Context: playtest, the UI. `PlaytestKeys` mounts it for as long as the playtest is open. It
 * reads each key press on the document, after the playtest's own controls have seen it, asks
 * `resolvePlaytestHotkey` (`lib/playtest/hotkeys.ts`) what it means, and sends the command
 * through the store's `dispatch`, as the buttons do.
 *
 * The playtest covers the builder, so no key pressed in it is the builder's: the hook stops
 * every key press from reaching the window, where the builder's shortcuts listen
 * (`useKeyboardShortcuts`), so `/`, `?`, Ctrl+S or Ctrl+Z never act on the deck behind it.
 * Not responsible for: Escape, which the dialogs handle; the cheat sheet's content.
 *
 * @module components/playtest/usePlaytestHotkeys
 */

import { useEffect } from "react";
import type { PlaytestCommand } from "@/lib/playtest/engine";
import { resolvePlaytestHotkey } from "@/lib/playtest/hotkeys";
import { useShortcutPreferencesStore } from "@/lib/ui/shortcut-preferences";
import {
  focusedPlaytestCard,
  readsPlainKeys,
} from "@/components/playtest/key-targets";

/** What the playtest's keys act through. */
export interface PlaytestHotkeyHandlers {
  /** The store's `dispatch`: one command, one log line, one undo step. */
  readonly onDispatch: (command: PlaytestCommand) => void;
  /** Opens the cheat sheet. */
  readonly onShowKeys: () => void;
  /**
   * True while the cheat sheet is open: a key then neither plays a move behind it nor reaches
   * the builder.
   */
  readonly paused: boolean;
}

/**
 * Whether the playtest should leave this key press alone: it is being composed by an input
 * method, a control already handled it, or it belongs to a field or widget that reads keys
 * (Ctrl/⌘+Z in a text field undoes the typing, not the game).
 */
function belongsElsewhere(event: KeyboardEvent): boolean {
  return (
    event.isComposing || event.defaultPrevented || readsPlainKeys(event.target)
  );
}

/**
 * Listens to the keyboard while the playtest is open and turns the playtest's keys into
 * commands. A single key is off while the player has single-key shortcuts off (WCAG 2.2
 * SC 2.1.4); Ctrl/⌘+Z keeps working. The switch is read at each press, so a change applies from
 * the next key.
 */
export function usePlaytestHotkeys({
  onDispatch,
  onShowKeys,
  paused,
}: PlaytestHotkeyHandlers): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      event.stopPropagation();
      if (paused || belongsElsewhere(event)) return;

      const outcome = resolvePlaytestHotkey(
        {
          key: event.key,
          chordModifier: event.ctrlKey || event.metaKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
        },
        {
          focusedCard: focusedPlaytestCard(event.target),
          singleKeysEnabled:
            useShortcutPreferencesStore.getState().singleKeyShortcutsEnabled,
        }
      );
      if (outcome === null) return;

      event.preventDefault();
      if (outcome.kind === "showKeys") onShowKeys();
      else onDispatch(outcome.command);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDispatch, onShowKeys, paused]);
}
