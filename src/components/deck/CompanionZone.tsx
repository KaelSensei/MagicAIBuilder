"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CardTooltip } from "@/components/card/CardTooltip";
import {
  describeCompanionCondition,
  detectCompanionConditionFromDeckCard,
  getCompanionDeckWarnings,
} from "@/lib/deck/companion";
import { isCompanionOutsideColorIdentity } from "@/lib/deck/color-identity";
import type { Deck } from "@/lib/deck/types";
import { useDeckStore } from "@/lib/deck/store";

/**
 * Tag renderers for `t.rich`.
 *
 * Defined at module scope rather than inline: a renderer written in the render
 * body is a new function identity on every render, and Sonar reads it as a
 * component defined inside a component.
 */
const RICH_TAGS = {
  strong: (chunks: ReactNode) => (
    <span className="text-[var(--text-primary)] font-medium">{chunks}</span>
  ),
};

interface CompanionZoneProps {
  readonly deck: Deck;
  /** When grid view, companion art is shown in the main deck tile row; hide duplicate name here. */
  readonly deckViewMode?: "grid" | "list";
}

/**
 * Shows the deck's Companion (outside the 99), its rule summary, validation hints, and clear.
 */
export function CompanionZone({ deck, deckViewMode }: CompanionZoneProps) {
  const t = useTranslations("deck");
  const setCompanion = useDeckStore((s) => s.setCompanion);
  const companion = deck.companion;
  const commander = deck.commander;

  const condition = useMemo(
    () => (companion ? detectCompanionConditionFromDeckCard(companion) : null),
    [companion]
  );

  const ruleSummary = useMemo(
    () => (condition ? describeCompanionCondition(condition) : null),
    [condition]
  );

  const warnings = useMemo(() => getCompanionDeckWarnings(deck), [deck]);
  const hasColorViolation = useMemo(() => isCompanionOutsideColorIdentity(deck), [deck]);

  if (!commander) {
    return null;
  }

  if (!companion) {
    return (
      <div className="px-3 pb-2 border-b border-[var(--border)]">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-1">
          {t("companion.title")}{" "}
          <span className="text-[10px] normal-case opacity-70">{t("companion.zoneHint")}</span>
        </p>
        <div className="rounded-lg border border-dashed border-[var(--border)] px-2 py-2">
          <p className="text-[10px] text-[var(--text-secondary)] leading-snug">
            {t.rich("companion.emptyHint", RICH_TAGS)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-3 pb-3 border-b ${hasColorViolation ? "border-red-500/40 bg-red-500/5" : "border-[var(--border)]"}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
          {t("companion.title")}{" "}
          <span className="text-[10px] normal-case opacity-70">{t("companion.zoneHint")}</span>
        </p>
        <button
          type="button"
          onClick={() => void setCompanion(null)}
          className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:border-red-500/50 hover:text-red-400 transition-colors shrink-0"
        >
          {t("companion.clear")}
        </button>
      </div>
      {deckViewMode !== "grid" && (
        <CardTooltip card={companion}>
          <span className="text-sm text-[var(--text-primary)] font-medium cursor-default hover:text-[var(--accent-text)] transition-colors">
            {companion.name}
          </span>
        </CardTooltip>
      )}
      {ruleSummary && (
        <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 leading-snug">{ruleSummary}</p>
      )}
      {warnings.length > 0 && (
        <ul className={`mt-2 space-y-1 text-[10px] leading-snug list-disc pl-3.5 ${hasColorViolation ? "text-red-400" : "text-amber-400/95"}`}>
          {warnings.map((w, i) => (
            <li key={`${i}-${w.slice(0, 24)}`}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
