"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useMemo } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Clock, Copy, Loader2, Trash2 } from "lucide-react";
import type { Deck } from "@/lib/deck/types";
import { normalizeScryfallImageUrl } from "@/lib/scryfall/images";

interface HomeDeckCardProps {
  readonly deck: Deck;
  readonly onDelete: (e: React.MouseEvent, id: string) => void;
  readonly onDuplicate: (e: React.MouseEvent, id: string) => void;
  readonly deletingId: string | null;
  readonly duplicatingId: string | null;
}

type HomeDeckManaColor = "W" | "U" | "B" | "R" | "G" | "C";

/** Colors per bracket level, aligned with the rest of the deck UI. */
const BRACKET_COLORS: Record<number, string> = {
  1: "text-green-400 bg-green-500/15 border-green-500/30",
  2: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  3: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  4: "text-red-400 bg-red-500/15 border-red-500/30",
  5: "text-fuchsia-400 bg-fuchsia-500/15 border-fuchsia-500/30",
};

/**
 * Check whether a raw deck color identity symbol is supported for home-card display.
 *
 * @param color Raw color identity symbol from deck data.
 * @returns `true` when the symbol maps to an official mana pip we render.
 */
function isHomeDeckManaColor(color: string): color is HomeDeckManaColor {
  return ["W", "U", "B", "R", "G", "C"].includes(color);
}

/**
 * Resolve the ordered mana symbols shown on a deck card from commander and partner identity.
 *
 * @param deck Deck shown on the home page.
 * @returns Unique mana symbols in deck identity order, or `["C"]` for colorless commanders.
 */
export function getDeckPresentationManaColors(
  deck: Deck
): readonly HomeDeckManaColor[] {
  if (!deck.commander) {
    return [];
  }

  const identity = [
    ...deck.commander.colorIdentity,
    ...(deck.partner?.colorIdentity ?? []),
  ];

  const normalized = Array.from(
    new Set(
      identity.map((color) => color.toUpperCase()).filter(isHomeDeckManaColor)
    )
  );

  return normalized.length > 0 ? normalized : ["C"];
}

/**
 * Build the official Scryfall/WotC mana symbol URL for a deck-card pip.
 *
 * @param color Supported mana color symbol.
 * @returns Remote SVG URL.
 */
function getDeckManaSymbolUrl(color: HomeDeckManaColor): string {
  return `https://svgs.scryfall.io/card-symbols/${color}.svg`;
}

export function HomeDeckCard({
  deck,
  onDelete,
  onDuplicate,
  deletingId,
  duplicatingId,
}: HomeDeckCardProps) {
  const hasArt = Boolean(deck.commander?.artCropUri);
  const textMuted = hasArt ? "text-white/70" : "text-[var(--text-secondary)]";
  const textPrimary = hasArt ? "text-white" : "text-[var(--text-primary)]";
  const bracket = deck.manualBracket ?? deck.targetBracket;
  const isManual = Boolean(deck.manualBracket);
  const manaColors = useMemo(() => getDeckPresentationManaColors(deck), [deck]);
  const t = useTranslations("deck");
  const tBuilder = useTranslations("builder");
  const format = useFormatter();

  return (
    <Link
      href={`/builder/${deck.id}`}
      className="group relative block h-full min-h-48 overflow-hidden rounded-[var(--lumen-radius-xl)] border border-[var(--border)] shadow-[var(--lumen-shadow-sm)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--lumen-shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      style={
        hasArt
          ? {
              backgroundImage: `url(${normalizeScryfallImageUrl(deck.commander?.artCropUri ?? "")})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }
          : undefined
      }
      data-testid="deck-card"
    >
      <div
        className={`relative flex h-full flex-col p-5 ${
          hasArt
            ? "bg-gradient-to-t from-black/90 via-black/60 to-black/20"
            : "bg-[var(--surface)] group-hover:bg-[var(--surface-hover)]"
        }`}
      >
        <div className="absolute right-3 top-3 flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => onDuplicate(e, deck.id)}
            disabled={duplicatingId === deck.id}
            className="rounded-[var(--lumen-radius-pill)] p-1 text-[var(--text-secondary)] opacity-0 transition-opacity hover:bg-[var(--accent)]/20 hover:text-[var(--accent-text)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] group-hover:opacity-100 group-focus-within:opacity-100 disabled:opacity-60"
            aria-label={t("card.duplicate", { name: deck.name })}
          >
            {duplicatingId === deck.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => onDelete(e, deck.id)}
            disabled={deletingId === deck.id}
            className="rounded-[var(--lumen-radius-pill)] p-1 text-[var(--text-secondary)] opacity-0 transition-opacity hover:bg-red-500/20 hover:text-red-400 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] group-hover:opacity-100 group-focus-within:opacity-100 disabled:opacity-60"
            aria-label={t("card.delete", { name: deck.name })}
          >
            {deletingId === deck.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div data-testid="deck-identity" className="space-y-2 pr-14">
          <div className="flex items-start justify-between">
            <h3
              className={`truncate pr-2 text-base font-semibold ${textPrimary}`}
            >
              {deck.name}
            </h3>
            <div className="flex shrink-0 items-center gap-1.5">
              {deck.isAIGenerated && (
                <span className="shrink-0 rounded-full border border-purple-500/30 bg-purple-500/20 px-1.5 py-0.5 text-xs text-purple-400">
                  {t("card.aiBadge")}
                </span>
              )}
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  hasArt
                    ? "bg-black/40 text-white/70"
                    : "bg-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {deck.format}
              </span>
            </div>
          </div>

          <p className={`truncate text-sm ${textMuted}`}>
            {deck.commander
              ? t("card.commander", { name: deck.commander.name })
              : t("card.noCommander")}
          </p>
        </div>

        <div
          data-testid="deck-status"
          className={`mt-auto flex items-end justify-between gap-3 border-t pt-3 text-xs ${
            hasArt ? "border-white/15" : "border-[var(--border)]"
          }`}
        >
          <div className={`space-y-1 ${textMuted}`}>
            <p>{t("card.cardCount", { count: deck.cardCount })}</p>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{format.dateTime(new Date(deck.updatedAt))}</span>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span
              className={`rounded border px-1.5 py-0.5 text-xs font-bold ${BRACKET_COLORS[bracket]}`}
              title={isManual ? t("card.manualBracket") : t("card.autoBracket")}
            >
              B{bracket}
              {isManual ? " ⚙" : ""}
            </span>

            {manaColors.length > 0 && (
              <div
                className={`flex items-center gap-1 rounded-full border px-2 py-1 shadow-[0_8px_18px_rgba(0,0,0,0.16)] ${
                  hasArt
                    ? "border-white/10 bg-black/35 backdrop-blur-sm"
                    : "border-white/10 bg-white/8"
                }`}
              >
                {manaColors.map((color) => (
                  <Image
                    key={`${deck.id}-${color}`}
                    src={getDeckManaSymbolUrl(color)}
                    alt={tBuilder("manaSymbolAlt", {
                      color: tBuilder(`manaColors.${color}`),
                    })}
                    width={18}
                    height={18}
                    unoptimized
                    className="h-[18px] w-[18px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
