"use client";

import { useState } from "react";
import { HelpCircle, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DeckQuestion } from "@/lib/ai/deck-question";

interface DeckQuestionControlsProps {
  readonly cardNames: readonly string[];
  readonly disabled?: boolean;
  readonly onAsk: (question: DeckQuestion) => void;
}

/** Offers bounded, deck-aware copilot questions without accepting arbitrary prompts. */
export function DeckQuestionControls({
  cardNames,
  disabled,
  onAsk,
}: DeckQuestionControlsProps) {
  const t = useTranslations("deck.ai.questions");
  const [cardName, setCardName] = useState("");

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
          onClick={() => onAsk({ type: "weakest-card" })}
          className="inline-flex items-center justify-center gap-1 rounded border border-[var(--border)] px-2 py-1.5 text-[10px] hover:border-[var(--accent)] disabled:opacity-40"
        >
          <Search className="h-3 w-3" />
          {t("weakestCard")}
        </button>
      </div>
    </div>
  );
}
