import { describe, it, expect } from "vitest";
import {
  DEFAULT_SHORTCUTS,
  getShortcutLabel,
  isInputElement,
  matchesShortcut,
  validateShortcut,
  type ShortcutDef,
} from "./shortcuts";

// ─── Shortcut definitions ──────────────────────────────────────────────────
describe("DEFAULT_SHORTCUTS", () => {
  it("contains Ctrl+K for search", () => {
    const shortcut = DEFAULT_SHORTCUTS.find((s) => s.id === "search");
    expect(shortcut).toBeDefined();
    expect(shortcut?.key).toBe("k");
    expect(shortcut?.ctrlKey).toBe(true);
  });

  it("contains Ctrl+Z for undo", () => {
    const shortcut = DEFAULT_SHORTCUTS.find((s) => s.id === "undo");
    expect(shortcut).toBeDefined();
    expect(shortcut?.key).toBe("z");
    expect(shortcut?.ctrlKey).toBe(true);
  });

  it("contains ? for shortcuts modal", () => {
    const shortcut = DEFAULT_SHORTCUTS.find((s) => s.id === "shortcuts-help");
    expect(shortcut).toBeDefined();
    expect(shortcut?.key).toBe("?");
  });

  it("has unique ids for all shortcuts", () => {
    const ids = DEFAULT_SHORTCUTS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ─── Shortcut label ────────────────────────────────────────────────────────
describe("getShortcutLabel", () => {
  it("formats Ctrl+K correctly", () => {
    const shortcut: ShortcutDef = { id: "search", key: "k", ctrlKey: true, description: "Search" };
    expect(getShortcutLabel(shortcut)).toBe("Ctrl+K");
  });

  it("formats Shift+? correctly", () => {
    const shortcut: ShortcutDef = { id: "help", key: "?", shiftKey: true, description: "Help" };
    expect(getShortcutLabel(shortcut)).toBe("Shift+?");
  });

  it("formats single key correctly", () => {
    const shortcut: ShortcutDef = { id: "single", key: "?", description: "Help" };
    expect(getShortcutLabel(shortcut)).toBe("?");
  });

  it("formats Ctrl+Shift combination", () => {
    const shortcut: ShortcutDef = { id: "combo", key: "s", ctrlKey: true, shiftKey: true, description: "Save" };
    expect(getShortcutLabel(shortcut)).toBe("Ctrl+Shift+S");
  });
});

// ─── isInputElement ────────────────────────────────────────────────────────
describe("isInputElement", () => {
  it("returns true for INPUT element", () => {
    const input = { tagName: "INPUT" } as Element;
    expect(isInputElement(input)).toBe(true);
  });

  it("returns true for TEXTAREA element", () => {
    const textarea = { tagName: "TEXTAREA" } as Element;
    expect(isInputElement(textarea)).toBe(true);
  });

  it("returns false for DIV element", () => {
    const div = { tagName: "DIV" } as Element;
    expect(isInputElement(div)).toBe(false);
  });

  it("returns true for contenteditable element", () => {
    const el = {
      tagName: "DIV",
      getAttribute: (attr: string) => attr === "contenteditable" ? "true" : null,
    } as unknown as Element;
    expect(isInputElement(el)).toBe(true);
  });
});

// ─── matchesShortcut ───────────────────────────────────────────────────────
describe("matchesShortcut", () => {
  it("matches Ctrl+K event to search shortcut", () => {
    const shortcut: ShortcutDef = { id: "search", key: "k", ctrlKey: true, description: "Search" };
    const event = { key: "k", ctrlKey: true, shiftKey: false, altKey: false, metaKey: false } as KeyboardEvent;
    expect(matchesShortcut(event, shortcut)).toBe(true);
  });

  it("does not match when ctrlKey differs", () => {
    const shortcut: ShortcutDef = { id: "search", key: "k", ctrlKey: true, description: "Search" };
    const event = { key: "k", ctrlKey: false, shiftKey: false, altKey: false, metaKey: false } as KeyboardEvent;
    expect(matchesShortcut(event, shortcut)).toBe(false);
  });

  it("matches ? shortcut (no modifier)", () => {
    const shortcut: ShortcutDef = { id: "help", key: "?", description: "Help" };
    const event = { key: "?", ctrlKey: false, shiftKey: false, altKey: false, metaKey: false } as KeyboardEvent;
    expect(matchesShortcut(event, shortcut)).toBe(true);
  });
});

// ─── validateShortcut ─────────────────────────────────────────────────────
describe("validateShortcut", () => {
  it("returns valid for safe shortcut", () => {
    const result = validateShortcut({ id: "custom", key: "m", ctrlKey: true, description: "My action" });
    expect(result.valid).toBe(true);
  });

  it("warns about browser-reserved shortcuts", () => {
    // Ctrl+W closes browser tab — should warn
    const result = validateShortcut({ id: "close", key: "w", ctrlKey: true, description: "Close" });
    expect(result.warning).toBeDefined();
  });

  it("returns invalid for empty key", () => {
    const result = validateShortcut({ id: "empty", key: "", description: "Empty" });
    expect(result.valid).toBe(false);
  });
});
