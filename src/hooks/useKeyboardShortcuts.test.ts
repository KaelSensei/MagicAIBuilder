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
import { useShortcutPreferencesStore } from "@/lib/ui/shortcut-preferences";
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
    prices: { usd: null, usd_foil: null, eur: null },
    image_uris: { normal: "", large: "", art_crop: "" },
    card_faces: undefined,
  };
}

/** Fire a key event wrapped in act() so React flushes all state updates */
function fireKey(key: string, options: Partial<KeyboardEventInit> = {}) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...options }));
  });
}

/** Fields attached to the document by a test, removed again after it. */
const attachedFields: HTMLElement[] = [];

/**
 * Focus a real field and press a key inside it, as a player would. The event
 * bubbles from the field to the window listener and stays cancelable, so the
 * test can tell whether the hook took the key away from the field.
 */
function pressInside(field: HTMLElement, key: string, options: Partial<KeyboardEventInit> = {}) {
  if (!field.isConnected) {
    document.body.append(field);
    attachedFields.push(field);
  }
  field.focus();
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...options });
  act(() => {
    field.dispatchEvent(event);
  });
  return event;
}

/**
 * Press a key with the focus on the page itself rather than in any control,
 * the one place where single-key shortcuts act.
 */
function pressOnPage(key: string, options: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  act(() => {
    document.body.dispatchEvent(event);
  });
  return event;
}

/** A focusable element carrying an ARIA widget role, such as a combobox. */
function makeWidget(role: string): HTMLElement {
  const widget = document.createElement("div");
  widget.setAttribute("role", role);
  widget.tabIndex = 0;
  return widget;
}

/**
 * A focusable item inside an ARIA composite widget, such as an option in a
 * listbox. The widget is attached to the document; the item is returned.
 */
function makeItemInside(widgetRole: string, itemRole: string): HTMLElement {
  const widget = document.createElement("div");
  widget.setAttribute("role", widgetRole);
  const item = document.createElement("button");
  item.setAttribute("role", itemRole);
  widget.append(item);
  document.body.append(widget);
  attachedFields.push(widget);
  return item;
}

function makeEditableContent(): HTMLElement {
  const editable = document.createElement("div");
  editable.setAttribute("contenteditable", "true");
  editable.tabIndex = 0;
  return editable;
}

function makeLink(): HTMLAnchorElement {
  const link = document.createElement("a");
  link.href = "/decks";
  return link;
}

function makeInput(type: string): HTMLInputElement {
  const input = document.createElement("input");
  input.type = type;
  return input;
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
  act(() => {
    useShortcutPreferencesStore.getState().setSingleKeyShortcutsEnabled(true);
  });
  onAddCard.mockClear();
  mockUndo.mockClear();
  mockForceSave.mockClear();
});

afterEach(() => {
  // Unmount all hooks to remove event listeners
  let u: (() => void) | undefined;
  while ((u = unmounts.pop())) u();
  let field: HTMLElement | undefined;
  while ((field = attachedFields.pop())) field.remove();
  vi.restoreAllMocks();
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

  it.each([
    ["a textarea", () => document.createElement("textarea")],
    ["a text input", () => makeInput("text")],
    ["a checkbox", () => makeInput("checkbox")],
  ])("pressing '/' inside %s is left to the field", (_label, makeField) => {
    mount();
    const before = useUIStore.getState().searchFocusSignal;
    const event = pressInside(makeField(), "/");
    expect(useUIStore.getState().searchFocusSignal).toBe(before);
    expect(event.defaultPrevented).toBe(false);
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
  // Ctrl/Cmd+Z — deck undo outside text fields, the field's own undo inside
  // -------------------------------------------------------------------------
  describe("Ctrl/Cmd+Z", () => {
    it("undoes the last deck change when pressed outside a text field", () => {
      mount();
      const event = pressInside(document.createElement("button"), "z", { ctrlKey: true });
      expect(mockUndo).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it("leaves Ctrl+Z to a focused textarea so a card note keeps its own undo", () => {
      mount();
      const event = pressInside(document.createElement("textarea"), "z", { ctrlKey: true });
      expect(mockUndo).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it.each(["text", "search", "number"])("leaves Ctrl+Z to a focused %s input", (type) => {
      mount();
      const event = pressInside(makeInput(type), "z", { ctrlKey: true });
      expect(mockUndo).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it("leaves Cmd+Z to a focused textarea on macOS", () => {
      vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)"
      );
      mount();
      const event = pressInside(document.createElement("textarea"), "z", { metaKey: true });
      expect(mockUndo).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it("leaves Ctrl+Z to the field when the editor reports a focused input", () => {
      mount({ isInputFocused: true });
      fireKey("z", { ctrlKey: true });
      expect(mockUndo).not.toHaveBeenCalled();
    });

    it("still undoes the deck change from a focused checkbox, which has no text to undo", () => {
      mount();
      const event = pressInside(makeInput("checkbox"), "z", { ctrlKey: true });
      expect(mockUndo).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Other modifier shortcuts — active even when input is focused
  // -------------------------------------------------------------------------
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
  // Single-key shortcuts setting — the off switch WCAG 2.2 SC 2.1.4 asks for
  // -------------------------------------------------------------------------
  describe("when single-key shortcuts are turned off", () => {
    beforeEach(() => {
      act(() => {
        useShortcutPreferencesStore
          .getState()
          .setSingleKeyShortcutsEnabled(false);
      });
    });

    it.each(["/", "?", "Escape", "ArrowDown", "ArrowUp", "Enter"])(
      "leaves '%s' to the page instead of acting on the editor",
      (key) => {
        mount();
        const before = useUIStore.getState();
        const event = pressOnPage(key);
        const after = useUIStore.getState();
        expect(event.defaultPrevented).toBe(false);
        expect(after.searchFocusSignal).toBe(before.searchFocusSignal);
        expect(after.searchClearSignal).toBe(before.searchClearSignal);
        expect(after.showKeyboardModal).toBe(false);
        expect(after.keyboardSelectedIndex).toBe(-1);
        expect(onAddCard).not.toHaveBeenCalled();
      }
    );

    it("keeps the Ctrl/Cmd shortcuts working", () => {
      mount();
      pressOnPage("z", { ctrlKey: true });
      pressOnPage("s", { ctrlKey: true });
      pressOnPage("e", { ctrlKey: true });
      pressOnPage("i", { ctrlKey: true });
      expect(mockUndo).toHaveBeenCalledTimes(1);
      expect(mockForceSave).toHaveBeenCalledTimes(1);
      expect(useUIStore.getState().showExportModal).toBe(true);
      expect(useUIStore.getState().showImportModal).toBe(true);
    });

    it("brings them back as soon as they are turned on again, without a reload", () => {
      mount();
      const before = useUIStore.getState().searchFocusSignal;
      pressOnPage("/");
      act(() => {
        useShortcutPreferencesStore
          .getState()
          .setSingleKeyShortcutsEnabled(true);
      });
      pressOnPage("/");
      expect(useUIStore.getState().searchFocusSignal).toBe(before + 1);
    });
  });

  // -------------------------------------------------------------------------
  // Typing guards — a focused control keeps the keys it reads itself
  // -------------------------------------------------------------------------
  describe("typing guards", () => {
    it.each([
      ["a select", () => document.createElement("select")],
      ["editable content", makeEditableContent],
      ["a combobox", () => makeWidget("combobox")],
      ["an option in a listbox", () => makeItemInside("listbox", "option")],
      ["an item in a menu", () => makeItemInside("menu", "menuitem")],
    ])("leaves every key without Ctrl/Cmd to %s", (_label, makeControl) => {
      mount();
      const control = makeControl();
      const before = useUIStore.getState();
      const events = ["/", "?", "Escape", "ArrowDown", "ArrowUp", "Enter"].map(
        (key) => pressInside(control, key)
      );
      const after = useUIStore.getState();
      expect(events.filter((event) => event.defaultPrevented)).toEqual([]);
      expect(after.searchFocusSignal).toBe(before.searchFocusSignal);
      expect(after.searchClearSignal).toBe(before.searchClearSignal);
      expect(after.showKeyboardModal).toBe(false);
      expect(after.keyboardSelectedIndex).toBe(-1);
      expect(onAddCard).not.toHaveBeenCalled();
    });

    it("leaves Ctrl+Z to editable content, which keeps its own undo", () => {
      mount();
      const event = pressInside(makeEditableContent(), "z", { ctrlKey: true });
      expect(mockUndo).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it.each([
      ["button", () => document.createElement("button")],
      ["link", makeLink],
    ])(
      "lets Enter activate a focused %s instead of adding a search result",
      (_label, makeControl) => {
        mount();
        const event = pressInside(makeControl(), "Enter");
        expect(onAddCard).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
      }
    );

    it("still focuses the search with '/' from a focused button", () => {
      mount();
      const before = useUIStore.getState().searchFocusSignal;
      pressInside(document.createElement("button"), "/");
      expect(useUIStore.getState().searchFocusSignal).toBe(before + 1);
    });

    it("leaves Ctrl+I to the input method while a composition is in progress", () => {
      // Microsoft's Japanese IME converts the text being composed to katakana
      // with Ctrl+I; the import dialog must not open over it.
      mount();
      const event = pressInside(makeInput("text"), "i", {
        ctrlKey: true,
        isComposing: true,
      });
      expect(useUIStore.getState().showImportModal).toBe(false);
      expect(event.defaultPrevented).toBe(false);
    });

    it("leaves Enter to the input method while a composition is in progress", () => {
      // Enter confirms the composed text; it must not add a search result.
      mount();
      const event = pressOnPage("Enter", { isComposing: true });
      expect(onAddCard).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });
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
