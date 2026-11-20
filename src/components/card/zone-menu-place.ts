/**
 * Where the search-result zone menu sits, in viewport coordinates.
 *
 * Card catalog, search results. The menu is portaled out of the result grid,
 * whose overflow would otherwise clip it. The grid calls this with the
 * trigger's border box and the menu's measured size.
 *
 * Not responsible for: reading the DOM. The caller measures and this function
 * only decides the corner.
 *
 * @module card/zone-menu-place
 */

/** Space between the trigger and the menu, in CSS pixels. */
const MENU_GAP_PX = 4;

/** Closest the menu may sit to a viewport edge, in CSS pixels. */
const MENU_MARGIN_PX = 8;

/** The trigger's border box, in viewport coordinates. */
export interface ZoneMenuAnchor {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

/** The visual viewport the menu must stay inside. */
export interface ZoneMenuViewport {
  readonly width: number;
  readonly height: number;
}

/** The menu's border box. */
export interface ZoneMenuSize {
  readonly width: number;
  readonly height: number;
}

/** A menu's `top` and `left`, in viewport coordinates. */
export interface ZoneMenuPosition {
  readonly top: number;
  readonly left: number;
}

/**
 * Places the menu under the trigger, flipping above it when the viewport
 * cannot hold it there, and shifting it so the right edge stays on screen.
 *
 * @param anchor - The trigger's border box
 * @param viewport - The visual viewport
 * @param menu - The menu's border box
 * @returns The menu's top and left
 */
export function placeZoneMenu(
  anchor: ZoneMenuAnchor,
  viewport: ZoneMenuViewport,
  menu: ZoneMenuSize
): ZoneMenuPosition {
  const below = anchor.bottom + MENU_GAP_PX;
  const above = anchor.top - MENU_GAP_PX - menu.height;
  const fitsBelow = below + menu.height <= viewport.height - MENU_MARGIN_PX;
  const top = fitsBelow || above < MENU_MARGIN_PX ? below : above;

  const maxLeft = Math.max(MENU_MARGIN_PX, viewport.width - MENU_MARGIN_PX - menu.width);
  const preferred = anchor.right - menu.width;
  const left = Math.min(Math.max(preferred, MENU_MARGIN_PX), maxLeft);
  return { top, left };
}
