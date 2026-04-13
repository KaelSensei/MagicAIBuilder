"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Clock, Copy, Loader2, Trash2 } from "lucide-react";
import type { Deck } from "@/lib/deck/types";

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
};

const HOME_DECK_MANA_LABELS: Record<HomeDeckManaColor, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
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
export function getDeckPresentationManaColors(deck: Deck): readonly HomeDeckManaColor[] {
  if (!deck.commander) {
    return [];
  }

  const identity = [
    ...deck.commander.colorIdentity,
    ...(deck.partner?.colorIdentity ?? []),
  ];

  const normalized = Array.from(
    new Set(
      identity
        .map((color) => color.toUpperCase())
        .filter(isHomeDeckManaColor)
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

/**
 * Build accessible text for a deck-card mana symbol.
 *
 * @param color Supported mana color symbol.
 * @returns Human-readable alt text.
 */
function getDeckManaSymbolAlt(color: HomeDeckManaColor): string {
  return `${HOME_DECK_MANA_LABELS[color]} mana symbol`;
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

  return (
    <Link
      href={`/builder/${deck.id}`}
      className="group relative block h-full min-h-40 overflow-hidden rounded-xl border border-[var(--border)] transition-all hover:border-[var(--accent)]"
      style={
        hasArt
          ? {
              backgroundImage: `url(${deck.commander?.artCropUri})`,
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
            onClick={(e) => onDuplicate(e, deck.id)}
            disabled={duplicatingId === deck.id}
            className="rounded p-1 text-[var(--text-secondary)] opacity-0 transition-opacity hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] group-hover:opacity-100 disabled:opacity-60"
            aria-label={t("card.duplicate", { name: deck.name })}
          >
            {duplicatingId === deck.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={(e) => onDelete(e, deck.id)}
            disabled={deletingId === deck.id}
            className="rounded p-1 text-[var(--text-secondary)] opacity-0 transition-opacity hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 disabled:opacity-60"
            aria-label={t("card.delete", { name: deck.name })}
          >
            {deletingId === deck.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="mb-3 flex items-start justify-between pr-14">
          <h3 className={`truncate pr-2 font-semibold ${textPrimary}`}>{deck.name}</h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {deck.isAIGenerated && (
              <span className="shrink-0 rounded-full border border-purple-500/30 bg-purple-500/20 px-1.5 py-0.5 text-xs text-purple-400">
                AI
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
          {deck.commander ? t("card.commander", { name: deck.commander.name }) : t("card.noCommander")}
        </p>
        <p className={`mt-1 text-xs ${textMuted}`}>
          {t("card.cardCount", { count: deck.cardCount })}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div className={`flex items-center gap-1 text-xs ${textMuted}`}>
            <Clock className="h-3 w-3" />
            <span>{new Date(deck.updatedAt).toLocaleDateString()}</span>
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
                    alt={getDeckManaSymbolAlt(color)}
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
