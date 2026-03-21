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

export function useKeyboardShortcuts({
  searchResults,
  onAddCard,
  isInputFocused = false,
}: UseKeyboardShortcutsOptions) {
  const undo = useDeckStore((s) => s.undo);
  const forceSave = useDeckStore((s) => s.forceSave);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isEditable =
        tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable;

      // ----------------------------------------------------------------
      // Modifier shortcuts — always active, regardless of focus
      // ----------------------------------------------------------------
      if (modKey && e.key === "z") {
        e.preventDefault();
        undo();
        return;
      }

      if (modKey && e.key === "s") {
        e.preventDefault();
        forceSave();
        return;
      }

      if (modKey && e.key === "e") {
        e.preventDefault();
        useUIStore.getState().setShowExportModal(true);
        return;
      }

      if (modKey && e.key === "i") {
        e.preventDefault();
        useUIStore.getState().setShowImportModal(true);
        return;
      }

      // ----------------------------------------------------------------
      // Single-key shortcuts — suppressed when a text field is focused
      // ----------------------------------------------------------------
      if (isEditable || isInputFocused) return;

      switch (e.key) {
        case "/": {
          e.preventDefault();
          useUIStore.getState().focusSearch();
          break;
        }

        case "?": {
          e.preventDefault();
          useUIStore.getState().setShowKeyboardModal(true);
          break;
        }

        case "Escape": {
          // Close modals in priority order; if none open, clear search
          const ui = useUIStore.getState();
          if (ui.showKeyboardModal) {
            ui.setShowKeyboardModal(false);
          } else if (ui.showExportModal) {
            ui.setShowExportModal(false);
          } else if (ui.showImportModal) {
            ui.setShowImportModal(false);
          } else {
            ui.clearSearch();
          }
          break;
        }

        case "ArrowDown": {
          if (searchResults.length === 0) break;
          e.preventDefault();
          // Read current index directly from store — avoids stale closure
          const curDown = useUIStore.getState().keyboardSelectedIndex;
          useUIStore
            .getState()
            .setKeyboardSelectedIndex(Math.min(curDown + 1, searchResults.length - 1));
          break;
        }

        case "ArrowUp": {
          if (searchResults.length === 0) break;
          e.preventDefault();
          const curUp = useUIStore.getState().keyboardSelectedIndex;
          useUIStore
            .getState()
            .setKeyboardSelectedIndex(Math.max(curUp - 1, 0));
          break;
        }

        case "Enter": {
          if (searchResults.length === 0) break;
          e.preventDefault();
          const idx = useUIStore.getState().keyboardSelectedIndex;
          const card = searchResults[idx >= 0 ? idx : 0];
          if (card) {
            onAddCard(card);
            useUIStore.getState().resetKeyboardSelection();
          }
          break;
        }

        default:
          break;
      }
    },
    [undo, forceSave, isInputFocused, searchResults, onAddCard]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
