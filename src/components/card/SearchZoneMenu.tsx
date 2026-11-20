"use client";
/**
 * Split control that adds a search result to a deck zone.
 *
 * Card catalog, search results. The primary action adds the card to the main
 * deck in one press. The chevron opens {@link ZoneChoiceMenu} for the main
 * deck, the sideboard and considering, naming the copies already in each zone
 * when the caller counted them. Dragging the card onto a zone tab adds it too.
 *
 * Not responsible for: whether the card is legal in the zone. The deck store
 * decides that when the card is added.
 *
 * @module card/SearchZoneMenu
 */
import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
import type { DeckZone } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { ZoneChoiceMenu, type ZoneMenuInitialFocus } from "@/components/card/ZoneChoiceMenu";

interface SearchZoneMenuProps {
  readonly card: ScryfallCard;
  readonly onAddToZone: (card: ScryfallCard, zone: DeckZone) => void;
  /** Copies already in each zone. Omitted, the menu names the zones only. */
  readonly zoneCounts?: Readonly<Record<DeckZone, number>>;
}

/**
 * Keyboard and pointer control for adding a search result to a zone.
 *
 * @param props - The card, the add callback and the zone counts
 * @returns The primary action and its zone menu
 */
export function SearchZoneMenu({ card, onAddToZone, zoneCounts }: SearchZoneMenuProps) {
  const t = useTranslations("card");
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [openFocus, setOpenFocus] = useState<ZoneMenuInitialFocus | null>(null);

  function add(zone: DeckZone) {
    onAddToZone(card, zone);
    const menuWasOpen = openFocus !== null;
    setOpenFocus(null);
    if (menuWasOpen) triggerRef.current?.focus();
  }

  function close() {
    setOpenFocus(null);
    triggerRef.current?.focus();
  }

  function open(focus: ZoneMenuInitialFocus) {
    setOpenFocus(focus);
  }

  return (
    <fieldset className="m-0 flex w-full min-w-0 border-0 p-0 [min-inline-size:0]">
      <legend className="sr-only">{t("zoneGroup", { name: card.name })}</legend>
      <button
        type="button"
        className={cn(
          buttonVariants({ variant: "primary", size: "sm" }),
          "h-10 min-w-0 flex-1 rounded-r-none px-2 text-xs"
        )}
        aria-label={t("addToMain", { name: card.name })}
        onClick={(event) => {
          event.stopPropagation();
          add("main");
        }}
      >
        {t("add")}
      </button>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          buttonVariants({ variant: "primary", size: "sm" }),
          "h-10 shrink-0 rounded-l-none border-l border-white/30 px-2"
        )}
        aria-haspopup="menu"
        aria-expanded={openFocus !== null}
        aria-controls={openFocus !== null ? menuId : undefined}
        aria-label={t("otherZones", { name: card.name })}
        onClick={(event) => {
          event.stopPropagation();
          if (openFocus !== null) close();
          else open("first");
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          event.stopPropagation();
          open(event.key === "ArrowUp" ? "last" : "first");
        }}
      >
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </button>
      {openFocus !== null && (
        <ZoneChoiceMenu
          id={menuId}
          cardName={card.name}
          zoneCounts={zoneCounts}
          triggerRef={triggerRef}
          initialFocus={openFocus}
          onChoose={add}
          onClose={close}
        />
      )}
    </fieldset>
  );
}
