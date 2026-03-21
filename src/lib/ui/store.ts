"use client";
// UI state store — modals, keyboard navigation, focus signals
import { create } from "zustand";

export interface UIStore {
  // Keyboard shortcuts modal
  showKeyboardModal: boolean;
  setShowKeyboardModal: (v: boolean) => void;

  // Export modal (lifted from builder page)
  showExportModal: boolean;
  setShowExportModal: (v: boolean) => void;

  // Import modal (lifted from builder page)
  showImportModal: boolean;
  setShowImportModal: (v: boolean) => void;

  // Keyboard navigation in search results
  keyboardSelectedIndex: number;
  setKeyboardSelectedIndex: (i: number) => void;
  resetKeyboardSelection: () => void;

  // Focus signal for search bar — increment to trigger focus
  searchFocusSignal: number;
  focusSearch: () => void;

  // Clear search signal — increment to trigger clear
  searchClearSignal: number;
  clearSearch: () => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  showKeyboardModal: false,
  setShowKeyboardModal: (v) => set({ showKeyboardModal: v }),

  showExportModal: false,
  setShowExportModal: (v) => set({ showExportModal: v }),

  showImportModal: false,
  setShowImportModal: (v) => set({ showImportModal: v }),

  keyboardSelectedIndex: -1,
  setKeyboardSelectedIndex: (i) => set({ keyboardSelectedIndex: i }),
  resetKeyboardSelection: () => set({ keyboardSelectedIndex: -1 }),

  searchFocusSignal: 0,
  focusSearch: () => set((s) => ({ searchFocusSignal: s.searchFocusSignal + 1 })),

  searchClearSignal: 0,
  clearSearch: () =>
    set((s) => ({
      searchClearSignal: s.searchClearSignal + 1,
      keyboardSelectedIndex: -1,
    })),
}));
