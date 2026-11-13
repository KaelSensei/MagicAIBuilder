"use client";
/**
 * One popular card of the meta panel: its name, its inclusion rate as a bar
 * and a percentage, the sample behind it, and the add button, which turns into
 * a check once the card is in the deck.
 *
 * Meta-insights context, `ui/`. Presentational: the EDHREC section decides
 * which cards to list and what adding one does.
 *
 * @module meta-insights/ui/EdhrecCardRow
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Plus } from "lucide-react";
import type { MetaCard } from "@/modules/meta-insights/domain/types";

/** What one popular-card row shows and what its add button does. */
export interface EdhrecCardRowProps {
  readonly card: MetaCard;
  /** True when the deck already runs the card: the row shows a check, not a button. */
  readonly inDeck: boolean;
  /** Called with the card's name when the visitor presses its add button. */
  readonly onAdd: (name: string) => void;
}

/**
 * A popular-card row, with its add button labelled "Add <name>" for assistive
 * technology. After a press the row shows the check on its own, without waiting
 * for the deck to list the card, so a second press cannot add it twice.
 */
export function EdhrecCardRow({ card, inDeck, onAdd }: EdhrecCardRowProps) {
  const t = useTranslations("deck");
  const [added, setAdded] = useState(false);
  const pct = Math.round(card.inclusion * 100);

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] group transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">
          {card.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex-1 h-1 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)]/60 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] shrink-0">
            {pct}%
          </span>
        </div>
        {card.sample && (
          <p className="mt-0.5 text-[10px] text-[var(--text-secondary)] tabular-nums">
            {t("meta.sampleSize", {
              included: card.sample.decksWithCard,
              total: card.sample.eligibleDecks,
            })}
          </p>
        )}
      </div>
      {inDeck || added ? (
        <span className="shrink-0 w-5 h-5 rounded-full bg-green-600/20 flex items-center justify-center">
          <Check className="w-3 h-3 text-green-400" />
        </span>
      ) : (
        <button
          type="button"
          onClick={() => {
            onAdd(card.name);
            setAdded(true);
          }}
          className="shrink-0 w-10 h-10 rounded-lg bg-[var(--accent)]/20 hover:bg-[var(--accent)] flex items-center justify-center text-[var(--accent-text)] hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          aria-label={t("meta.addNamedCard", { name: card.name })}
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
