"use client";
// Global keyboard shortcuts hook — registers window-level event listeners
// and dispatches actions to deck store + UI store.
// Note: All single-key UI state reads are done via useUIStore.getState() (not
// subscriptions) to avoid stale closure issues when multiple rapid events fire.
import { useEffect, useCallback } from "react";
import { useDeckStore } from "@/lib/deck/store";
import { useUIStore } from "@/lib/ui/store";
import type { ScryfallCard } from "@/lib/scryfall/types";

interface UseKeyboardShortcutsOptions {
  /** Current search results — used for Enter (add first card) and arrow navigation */
  searchResults: ScryfallCard[];
  /** Called when the user requests to add a card (e.g. via Enter) */
  onAddCard: (card: ScryfallCard) => void;
  /** Whether a text input/textarea is focused (suppresses single-key shortcuts) */
  isInputFocused?: boolean;
}

/** Input types the browser edits as text, each keeping its own undo history. */
const TEXT_ENTRY_INPUT_TYPES: ReadonlySet<string> = new Set([
  "text",
  "search",
  "url",
  "tel",
  "email",
  "password",
  "number",
]);

/**
 * Whether a key event comes from a field the player types text into.
 * @param target - The keyboard event's target
 * @returns True for a textarea, a text-entry input or editable content; false
 *   for buttons, checkboxes and other controls that have no text to undo
 */
function isTextEntryTarget(target: EventTarget | null): boolean {
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) return TEXT_ENTRY_INPUT_TYPES.has(target.type);
  return target instanceof HTMLElement && target.isContentEditable;
}

/**
 * Whether a key event comes from a form input or text field, where
 * single-character shortcuts stay silent.
 * @param target - The keyboard event's target
 * @returns True for any input (checkboxes included), a textarea or editable content
 */
function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || isTextEntryTarget(target);
}

/**
 * Handle Ctrl/Cmd modifier shortcuts.
 * @param e - The keydown event
 * @param modKey - Whether the platform's command modifier is held
 * @param isTypingText - Whether the focus is in a text field, whose own undo
 *   then handles Ctrl/Cmd+Z instead of the deck
 * @param undo - Deck undo action
 * @param forceSave - Deck save action
 * @returns True if the event was handled here
 */
function handleModifierShortcut(
  e: KeyboardEvent,
  modKey: boolean,
  isTypingText: boolean,
  undo: () => void,
  forceSave: () => void,
): boolean {
  if (!modKey) return false;
  switch (e.key) {
    case "z":
      if (isTypingText) return false;
      e.preventDefault(); undo(); return true;
    case "s": e.preventDefault(); forceSave(); return true;
    case "e": e.preventDefault(); useUIStore.getState().setShowExportModal(true); return true;
    case "i": e.preventDefault(); useUIStore.getState().setShowImportModal(true); return true;
    default: return false;
  }
}

/** Close the topmost open modal, or clear search if none are open */
function handleEscapeKey(): void {
  const ui = useUIStore.getState();
  if (ui.showKeyboardModal) { ui.setShowKeyboardModal(false); return; }
  if (ui.showExportModal) { ui.setShowExportModal(false); return; }
  if (ui.showImportModal) { ui.setShowImportModal(false); return; }
  ui.clearSearch();
}

/** Add the keyboard-selected (or first) card from search results */
function handleEnterKey(
  e: KeyboardEvent,
  searchResults: ScryfallCard[],
  onAddCard: (card: ScryfallCard) => void,
): void {
  if (searchResults.length === 0) return;
  e.preventDefault();
  const idx = useUIStore.getState().keyboardSelectedIndex;
  const card = searchResults[Math.max(idx, 0)];
  if (card) { onAddCard(card); useUIStore.getState().resetKeyboardSelection(); }
}

/** Handle single-key shortcuts (slash, escape, arrows, enter) */
function handleSingleKeyShortcut(
  e: KeyboardEvent,
  searchResults: ScryfallCard[],
  onAddCard: (card: ScryfallCard) => void,
): void {
  switch (e.key) {
    case "/":
      e.preventDefault();
      useUIStore.getState().focusSearch();
      break;
    case "?":
      e.preventDefault();
      useUIStore.getState().setShowKeyboardModal(true);
      break;
    case "Escape":
      e.preventDefault();
      handleEscapeKey();
      break;
    case "ArrowDown":
      if (searchResults.length === 0) break;
      e.preventDefault();
      useUIStore.getState().setKeyboardSelectedIndex(
        Math.min(useUIStore.getState().keyboardSelectedIndex + 1, searchResults.length - 1)
      );
      break;
    case "ArrowUp":
      if (searchResults.length === 0) break;
      e.preventDefault();
      useUIStore.getState().setKeyboardSelectedIndex(
        Math.max(useUIStore.getState().keyboardSelectedIndex - 1, 0)
      );
      break;
    case "Enter":
      handleEnterKey(e, searchResults, onAddCard);
      break;
    default:
      break;
  }
}

export function useKeyboardShortcuts({
  searchResults,
  onAddCard,
  isInputFocused = false,
}: UseKeyboardShortcutsOptions) {
  const undo = useDeckStore((s) => s.undo);
  const forceSave = useDeckStore((s) => s.forceSave);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.userAgent.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      const isTypingText = isInputFocused || isTextEntryTarget(e.target);
      if (handleModifierShortcut(e, modKey, isTypingText, undo, forceSave)) return;

      if (isInputFocused || isEditableTarget(e.target)) return;

      handleSingleKeyShortcut(e, searchResults, onAddCard);
    },
    [undo, forceSave, isInputFocused, searchResults, onAddCard]
  );

  useEffect(() => {
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
