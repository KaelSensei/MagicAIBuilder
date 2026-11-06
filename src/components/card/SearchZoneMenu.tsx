"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import type { DeckZone } from "@/lib/deck/types";
import { isDeckZone } from "@/lib/deck/drop-targets";
import type { ScryfallCard } from "@/lib/scryfall/types";

interface SearchZoneMenuProps {
  readonly card: ScryfallCard;
  readonly onAddToZone: (card: ScryfallCard, zone: DeckZone) => void;
}

/**
 * Keyboard and touch control for adding a search result to a zone.
 *
 * Dragging onto a zone tab does the same thing. This menu stays in the layout
 * so the action is available when a pointer cannot drag.
 *
 * @param props - Card and the add callback
 * @returns A zone select
 */
export function SearchZoneMenu({ card, onAddToZone }: SearchZoneMenuProps) {
  const t = useTranslations("card");
  const menuId = useId();

  return (
    <select
      id={menuId}
      aria-label={t("addToZone", { name: card.name })}
      defaultValue=""
      className="h-10 w-full rounded-[var(--lumen-radius-pill)] border border-[var(--border)] bg-[var(--surface)] px-2 text-xs text-[var(--text-primary)]"
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => {
        const zone = event.currentTarget.value;
        if (!isDeckZone(zone)) return;
        onAddToZone(card, zone);
        event.currentTarget.value = "";
      }}
    >
      <option value="">{t("chooseZone")}</option>
      <option value="main">{t("zoneMain")}</option>
      <option value="sideboard">{t("zoneSideboard")}</option>
      <option value="maybeboard">{t("zoneConsidering")}</option>
    </select>
  );
}
