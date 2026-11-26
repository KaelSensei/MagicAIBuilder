"use client";
/**
 * Discreet controls for adding a search result to a deck zone.
 *
 * Card catalog, search results. On a tile the card art stays clear. A pointer
 * that can hover, or keyboard focus, reveals a soft gradient and two small
 * icon buttons: add to the main deck, and the zone menu. A device without
 * hover keeps those buttons as a small badge in the corner. A list row shows
 * the same two buttons beside the name. The menu is {@link ZoneChoiceMenu}.
 *
 * Not responsible for: opening the card. The image's own click does that.
 *
 * @module card/SearchZoneMenu
 */
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { Check, Ellipsis, Plus } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { DeckZone } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { ZoneChoiceMenu, type ZoneMenuInitialFocus } from "@/components/card/ZoneChoiceMenu";

/** How long the check stays on the tile after an add, in milliseconds. */
const ADDED_FLASH_MS = 1200;

/** A tile overlays the art. A row sits beside the name. */
export type SearchZonePlacement = "tile" | "row";

interface SearchZoneMenuProps {
  readonly card: ScryfallCard;
  readonly onAddToZone: (card: ScryfallCard, zone: DeckZone) => void;
  /** Cards already in each zone, not copies of this result. */
  readonly zoneCounts?: Readonly<Record<DeckZone, number>>;
  /** Tile overlay by default. A list row passes `row`. */
  readonly placement?: SearchZonePlacement;
}

const ICON_BUTTON =
  "flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-black/45 text-white shadow-[var(--lumen-shadow-sm)] backdrop-blur-sm hover:bg-black/65";

/**
 * Icon buttons that add a search result without covering the card at rest.
 *
 * @param props - The card, where the buttons sit, the counts and the add callback
 * @returns The add button, the zone menu, and a short confirmation
 */
export function SearchZoneMenu({
  card,
  onAddToZone,
  zoneCounts,
  placement = "tile",
}: SearchZoneMenuProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [openFocus, setOpenFocus] = useState<ZoneMenuInitialFocus | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return undefined;
    const timer = setTimeout(() => setAdded(false), ADDED_FLASH_MS);
    return () => clearTimeout(timer);
  }, [added]);

  function add(zone: DeckZone) {
    onAddToZone(card, zone);
    setAdded(true);
    const menuWasOpen = openFocus !== null;
    setOpenFocus(null);
    if (menuWasOpen) triggerRef.current?.focus();
  }

  function close() {
    setOpenFocus(null);
    triggerRef.current?.focus();
  }

  const buttons = (
    <ZoneActions
      card={card}
      added={added}
      zoneCounts={zoneCounts}
      menuId={menuId}
      openFocus={openFocus}
      triggerRef={triggerRef}
      onAddMain={() => add("main")}
      onChoose={add}
      onClose={close}
      onOpen={(focus) => setOpenFocus(focus)}
    />
  );

  if (placement === "row") {
    return <div className="flex shrink-0 items-center gap-1">{buttons}</div>;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20" data-testid="zone-tile-chrome">
      <div
        aria-hidden
        data-testid="zone-hover-gradient"
        className="absolute inset-x-0 bottom-0 hidden h-16 bg-gradient-to-t from-black/75 to-transparent opacity-0 [@media(hover:hover)]:block [@media(hover:hover)]:group-hover/gridcard:opacity-100 [@media(hover:hover)]:group-focus-within/gridcard:opacity-100"
      />
      <div
        className={cn(
          "pointer-events-auto absolute flex items-center gap-1",
          "right-1.5 top-1.5",
          "[@media(hover:hover)]:inset-x-0 [@media(hover:hover)]:bottom-2 [@media(hover:hover)]:top-auto [@media(hover:hover)]:justify-center",
          "[@media(hover:hover)]:opacity-0",
          "[@media(hover:hover)]:group-hover/gridcard:opacity-100",
          "[@media(hover:hover)]:group-focus-within/gridcard:opacity-100"
        )}
      >
        {buttons}
      </div>
    </div>
  );
}

interface ZoneActionsProps {
  readonly card: ScryfallCard;
  readonly added: boolean;
  readonly zoneCounts?: Readonly<Record<DeckZone, number>>;
  readonly menuId: string;
  readonly openFocus: ZoneMenuInitialFocus | null;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
  readonly onAddMain: () => void;
  readonly onChoose: (zone: DeckZone) => void;
  readonly onClose: () => void;
  readonly onOpen: (focus: ZoneMenuInitialFocus) => void;
}

/** The + and the zone-menu icon, plus the portaled menu and the add confirmation. */
function ZoneActions(props: ZoneActionsProps) {
  const t = useTranslations("card");
  return (
    <>
      <button
        type="button"
        className={ICON_BUTTON}
        aria-label={t("addToMain", { name: props.card.name })}
        onClick={(event) => {
          event.stopPropagation();
          props.onAddMain();
        }}
      >
        {props.added ? (
          <Check className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Plus className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
      <button
        ref={props.triggerRef}
        type="button"
        className={ICON_BUTTON}
        aria-haspopup="menu"
        aria-expanded={props.openFocus !== null}
        aria-controls={props.openFocus !== null ? props.menuId : undefined}
        aria-label={t("otherZones", { name: props.card.name })}
        onClick={(event) => {
          event.stopPropagation();
          if (props.openFocus !== null) props.onClose();
          else props.onOpen("first");
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          event.stopPropagation();
          props.onOpen(event.key === "ArrowUp" ? "last" : "first");
        }}
      >
        <Ellipsis className="h-3.5 w-3.5" aria-hidden />
      </button>
      {props.openFocus !== null && (
        <ZoneChoiceMenu
          id={props.menuId}
          cardName={props.card.name}
          zoneCounts={props.zoneCounts}
          triggerRef={props.triggerRef}
          initialFocus={props.openFocus}
          onChoose={props.onChoose}
          onClose={props.onClose}
        />
      )}
      {props.added && <output className="sr-only">{t("addedFlash", { name: props.card.name })}</output>}
    </>
  );
}
