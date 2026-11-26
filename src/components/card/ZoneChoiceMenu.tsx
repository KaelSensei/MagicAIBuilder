"use client";
/**
 * The portaled zone menu of a search result: main deck, sideboard, considering.
 *
 * Card catalog, search results. Rendered on `document.body` so the result
 * grid's overflow cannot clip it. Arrow keys move between the zones
 * (`zone-menu-focus.ts`), Enter picks the focused one, Escape closes the
 * menu, and Tab closes it and moves on, as a menu does.
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
import {
  focusTabStopAfter,
  menuItems,
  moveZoneFocus,
  onZoneMenuKeyDown,
  type ZoneMenuInitialFocus,
} from "@/components/card/zone-menu-focus";

export type { ZoneMenuInitialFocus } from "@/components/card/zone-menu-focus";

/** Zones a search result can join, in the order the menu reads them. */
const MENU_ZONES: readonly DeckZone[] = ["main", "sideboard", "maybeboard"];

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

/** Escape, a scroll of the results, and a pointer press outside the menu close it. */
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
    document.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("scroll", onClose, true);
    };
  }, [menuRef, onClose, triggerRef]);
}

/**
 * Tab and Shift+Tab move focus out of the menu and close it, as the WAI-ARIA
 * menu pattern asks (APG, menu and menubar pattern, Keyboard Interaction, "Tab
 * and Shift + Tab", https://www.w3.org/WAI/ARIA/apg/patterns/menubar/, read
 * 2026-11-25). For the keyboard the menu sits right after its trigger, so Tab
 * lands on the tab stop after the trigger and Shift+Tab on the trigger itself,
 * as in the APG's own menu button example.
 *
 * @param event - A key event bubbling from the menu or one of its items
 * @param trigger - The button that opened the menu
 * @param onClose - Closes the menu; it puts focus back on the trigger
 */
function leaveZoneMenuOnTab(
  event: ReactKeyboardEvent<HTMLDivElement>,
  trigger: HTMLElement | null,
  onClose: () => void
): void {
  if (event.key !== "Tab") return;
  event.preventDefault();
  event.stopPropagation();
  // onClose focuses the trigger, so the move on to the next tab stop follows it.
  onClose();
  if (!trigger) return;
  if (event.shiftKey || !focusTabStopAfter(trigger)) trigger.focus();
}

interface ZoneMenuItemsProps {
  readonly cardName: string;
  readonly zoneCounts?: Readonly<Record<DeckZone, number>>;
  readonly onChoose: (zone: DeckZone) => void;
}

/**
 * One button per zone. The count is every card already in that zone, not copies of this result.
 * No zone is a tab stop: the arrow keys move focus among them (roving focus) and Tab leaves the
 * menu, as the WAI-ARIA menu pattern asks.
 */
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
        tabIndex={-1}
        className="flex w-full items-center rounded-[var(--lumen-radius-md)] px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--accent-soft)] focus-visible:bg-[var(--accent-soft)]"
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

  // tabIndex -1: the menu takes focus from a press on its edge, so the arrow
  // keys keep working, yet Tab never stops on it, nor on its items: Tab leaves.
  return createPortal(
    <div
      ref={menuRef}
      id={id}
      role="menu"
      tabIndex={-1}
      aria-label={t("zoneMenu", { name: cardName })}
      onKeyDown={(event) => {
        leaveZoneMenuOnTab(event, triggerRef.current, onClose);
        onZoneMenuKeyDown(event, menuRef.current);
      }}
      className="fixed z-[80] min-w-44 rounded-[var(--lumen-radius-lg)] outline-none border border-[var(--border)] bg-[var(--surface)] p-1 text-[var(--text-primary)] shadow-[var(--lumen-shadow-lg)]"
    >
      <ZoneMenuItems cardName={cardName} zoneCounts={zoneCounts} onChoose={onChoose} />
    </div>,
    document.body
  );
}
