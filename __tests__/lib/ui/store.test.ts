import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/lib/ui/store";

// Reset store state between tests by calling the setters
function resetStore() {
  const s = useUIStore.getState();
  s.setShowKeyboardModal(false);
  s.setShowExportModal(false);
  s.setShowImportModal(false);
  s.resetKeyboardSelection();
}

describe("useUIStore", () => {
  beforeEach(() => {
    resetStore();
  });

  it("initialises with all modals closed and selection at -1", () => {
    const s = useUIStore.getState();
    expect(s.showKeyboardModal).toBe(false);
    expect(s.showExportModal).toBe(false);
    expect(s.showImportModal).toBe(false);
    expect(s.keyboardSelectedIndex).toBe(-1);
    expect(s.searchFocusSignal).toBeGreaterThanOrEqual(0);
  });

  it("opens and closes keyboard modal", () => {
    useUIStore.getState().setShowKeyboardModal(true);
    expect(useUIStore.getState().showKeyboardModal).toBe(true);

    useUIStore.getState().setShowKeyboardModal(false);
    expect(useUIStore.getState().showKeyboardModal).toBe(false);
  });

  it("opens and closes export modal", () => {
    useUIStore.getState().setShowExportModal(true);
    expect(useUIStore.getState().showExportModal).toBe(true);

    useUIStore.getState().setShowExportModal(false);
    expect(useUIStore.getState().showExportModal).toBe(false);
  });

  it("opens and closes import modal", () => {
    useUIStore.getState().setShowImportModal(true);
    expect(useUIStore.getState().showImportModal).toBe(true);

    useUIStore.getState().setShowImportModal(false);
    expect(useUIStore.getState().showImportModal).toBe(false);
  });

  it("manages keyboard selected index", () => {
    useUIStore.getState().setKeyboardSelectedIndex(3);
    expect(useUIStore.getState().keyboardSelectedIndex).toBe(3);

    useUIStore.getState().resetKeyboardSelection();
    expect(useUIStore.getState().keyboardSelectedIndex).toBe(-1);
  });

  it("increments searchFocusSignal on focusSearch()", () => {
    const before = useUIStore.getState().searchFocusSignal;
    useUIStore.getState().focusSearch();
    expect(useUIStore.getState().searchFocusSignal).toBe(before + 1);
    useUIStore.getState().focusSearch();
    expect(useUIStore.getState().searchFocusSignal).toBe(before + 2);
  });

  it("increments searchClearSignal and resets selection on clearSearch()", () => {
    useUIStore.getState().setKeyboardSelectedIndex(5);
    const before = useUIStore.getState().searchClearSignal;

    useUIStore.getState().clearSearch();

    expect(useUIStore.getState().searchClearSignal).toBe(before + 1);
    expect(useUIStore.getState().keyboardSelectedIndex).toBe(-1);
  });
});
