"use client";
/**
 * One card of the Game Changers and banlist grid: its grid-size image, name,
 * type line and the badge of the list it belongs to. The whole tile is a button
 * that opens the zoom of that card.
 *
 * Rules reference context, `ui/`. Presentational: the page decides which cards
 * to show and what the zoom does.
 *
 * @module rules-reference/ui/CardTile
 */
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { getCardGridImageUri } from "@/modules/rules-reference/ui/card-image";
import { resolveLocalizedText } from "@/lib/scryfall/localized";
import type { ScryfallCard } from "@/lib/scryfall/types";

export interface CardTileProps {
  readonly card: ScryfallCard;
  /** The list badge shown beside the name: Game Changer or Banned. */
  readonly badge: ReactNode;
  /** Called with the tile's card when the visitor clicks it. */
  readonly onClickZoom: (card: ScryfallCard) => void;
}

/**
 * A grid tile for one card, labelled "View <name>" for assistive technology and
 * showing the "no image" placeholder when Scryfall lists no image.
 */
export function CardTile({ card, badge, onClickZoom }: CardTileProps) {
  const t = useTranslations("rules");
  const imageUri = getCardGridImageUri(card);
  const text = resolveLocalizedText(card);

  return (
    <button
      type="button"
      className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--accent)]/50 transition-colors cursor-pointer text-left w-full"
      onClick={() => onClickZoom(card)}
      aria-label={t("zoom.viewCard", { name: text.name })}
    >
      {/* Card image — aspect ratio ~63:88 */}
      <div className="relative aspect-[63/88] bg-[var(--background)] overflow-hidden">
        {imageUri !== null ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUri}
            alt={text.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-xs">
            {t("zoom.noImage")}
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="p-2 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate">
            {text.name}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] truncate">
            {text.typeLine}
          </p>
        </div>
        {badge}
      </div>
    </button>
  );
}
