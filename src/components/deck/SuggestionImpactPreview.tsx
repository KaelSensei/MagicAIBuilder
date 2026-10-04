"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CardSuggestion } from "@/hooks/useAISuggestions";
import type { DeckCard } from "@/lib/deck/types";
import { buildSuggestionImpact } from "@/lib/ai/suggestion-impact";

interface Props {
  readonly currentCards: readonly DeckCard[];
  readonly additions: readonly CardSuggestion[];
  readonly removals: readonly string[];
}

function Metric({
  label,
  before,
  after,
}: {
  readonly label: string;
  readonly before: string | number;
  readonly after: string | number;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-md bg-[var(--surface)] px-2 py-1.5 text-[11px]">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-medium text-[var(--text-primary)]">{before}</span>
      <ArrowRight className="h-3 w-3 text-[var(--text-secondary)]" />
      <span className="font-semibold text-[var(--accent-text)]">{after}</span>
    </div>
  );
}

/** Compares deterministic deck metrics before and after a reviewed AI proposal. */
export function SuggestionImpactPreview({
  currentCards,
  additions,
  removals,
}: Props) {
  const t = useTranslations("deck.ai.impact");
  const impact = buildSuggestionImpact(
    currentCards.map((card) => ({
      name: card.name,
      quantity: card.quantity,
      manaValue: card.cmc,
      priceUsd: card.price,
    })),
    additions.map((addition) => ({
      name: addition.name,
      manaValue: addition.evidence?.manaValue ?? null,
      priceUsd: addition.evidence?.priceUsd ?? null,
      colorCompatible: addition.evidence?.colorCompatible ?? null,
      commanderLegal: addition.evidence?.commanderLegal ?? null,
      verified: addition.evidence?.verified ?? false,
    })),
    removals
  );
  const warningCount =
    impact.unverifiedAdditions +
    impact.incompatibleAdditions.length +
    impact.illegalAdditions.length;

  return (
    <section
      aria-label={t("title")}
      className="space-y-1.5 rounded-md border border-[var(--border)] p-2"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        {t("title")}
      </p>
      <Metric
        label={t("cards")}
        before={impact.before.cards}
        after={impact.after.cards}
      />
      <Metric
        label={t("averageMana")}
        before={impact.before.averageManaValue.toFixed(2)}
        after={impact.after.averageManaValue.toFixed(2)}
      />
      <Metric
        label={t("knownPrice")}
        before={`$${impact.before.knownPriceUsd.toFixed(2)}`}
        after={`$${impact.after.knownPriceUsd.toFixed(2)}`}
      />
      {warningCount > 0 && (
        <div className="flex items-start gap-1.5 pt-1 text-[10px] text-amber-400">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{t("evidenceWarning", { count: warningCount })}</span>
        </div>
      )}
    </section>
  );
}
