/**
 * Keyboard Shortcuts — Centralized definitions and utilities
 * Pure functions. No DOM side effects here — handlers registered in hooks.
 */

// ─── Types ────────────────────────────────────────────────────────────────
export interface ShortcutDef {
  readonly id: string;
  readonly key: string; // e.g., "k", "z", "?"
  readonly ctrlKey?: boolean;
  readonly shiftKey?: boolean;
  readonly altKey?: boolean;
  readonly metaKey?: boolean;
  readonly description: string;
  readonly group?: string;
}

export interface ShortcutValidation {
  readonly valid: boolean;
  readonly warning?: string;
  readonly error?: string;
}

// ─── Browser-reserved shortcuts to warn about ─────────────────────────────
const BROWSER_RESERVED: string[] = [
  "ctrl+w", "ctrl+t", "ctrl+n", "ctrl+r", "ctrl+f5",
  "ctrl+shift+n", "ctrl+tab", "alt+f4", "ctrl+l",
];

// ─── Default shortcut definitions ─────────────────────────────────────────
export const DEFAULT_SHORTCUTS: readonly ShortcutDef[] = [
  { id: "search",        key: "k", ctrlKey: true,  description: "Focus search field",   group: "Navigation" },
  { id: "add-card",     key: "a", ctrlKey: true,  description: "Add selected card",      group: "Deck" },
  { id: "remove-card",  key: "d", ctrlKey: true,  description: "Remove selected card",   group: "Deck" },
  { id: "undo",         key: "z", ctrlKey: true,  description: "Undo last action",       group: "Edit" },
  { id: "redo",         key: "y", ctrlKey: true,  description: "Redo last action",       group: "Edit" },
  { id: "save",         key: "s", ctrlKey: true,  description: "Save deck",              group: "Deck" },
  { id: "export",       key: "e", ctrlKey: true,  description: "Export deck",            group: "Deck" },
  { id: "playtest",     key: "p", ctrlKey: true,  description: "Toggle playtest mode",   group: "Features" },
  { id: "theme-toggle", key: "t", ctrlKey: true,  description: "Toggle dark theme",      group: "UI" },
  { id: "focus-list",   key: "l", ctrlKey: true,  description: "Focus deck list",        group: "Navigation" },
  { id: "settings",     key: ",", ctrlKey: true,  description: "Open settings",          group: "UI" },
  { id: "shortcuts-help", key: "?",               description: "Show keyboard shortcuts", group: "UI" },
  { id: "nav-down",     key: "ArrowDown",         description: "Navigate down in list",  group: "Navigation" },
  { id: "nav-up",       key: "ArrowUp",           description: "Navigate up in list",    group: "Navigation" },
  { id: "select",       key: "Enter",             description: "Select focused card",    group: "Navigation" },
];

// ─── Utilities ────────────────────────────────────────────────────────────
/**
 * Format a shortcut definition into a human-readable label.
 * e.g., { key: "k", ctrlKey: true } → "Ctrl+K"
 */
export function getShortcutLabel(shortcut: ShortcutDef): string {
  const parts: string[] = [];
  if (shortcut.ctrlKey) parts.push("Ctrl");
  if (shortcut.shiftKey) parts.push("Shift");
  if (shortcut.altKey) parts.push("Alt");
  if (shortcut.metaKey) parts.push("Meta");
  parts.push(shortcut.key.toUpperCase());
  return parts.join("+");
}

/**
 * Check if an element is an input (should prevent shortcut from firing).
 */
export function isInputElement(el: Element): boolean {
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  // contenteditable elements
  return (el as HTMLElement).getAttribute?.("contenteditable") === "true";
}

/**
 * Check if a KeyboardEvent matches a ShortcutDef.
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutDef): boolean {
  return (
    event.key === shortcut.key &&
    (event.ctrlKey ?? false) === (shortcut.ctrlKey ?? false) &&
    (event.shiftKey ?? false) === (shortcut.shiftKey ?? false) &&
    (event.altKey ?? false) === (shortcut.altKey ?? false) &&
    (event.metaKey ?? false) === (shortcut.metaKey ?? false)
  );
}

/**
 * Validate a shortcut definition.
 * Returns a warning if it conflicts with browser-reserved shortcuts.
 */
export function validateShortcut(shortcut: ShortcutDef): ShortcutValidation {
  if (!shortcut.key || shortcut.key.trim().length === 0) {
    return { valid: false, error: "Key cannot be empty" };
  }

  const label = getShortcutLabel(shortcut).toLowerCase();
  if (BROWSER_RESERVED.includes(label)) {
    return {
      valid: true,
      warning: `"${label}" conflicts with a browser default. Use anyway or pick a different shortcut.`,
    };
  }

  return { valid: true };
}

/**
 * Get shortcuts grouped by category.
 */
export function groupShortcutsByCategory(
  shortcuts: readonly ShortcutDef[]
): Record<string, ShortcutDef[]> {
  const groups: Record<string, ShortcutDef[]> = {};
  for (const shortcut of shortcuts) {
    const group = shortcut.group ?? "Other";
    if (!groups[group]) groups[group] = [];
    groups[group].push(shortcut);
  }
  return groups;
}
