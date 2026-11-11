"use client";
// Global keyboard shortcuts hook — registers window-level event listeners
// and dispatches actions to deck store + UI store.
// Note: All single-key UI state reads are done via useUIStore.getState() (not
// subscriptions) to avoid stale closure issues when multiple rapid events fire.
// The single-key switch is read the same way, so it applies from the next key.
import { useEffect, useCallback } from "react";
import { useDeckStore } from "@/lib/deck/store";
import { useUIStore } from "@/lib/ui/store";
import { useShortcutPreferencesStore } from "@/lib/ui/shortcut-preferences";
import type { ScryfallCard } from "@/lib/scryfall/types";

interface UseKeyboardShortcutsOptions {
  /** Current search results — used for Enter (add first card) and arrow navigation */
  searchResults: readonly ScryfallCard[];
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

/** Editable content and anything inside it; only `contenteditable="false"` opts out. */
const EDITABLE_CONTENT_SELECTOR =
  '[contenteditable]:not([contenteditable="false"])';

/**
 * ARIA widgets whose own keyboard pattern reads plain keys: a combobox filters
 * as you type, a listbox, menu, grid or tab list moves with the arrows, and
 * Enter picks the focused item.
 */
const KEY_READING_WIDGET_ROLES: readonly string[] = [
  "combobox",
  "grid",
  "listbox",
  "menu",
  "menubar",
  "radiogroup",
  "searchbox",
  "slider",
  "spinbutton",
  "tablist",
  "textbox",
  "tree",
  "treegrid",
];

/** Controls that read keys pressed without Ctrl/Cmd themselves, or sit inside one. */
const KEY_READING_CONTROL_SELECTOR = [
  "input",
  "textarea",
  "select",
  EDITABLE_CONTENT_SELECTOR,
  ...KEY_READING_WIDGET_ROLES.map((role) => `[role="${role}"]`),
].join(", ");

/** Controls Enter already activates: a button presses, a link opens, a summary toggles. */
const ENTER_ACTIVATED_SELECTOR =
  'button, a[href], summary, [role="button"], [role="link"]';

/**
 * Whether a key event's target is, or sits inside, an element matching a selector.
 * @param target - The keyboard event's target
 * @param selector - CSS selector to look for on the target and its ancestors
 * @returns True when the target or one of its ancestors matches
 */
function isWithin(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null;
}

/**
 * Whether a key event comes from a field the player types text into.
 * @param target - The keyboard event's target
 * @returns True for a textarea, a text-entry input or editable content; false
 *   for buttons, checkboxes and other controls that have no text to undo
 */
function isTextEntryTarget(target: EventTarget | null): boolean {
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) return TEXT_ENTRY_INPUT_TYPES.has(target.type);
  return isWithin(target, EDITABLE_CONTENT_SELECTOR);
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

/**
 * Add the keyboard-selected (or first) card from search results, unless Enter
 * is pressing a focused button or opening a focused link.
 */
function handleEnterKey(
  e: KeyboardEvent,
  searchResults: readonly ScryfallCard[],
  onAddCard: (card: ScryfallCard) => void,
): void {
  if (searchResults.length === 0) return;
  if (isWithin(e.target, ENTER_ACTIVATED_SELECTOR)) return;
  e.preventDefault();
  const idx = useUIStore.getState().keyboardSelectedIndex;
  const card = searchResults[Math.max(idx, 0)];
  if (card) { onAddCard(card); useUIStore.getState().resetKeyboardSelection(); }
}

/** Handle single-key shortcuts (slash, escape, arrows, enter) */
function handleSingleKeyShortcut(
  e: KeyboardEvent,
  searchResults: readonly ScryfallCard[],
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
      // A dialog that closed on this Escape already consumed it; acting again
      // would close the dialog underneath or clear the search.
      if (e.defaultPrevented) break;
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

/**
 * Register the deck builder's keyboard shortcuts on the window.
 *
 * Ctrl/Cmd shortcuts always work, except Ctrl/Cmd+Z in a text field, which
 * undoes the typing. Keys pressed without Ctrl/Cmd act only while the focus is
 * on the page rather than in a control that reads them, and only while the
 * player keeps single-key shortcuts on (WCAG 2.2 SC 2.1.4). Nothing fires
 * during an input method composition.
 * @param options - Search results, the add-card action and the input focus flag
 */
export function useKeyboardShortcuts({
  searchResults,
  onAddCard,
  isInputFocused = false,
}: UseKeyboardShortcutsOptions) {
  const undo = useDeckStore((s) => s.undo);
  const forceSave = useDeckStore((s) => s.forceSave);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Keys pressed while an input method composes text belong to that text.
      if (e.isComposing) return;
      const isMac = navigator.userAgent.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      const isTypingText = isInputFocused || isTextEntryTarget(e.target);
      if (handleModifierShortcut(e, modKey, isTypingText, undo, forceSave)) return;

      if (isInputFocused) return;
      if (isWithin(e.target, KEY_READING_CONTROL_SELECTOR)) return;
      const preferences = useShortcutPreferencesStore.getState();
      if (!preferences.singleKeyShortcutsEnabled) return;

      handleSingleKeyShortcut(e, searchResults, onAddCard);
    },
    [undo, forceSave, isInputFocused, searchResults, onAddCard]
  );

  useEffect(() => {
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
