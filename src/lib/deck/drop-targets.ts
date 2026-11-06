import type { DeckZone } from "./types";

/** Droppable id of the editor surface. It follows the active zone for new cards. */
export const ACTIVE_SURFACE_ID = "deck-active-surface";

const DECK_ZONES: readonly DeckZone[] = ["main", "sideboard", "maybeboard"];
const ZONE_TAB_PREFIX = "deck-zone-tab-";
const ZONE_BODY_PREFIX = "deck-zone-";

/**
 * Checks whether a droppable suffix is one of the three deck zones.
 *
 * @param value - Raw id suffix
 * @returns True when the value is main, sideboard, or maybeboard
 */
export function isDeckZone(value: string): value is DeckZone {
  return DECK_ZONES.some((zone) => zone === value);
}

/**
 * Stable id for a zone tab. Tabs stay mounted, so they can accept a drop from any zone.
 *
 * @param zone - Destination zone
 * @returns Droppable id
 */
export function zoneTabId(zone: DeckZone): string {
  return `${ZONE_TAB_PREFIX}${zone}`;
}

/**
 * Id for the body of a secondary zone.
 *
 * @param zone - Sideboard or considering
 * @returns Droppable id
 */
export function zoneBodyId(zone: DeckZone): string {
  return `${ZONE_BODY_PREFIX}${zone}`;
}

function zoneFromPrefix(overId: string, prefix: string): DeckZone | null {
  if (!overId.startsWith(prefix)) return null;
  const zone = overId.slice(prefix.length);
  return isDeckZone(zone) ? zone : null;
}

/**
 * Zone a card already in the deck should move to.
 *
 * The active surface is not included: dropping on empty editor padding must not
 * steal a category reorder.
 *
 * @param overId - Droppable id under the pointer
 * @returns The destination zone, or null when the target is not a zone
 */
export function explicitDropZone(overId: string): DeckZone | null {
  return zoneFromPrefix(overId, ZONE_TAB_PREFIX) ?? zoneFromPrefix(overId, ZONE_BODY_PREFIX);
}

/**
 * Zone a searched card should join.
 *
 * @param overId - Droppable id under the pointer
 * @param activeZone - Zone currently open in the editor
 * @returns An explicit zone target, or the active zone
 */
export function searchDropZone(overId: string, activeZone: DeckZone): DeckZone {
  return explicitDropZone(overId) ?? activeZone;
}

/**
 * Orders overlapping droppables so the smallest target wins.
 *
 * A zone tab or category sits inside a larger surface. Preferring the smaller
 * rectangle keeps the highlight and the drop on the control the player is over.
 *
 * @param collisions - Droppables currently under the pointer
 * @param areaOf - Area of a droppable, in pixels
 * @returns The same collisions, smallest first
 */
export function preferSmallerDropTarget<T extends { readonly id: string | number }>(
  collisions: readonly T[],
  areaOf: (id: T["id"]) => number
): T[] {
  return [...collisions].sort((left, right) => areaOf(left.id) - areaOf(right.id));
}
