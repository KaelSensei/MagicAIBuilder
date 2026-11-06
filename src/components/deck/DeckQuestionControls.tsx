"use client";

import { useState } from "react";
import { HelpCircle, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DeckQuestion } from "@/lib/ai/deck-question";
import type { DeckCard } from "@/lib/deck/types";
import {
  findWeakestCard,
  type WeakestCardCriterion,
} from "@/lib/deck/weakest-card";

interface DeckQuestionControlsProps {
  readonly cardNames: readonly string[];
  readonly cards: readonly DeckCard[];
  readonly disabled?: boolean;
  readonly onAsk: (question: DeckQuestion) => void;
}

/** Offers bounded, deck-aware copilot questions without accepting arbitrary prompts. */
export function DeckQuestionControls({
  cardNames,
  cards,
  disabled,
  onAsk,
}: DeckQuestionControlsProps) {
  const t = useTranslations("deck.ai.questions");
  const [cardName, setCardName] = useState("");
  const [weakestCard, setWeakestCard] = useState<
    ReturnType<typeof findWeakestCard>
  >(undefined);

  return (
    <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        {t("title")}
      </p>
      <label className="block text-[10px] text-[var(--text-secondary)]">
        {t("cardLabel")}
        <select
          value={cardName}
          onChange={(event) => setCardName(event.target.value)}
          disabled={disabled}
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
        >
          <option value="">{t("chooseCard")}</option>
          {cardNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled || !cardName}
          onClick={() => onAsk({ type: "why-card", cardName })}
          className="inline-flex items-center justify-center gap-1 rounded border border-[var(--border)] px-2 py-1.5 text-[10px] hover:border-[var(--accent)] disabled:opacity-40"
        >
          <HelpCircle className="h-3 w-3" />
          {t("whyCard")}
        </button>
        <button
          type="button"
          disabled={disabled || cardNames.length === 0}
          onClick={() => setWeakestCard(findWeakestCard(cards))}
          className="inline-flex items-center justify-center gap-1 rounded border border-[var(--border)] px-2 py-1.5 text-[10px] hover:border-[var(--accent)] disabled:opacity-40"
        >
          <Search className="h-3 w-3" />
          {t("weakestCard")}
        </button>
      </div>
      {weakestCard && (
        <section
          aria-live="polite"
          className="rounded border border-[var(--border)] bg-[var(--surface)] p-2 text-xs"
        >
          <p className="font-semibold text-[var(--text-primary)]">
            {t("weakestResult", { card: weakestCard.card.name })}
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[var(--text-secondary)]">
            {weakestCard.criteria.map((criterion) => (
              <li key={criterion}>{t(criterionMessageKey(criterion))}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function criterionMessageKey(
  criterion: WeakestCardCriterion
): "criterionBanned" | "criterionUnclassified" | "criterionAboveCurve" {
  if (criterion === "banned-card") return "criterionBanned";
  if (criterion === "unclassified-role") return "criterionUnclassified";
  return "criterionAboveCurve";
}
