"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Clock, Copy, Loader2, Trash2 } from "lucide-react";
import type { Deck } from "@/lib/deck/types";
import { getDeckPresentationManaColors } from "./HomeDeckCard";

type HomeDeckManaColor = "W" | "U" | "B" | "R" | "G" | "C";

const HOME_DECK_MANA_LABELS: Record<HomeDeckManaColor, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
};

function getDeckManaSymbolUrl(color: HomeDeckManaColor): string {
  return `https://svgs.scryfall.io/card-symbols/${color}.svg`;
}

function getDeckManaSymbolAlt(color: HomeDeckManaColor): string {
  return `${HOME_DECK_MANA_LABELS[color]} mana symbol`;
}

const BRACKET_COLORS: Record<number, string> = {
  1: "text-green-400 bg-green-500/15 border-green-500/30",
  2: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  3: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  4: "text-red-400 bg-red-500/15 border-red-500/30",
};

export type DeckListTableProps = {
  readonly decks: readonly Deck[];
  readonly deletingId: string | null;
  readonly duplicatingId: string | null;
  readonly onDelete: (e: React.MouseEvent, id: string) => void;
  readonly onDuplicate: (e: React.MouseEvent, id: string) => void;
};

export function DeckListTable({
  decks,
  deletingId,
  duplicatingId,
  onDelete,
  onDuplicate,
}: DeckListTableProps) {
  const t = useTranslations("deck");

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[var(--surface-hover)] text-xs uppercase tracking-wide text-[var(--text-secondary)]">
            <tr className="[&>th]:px-4 [&>th]:py-3">
              <th scope="col">{t("table.deck")}</th>
              <th scope="col">{t("table.colors")}</th>
              <th scope="col">{t("table.bracket")}</th>
              <th scope="col">{t("table.cards")}</th>
              <th scope="col">{t("table.updated")}</th>
              <th scope="col" className="text-right">
                {t("table.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {decks.map((deck) => (
              <DeckListRow
                key={deck.id}
                deck={deck}
                deletingId={deletingId}
                duplicatingId={duplicatingId}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeckListRow({
  deck,
  deletingId,
  duplicatingId,
  onDelete,
  onDuplicate,
}: {
  readonly deck: Deck;
  readonly deletingId: string | null;
  readonly duplicatingId: string | null;
  readonly onDelete: (e: React.MouseEvent, id: string) => void;
  readonly onDuplicate: (e: React.MouseEvent, id: string) => void;
}) {
  const bracket = deck.manualBracket ?? deck.targetBracket;
  const isManual = Boolean(deck.manualBracket);
  const manaColors = useMemo(() => getDeckPresentationManaColors(deck), [deck]);
  const t = useTranslations("deck");

  return (
    <tr className="group [&>td]:px-4 [&>td]:py-3">
      <td className="min-w-[280px]">
        <Link
          href={`/builder/${deck.id}`}
          className="block text-[var(--text-primary)] hover:text-[var(--accent)]"
        >
          <div className="font-medium">{deck.name}</div>
          <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
            {deck.commander
              ? t("card.commander", { name: deck.commander.name })
              : t("card.noCommander")}
          </div>
        </Link>
      </td>

      <td className="min-w-[120px]">
        {manaColors.length > 0 ? (
          <div className="flex items-center gap-1">
            {manaColors.map((color) => (
              <Image
                key={`${deck.id}-${color}`}
                src={getDeckManaSymbolUrl(color)}
                alt={getDeckManaSymbolAlt(color)}
                width={16}
                height={16}
                unoptimized
                className="h-4 w-4"
              />
            ))}
          </div>
        ) : (
          <span className="text-xs text-[var(--text-secondary)]">—</span>
        )}
      </td>

      <td className="min-w-[90px]">
        <span
          className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-bold ${BRACKET_COLORS[bracket]}`}
          title={isManual ? t("card.manualBracket") : t("card.autoBracket")}
        >
          B{bracket}
          {isManual ? " ⚙" : ""}
        </span>
      </td>

      <td className="min-w-[90px] text-[var(--text-secondary)]">
        {deck.cardCount} / 100
      </td>

      <td className="min-w-[120px] text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>{new Date(deck.updatedAt).toLocaleDateString()}</span>
        </div>
      </td>

      <td className="min-w-[120px] text-right">
        <div className="inline-flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => onDuplicate(e, deck.id)}
            disabled={duplicatingId === deck.id}
            className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] disabled:opacity-60"
            aria-label={t("card.duplicate", { name: deck.name })}
          >
            {duplicatingId === deck.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => onDelete(e, deck.id)}
            disabled={deletingId === deck.id}
            className="rounded p-1 text-[var(--text-secondary)] hover:bg-red-500/20 hover:text-red-400 disabled:opacity-60"
            aria-label={t("card.delete", { name: deck.name })}
          >
            {deletingId === deck.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
