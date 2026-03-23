/**
 * Unit tests for useKeyboardShortcuts.
 *
 * Key constraints:
 * - Each test unmounts its hook so previous listeners don't leak into later tests.
 * - fireKey() is wrapped in act() so React flushes state and re-creates the
 *   handleKeyDown closure with fresh values (important for arrow navigation).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useUIStore } from "@/lib/ui/store";
import type { ScryfallCard } from "@/lib/scryfall/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCard(name: string, id = name): ScryfallCard {
  return {
    id,
    name,
    mana_cost: "{1}",
    cmc: 1,
    type_line: "Instant",
    oracle_text: "",
    color_identity: [],
    colors: [],
    legalities: {} as ScryfallCard["legalities"],
    set: "test",
    set_name: "Test Set",
    rarity: "common",
    prices: { usd: null, usd_foil: null, eur: null, tix: null },
    image_uris: { normal: "", large: "", art_crop: "" },
    card_faces: undefined,
    layout: "normal",
  };
}

/** Fire a key event wrapped in act() so React flushes all state updates */
function fireKey(key: string, options: Partial<KeyboardEventInit> = {}) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...options }));
  });
}

function resetUIStore() {
  act(() => {
    const s = useUIStore.getState();
    s.setShowKeyboardModal(false);
    s.setShowExportModal(false);
    s.setShowImportModal(false);
    s.resetKeyboardSelection();
  });
}

// ---------------------------------------------------------------------------
// Mock deck store undo / forceSave
// ---------------------------------------------------------------------------
const mockUndo = vi.fn().mockResolvedValue(undefined);
const mockForceSave = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/deck/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/deck/store")>();
  return {
    ...actual,
    useDeckStore: (selector: (s: unknown) => unknown) => {
      if (typeof selector === "function") {
        return selector({
          ...actual.useDeckStore.getState(),
          undo: mockUndo,
          forceSave: mockForceSave,
        });
      }
      return actual.useDeckStore(selector as Parameters<typeof actual.useDeckStore>[0]);
    },
  };
});

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const searchResults = [makeCard("Sol Ring"), makeCard("Arcane Signet"), makeCard("Cultivate")];
const onAddCard = vi.fn();

// Track unmounts so each test cleans up its own listener
const unmounts: Array<() => void> = [];

function mount(overrides: Partial<Parameters<typeof useKeyboardShortcuts>[0]> = {}) {
  const result = renderHook(() =>
    useKeyboardShortcuts({ searchResults, onAddCard, ...overrides })
  );
  unmounts.push(result.unmount);
  return result;
}

beforeEach(() => {
  resetUIStore();
  onAddCard.mockClear();
  mockUndo.mockClear();
  mockForceSave.mockClear();
});

afterEach(() => {
  // Unmount all hooks to remove event listeners
  let u: (() => void) | undefined;
  while ((u = unmounts.pop())) u();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useKeyboardShortcuts", () => {
  // -------------------------------------------------------------------------
  // "/" — focus search
  // -------------------------------------------------------------------------
  it("pressing '/' increments searchFocusSignal", () => {
    mount();
    const before = useUIStore.getState().searchFocusSignal;
    fireKey("/");
    expect(useUIStore.getState().searchFocusSignal).toBe(before + 1);
  });

  it("pressing '/' is suppressed when input is focused", () => {
    mount({ isInputFocused: true });
    const before = useUIStore.getState().searchFocusSignal;
    fireKey("/");
    expect(useUIStore.getState().searchFocusSignal).toBe(before);
  });

  // -------------------------------------------------------------------------
  // "?" — show keyboard modal
  // -------------------------------------------------------------------------
  it("pressing '?' opens the keyboard shortcuts modal", () => {
    mount();
    fireKey("?");
    expect(useUIStore.getState().showKeyboardModal).toBe(true);
  });

  it("pressing '?' is suppressed when input is focused", () => {
    mount({ isInputFocused: true });
    fireKey("?");
    expect(useUIStore.getState().showKeyboardModal).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Escape — close modals / clear search
  // -------------------------------------------------------------------------
  it("Escape closes keyboard modal when it is open", () => {
    mount();
    act(() => { useUIStore.getState().setShowKeyboardModal(true); });
    fireKey("Escape");
    expect(useUIStore.getState().showKeyboardModal).toBe(false);
  });

  it("Escape closes export modal when it is open and keyboard modal is not", () => {
    mount();
    act(() => { useUIStore.getState().setShowExportModal(true); });
    fireKey("Escape");
    expect(useUIStore.getState().showExportModal).toBe(false);
  });

  it("Escape clears search when no modal is open", () => {
    mount();
    const before = useUIStore.getState().searchClearSignal;
    fireKey("Escape");
    expect(useUIStore.getState().searchClearSignal).toBe(before + 1);
  });

  // -------------------------------------------------------------------------
  // Arrow keys — navigation
  // -------------------------------------------------------------------------
  it("ArrowDown moves selection from -1 to 0", () => {
    mount();
    expect(useUIStore.getState().keyboardSelectedIndex).toBe(-1);
    fireKey("ArrowDown");
    expect(useUIStore.getState().keyboardSelectedIndex).toBe(0);
  });

  it("ArrowDown advances selection on successive presses", () => {
    mount();
    fireKey("ArrowDown"); // -1 → 0
    expect(useUIStore.getState().keyboardSelectedIndex).toBe(0);
    fireKey("ArrowDown"); // 0 → 1
    expect(useUIStore.getState().keyboardSelectedIndex).toBe(1);
  });

  it("ArrowDown is clamped at last result index", () => {
    mount();
    // Advance to max index
    act(() => { useUIStore.getState().setKeyboardSelectedIndex(2); });
    fireKey("ArrowDown");
    expect(useUIStore.getState().keyboardSelectedIndex).toBe(2); // still 2
  });

  it("ArrowUp decrements from 2 to 1", () => {
    mount();
    act(() => { useUIStore.getState().setKeyboardSelectedIndex(2); });
    fireKey("ArrowUp");
    expect(useUIStore.getState().keyboardSelectedIndex).toBe(1);
  });

  it("ArrowUp is clamped at 0", () => {
    mount();
    act(() => { useUIStore.getState().setKeyboardSelectedIndex(0); });
    fireKey("ArrowUp");
    expect(useUIStore.getState().keyboardSelectedIndex).toBe(0);
  });

  it("arrow keys do nothing when there are no search results", () => {
    renderHook(() => useKeyboardShortcuts({ searchResults: [], onAddCard }));
    fireKey("ArrowDown");
    fireKey("ArrowUp");
    expect(useUIStore.getState().keyboardSelectedIndex).toBe(-1);
  });

  // -------------------------------------------------------------------------
  // Enter — add card
  // -------------------------------------------------------------------------
  it("Enter adds the first card when no selection", () => {
    mount();
    fireKey("Enter");
    expect(onAddCard).toHaveBeenCalledTimes(1);
    expect(onAddCard).toHaveBeenCalledWith(searchResults[0]);
  });

  it("Enter adds the keyboard-selected card", () => {
    mount();
    act(() => { useUIStore.getState().setKeyboardSelectedIndex(2); });
    fireKey("Enter");
    expect(onAddCard).toHaveBeenCalledWith(searchResults[2]);
  });

  it("Enter resets keyboard selection after adding", () => {
    mount();
    act(() => { useUIStore.getState().setKeyboardSelectedIndex(1); });
    fireKey("Enter");
    expect(useUIStore.getState().keyboardSelectedIndex).toBe(-1);
  });

  it("Enter does nothing when no search results", () => {
    renderHook(() => useKeyboardShortcuts({ searchResults: [], onAddCard }));
    fireKey("Enter");
    expect(onAddCard).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Modifier shortcuts — always active (even when input is focused)
  // -------------------------------------------------------------------------
  it("Ctrl+Z calls undo() even when input is focused", () => {
    mount({ isInputFocused: true });
    fireKey("z", { ctrlKey: true });
    expect(mockUndo).toHaveBeenCalledTimes(1);
  });

  it("Ctrl+S calls forceSave() even when input is focused", () => {
    mount({ isInputFocused: true });
    fireKey("s", { ctrlKey: true });
    expect(mockForceSave).toHaveBeenCalledTimes(1);
  });

  it("Ctrl+E opens export modal even when input is focused", () => {
    mount({ isInputFocused: true });
    fireKey("e", { ctrlKey: true });
    expect(useUIStore.getState().showExportModal).toBe(true);
  });

  it("Ctrl+I opens import modal even when input is focused", () => {
    mount({ isInputFocused: true });
    fireKey("i", { ctrlKey: true });
    expect(useUIStore.getState().showImportModal).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Cleanup — listener is removed on unmount
  // -------------------------------------------------------------------------
  it("removes event listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({ searchResults, onAddCard })
    );
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
});
