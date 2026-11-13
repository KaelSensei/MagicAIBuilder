"use client";
/**
 * The card grid of the Game Changers and banlist page: one `CardTile` per card
 * of the current page, each with the badge of the list it belongs to, or the
 * "no cards" message when the page is empty.
 *
 * Rules reference context, `ui/`. Presentational: the page decides which cards
 * are on the page and what the zoom does.
 *
 * @module rules-reference/ui/ReferenceCardGrid
 */
import { useTranslations } from "next-intl";
import { Shield, Zap } from "lucide-react";
import type { ReferenceList } from "@/modules/rules-reference/client/useReferenceLists";
import { CardTile } from "@/modules/rules-reference/ui/CardTile";
import type { ScryfallCard } from "@/lib/scryfall/types";

/** The cards of one page, the list they belong to, and the zoom callback. */
export interface ReferenceCardGridProps {
  /** The list the cards belong to; it picks the badge on every tile. */
  readonly list: ReferenceList;
  /** The cards of the current page, in page order. */
  readonly cards: readonly ScryfallCard[];
  /** Called with the tile's card when the visitor clicks it. */
  readonly onClickZoom: (card: ScryfallCard) => void;
}

const BADGE_CLASS =
  "shrink-0 text-[10px] font-medium flex items-center gap-0.5";

/** The grid, or the empty message when `cards` is empty. */
export function ReferenceCardGrid({
  list,
  cards,
  onClickZoom,
}: ReferenceCardGridProps) {
  const t = useTranslations("rules");

  if (cards.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)] text-center py-8">
        {t("noCards")}
      </p>
    );
  }

  const badge =
    list === "game-changers" ? (
      <span className={`${BADGE_CLASS} text-amber-400`}>
        <Zap className="w-2.5 h-2.5" /> {t("badges.gc")}
      </span>
    ) : (
      <span className={`${BADGE_CLASS} text-red-400`}>
        <Shield className="w-2.5 h-2.5" /> {t("badges.banned")}
      </span>
    );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <CardTile
          key={card.id}
          card={card}
          onClickZoom={onClickZoom}
          badge={badge}
        />
      ))}
    </div>
  );
}
