"use client";
/**
 * The portaled zone menu of a search result: main deck, sideboard, considering.
 *
 * Card catalog, search results. Rendered on `document.body` so the result
 * grid's overflow cannot clip it. Arrow keys move between the zones, Enter
 * picks the focused one, and Escape closes the menu.
 *
 * Not responsible for: the primary "add to the main deck" button. That sits
 * on {@link SearchZoneMenu}.
 *
 * @module card/ZoneChoiceMenu
 */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { DeckZone } from "@/lib/deck/types";
import { placeZoneMenu } from "@/components/card/zone-menu-place";

/** Zones a search result can join, in the order the menu reads them. */
const MENU_ZONES: readonly DeckZone[] = ["main", "sideboard", "maybeboard"];

/** Which zone receives focus when the menu opens. */
export type ZoneMenuInitialFocus = "first" | "last";

interface ZoneChoiceMenuProps {
  readonly id: string;
  readonly cardName: string;
  /** Copies already in each zone. Absent, the menu names the zones only. */
  readonly zoneCounts?: Readonly<Record<DeckZone, number>>;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
  readonly initialFocus: ZoneMenuInitialFocus;
  readonly onChoose: (zone: DeckZone) => void;
  readonly onClose: () => void;
}

/**
 * The catalogue key of a zone's short name.
 *
 * @param zone - A deck zone
 * @returns The `card` message key for that zone
 */
function zoneNameKey(zone: DeckZone): "zoneMain" | "zoneSideboard" | "zoneConsidering" {
  switch (zone) {
    case "main":
      return "zoneMain";
    case "sideboard":
      return "zoneSideboard";
    case "maybeboard":
      return "zoneConsidering";
  }
  const _exhaustive: never = zone;
  return _exhaustive;
}

/**
 * The catalogue key of "add this card to this zone" when no count is shown.
 *
 * @param zone - A deck zone
 * @returns The `card` message key for that action
 */
function zoneActionKey(zone: DeckZone): "addToMain" | "addToSideboard" | "addToConsidering" {
  switch (zone) {
    case "main":
      return "addToMain";
    case "sideboard":
      return "addToSideboard";
    case "maybeboard":
      return "addToConsidering";
  }
  const _exhaustive: never = zone;
  return _exhaustive;
}

/**
 * The menu item buttons inside a root, in DOM order.
 *
 * @param root - The menu element, or null before it mounts
 * @returns The item elements
 */
function menuItems(root: HTMLElement | null): readonly HTMLElement[] {
  if (!root) return [];
  const items: HTMLElement[] = [];
  for (const node of root.querySelectorAll("[role='menuitem']")) {
    if (node instanceof HTMLElement) items.push(node);
  }
  return items;
}

/**
 * Moves focus among the menu items, wrapping at both ends.
 *
 * @param items - The menu items, in order
 * @param direction - The next item, or an end of the list
 */
function moveZoneFocus(
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
  const start = current === -1 ? 0 : current;
  const next = (start + direction + items.length) % items.length;
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
function onZoneMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>, menu: HTMLElement | null): void {
  const direction = zoneMenuDirection(event.key);
  if (direction === null) return;
  event.preventDefault();
  event.stopPropagation();
  moveZoneFocus(menuItems(menu), direction);
}

/** Positions the menu and focuses its first or last zone. */
function usePlaceZoneMenu(
  menuRef: RefObject<HTMLDivElement | null>,
  triggerRef: RefObject<HTMLButtonElement | null>,
  initialFocus: ZoneMenuInitialFocus
): void {
  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    const position = placeZoneMenu(
      { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
      { width: window.innerWidth, height: window.innerHeight },
      { width: menu.offsetWidth, height: menu.offsetHeight }
    );
    menu.style.top = `${position.top}px`;
    menu.style.left = `${position.left}px`;
    moveZoneFocus(menuItems(menu), initialFocus);
  }, [initialFocus, menuRef, triggerRef]);
}

/** Escape and a pointer press outside the menu or its trigger close it. */
function useDismissZoneMenu(
  menuRef: RefObject<HTMLDivElement | null>,
  triggerRef: RefObject<HTMLButtonElement | null>,
  onClose: () => void
): void {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuRef, onClose, triggerRef]);
}

interface ZoneMenuItemsProps {
  readonly cardName: string;
  readonly zoneCounts?: Readonly<Record<DeckZone, number>>;
  readonly onChoose: (zone: DeckZone) => void;
}

/** One button per zone, named for a screen reader with the copy count when known. */
function ZoneMenuItems({ cardName, zoneCounts, onChoose }: ZoneMenuItemsProps) {
  const t = useTranslations("card");
  return MENU_ZONES.map((zone) => {
    const zoneName = t(zoneNameKey(zone));
    const count = zoneCounts?.[zone];
    const label =
      count === undefined
        ? t(zoneActionKey(zone), { name: cardName })
        : t("addToZoneCount", { name: cardName, zone: zoneName, count });
    const visible = count === undefined ? zoneName : t("zoneWithCount", { zone: zoneName, count });
    return (
      <button
        key={zone}
        type="button"
        role="menuitem"
        className="flex w-full items-center rounded-[var(--lumen-radius-md)] px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--accent-soft)] focus-visible:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        aria-label={label}
        onClick={() => onChoose(zone)}
      >
        {visible}
      </button>
    );
  });
}

/**
 * The zone menu, portaled to `document.body`.
 *
 * @param props - The card, the counts, and how the menu closes
 * @returns The menu
 */
export function ZoneChoiceMenu({
  id,
  cardName,
  zoneCounts,
  triggerRef,
  initialFocus,
  onChoose,
  onClose,
}: ZoneChoiceMenuProps) {
  const t = useTranslations("card");
  const menuRef = useRef<HTMLDivElement>(null);
  usePlaceZoneMenu(menuRef, triggerRef, initialFocus);
  useDismissZoneMenu(menuRef, triggerRef, onClose);

  return createPortal(
    <div
      ref={menuRef}
      id={id}
      role="menu"
      aria-label={t("zoneMenu", { name: cardName })}
      onKeyDown={(event) => onZoneMenuKeyDown(event, menuRef.current)}
      className="fixed z-[80] min-w-44 rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-1 text-[var(--text-primary)] shadow-[var(--lumen-shadow-lg)]"
    >
      <ZoneMenuItems cardName={cardName} zoneCounts={zoneCounts} onChoose={onChoose} />
    </div>,
    document.body
  );
}
