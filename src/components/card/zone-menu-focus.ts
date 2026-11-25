/**
 * Keyboard focus inside the zone menu of a search result.
 *
 * Card catalog, search results. The arrow keys, Home and End move focus among
 * the menu's items; `ZoneChoiceMenu` calls these on open and on a key.
 *
 * Not responsible for: placing the menu or closing it. Those stay in the
 * component.
 *
 * @module card/zone-menu-focus
 */
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

/** Which zone receives focus when the menu opens. */
export type ZoneMenuInitialFocus = "first" | "last";

/**
 * The menu item buttons inside a root, in DOM order.
 *
 * @param root - The menu element, or null before it mounts
 * @returns The item elements
 */
export function menuItems(root: HTMLElement | null): readonly HTMLElement[] {
  if (!root) return [];
  const items: HTMLElement[] = [];
  for (const node of root.querySelectorAll("[role='menuitem']")) {
    if (node instanceof HTMLElement) items.push(node);
  }
  return items;
}

/**
 * Moves focus among the menu items, wrapping at both ends. When no item has
 * focus (a press on the menu's edge focused the menu itself), the arrow down
 * enters at the first item and the arrow up at the last, as the WAI-ARIA menu
 * pattern does (https://www.w3.org/WAI/ARIA/apg/patterns/menubar/, read 2026-11-25).
 *
 * @param items - The menu items, in order
 * @param direction - The next item, or an end of the list
 */
export function moveZoneFocus(
  items: readonly HTMLElement[],
  direction: 1 | -1 | ZoneMenuInitialFocus
): void {
  if (items.length === 0) return;
  if (direction === "first") {
    items[0]?.focus();
    return;
  }
  if (direction === "last") {
    items[items.length - 1]?.focus();
    return;
  }
  const active = document.activeElement;
  const current = active instanceof HTMLElement ? items.indexOf(active) : -1;
  if (current === -1) {
    moveZoneFocus(items, direction === 1 ? "first" : "last");
    return;
  }
  const next = (current + direction + items.length) % items.length;
  items[next]?.focus();
}

/**
 * The arrow, Home or End key as a focus move, or null for every other key.
 *
 * @param key - `KeyboardEvent.key`
 * @returns The move, or null when the menu leaves the key alone
 */
function zoneMenuDirection(key: string): 1 | -1 | ZoneMenuInitialFocus | null {
  switch (key) {
    case "ArrowDown":
      return 1;
    case "ArrowUp":
      return -1;
    case "Home":
      return "first";
    case "End":
      return "last";
    default:
      return null;
  }
}

/**
 * Arrow keys, Home and End move through the zones. Enter is left to the
 * focused item, which is a button.
 *
 * @param event - The key event bubbling from a menu item
 * @param menu - The menu element
 */
export function onZoneMenuKeyDown(
  event: ReactKeyboardEvent<HTMLDivElement>,
  menu: HTMLElement | null
): void {
  const direction = zoneMenuDirection(event.key);
  if (direction === null) return;
  event.preventDefault();
  event.stopPropagation();
  moveZoneFocus(menuItems(menu), direction);
}
