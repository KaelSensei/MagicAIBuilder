/**
 * Keyboard focus inside the zone menu of a search result, and out of it.
 *
 * Card catalog, search results. The arrow keys, Home and End move focus among
 * the menu's items; Tab moves it on to the tab stop after the menu's trigger.
 * `ZoneChoiceMenu` calls these on open and on a key.
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
    items.at(-1)?.focus();
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
 * Elements a browser may put in the tab order. Each one is still tried with
 * `focus()`, so a disabled, hidden or inert candidate is skipped, as the
 * browser's own Tab skips it.
 */
const TAB_STOP_CANDIDATES =
  "a[href], area[href], button, input, select, textarea, summary, iframe, [contenteditable='true'], [tabindex]";

/**
 * The document's tab stops in document order. It approximates the browser's
 * Tab order and differs from it where the browser applies its own rules:
 * - a positive `tabindex` is not moved to the front; the app sets none;
 * - in a radio group the browser stops only on the checked radio, this list
 *   on every radio;
 * - Safari's default setting skips buttons and links on Tab, this list
 *   does not.
 * Only buttons follow the zone menu's trigger today, so none of these differ
 * there; check them before reusing the helper elsewhere.
 *
 * @param root - The document to read
 * @returns The candidates whose `tabIndex` is not negative
 */
function tabStops(root: Document): readonly HTMLElement[] {
  const stops: HTMLElement[] = [];
  for (const node of root.querySelectorAll(TAB_STOP_CANDIDATES)) {
    if (node instanceof HTMLElement && node.tabIndex >= 0) stops.push(node);
  }
  return stops;
}

/**
 * Focuses the first tab stop after an element, as Tab from that element would.
 * The zone menu is drawn at the end of the document, so the browser's own Tab
 * from it would skip the rest of the results; for the keyboard, the menu sits
 * right after its trigger, and Tab moves on from there.
 *
 * @param anchor - The element Tab starts from; a tab stop itself, such as the
 *   menu's trigger button
 * @returns True when an element took focus; false when the anchor is not a tab
 *   stop or no element after it accepts focus
 */
export function focusTabStopAfter(anchor: HTMLElement): boolean {
  const stops = tabStops(anchor.ownerDocument);
  const start = stops.indexOf(anchor);
  if (start === -1) return false;
  for (const stop of stops.slice(start + 1)) {
    stop.focus();
    if (anchor.ownerDocument.activeElement === stop) return true;
  }
  return false;
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
