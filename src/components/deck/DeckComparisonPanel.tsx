"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { fetchDeck } from "@/lib/db/deck-api";
import {
  compareDeckCards,
  compareDeckProfiles,
  type DeckCardComparison,
  type DeckProfileComparison,
  type ComparableDeckProfileCard,
} from "@/lib/deck/comparison";
import { DeckComparisonResults } from "./DeckComparisonResults";

export interface DeckOption {
  readonly id: string;
  readonly name: string;
}

interface DeckComparisonPanelProps {
  readonly decks: readonly DeckOption[];
  readonly loadDeck?: (id: string) => Promise<{
    readonly cards: readonly ComparableDeckProfileCard[];
  }>;
}

interface DeckComparisonResult {
  readonly cards: DeckCardComparison;
  readonly profile: DeckProfileComparison;
}

export function DeckComparisonPanel({
  decks,
  loadDeck = fetchDeck,
}: DeckComparisonPanelProps) {
  const t = useTranslations("deck.comparison");
  const [leftId, setLeftId] = useState(decks[0]?.id ?? "");
  const [rightId, setRightId] = useState(decks[1]?.id ?? "");
  const [comparison, setComparison] = useState<DeckComparisonResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function handleCompare(): Promise<void> {
    if (!leftId || !rightId || leftId === rightId) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const [left, right] = await Promise.all([
        loadDeck(leftId),
        loadDeck(rightId),
      ]);
      setComparison({
        cards: compareDeckCards(left.cards, right.cards),
        profile: compareDeckProfiles(left.cards, right.cards),
      });
    } catch {
      setHasError(true);
      setComparison(null);
    } finally {
      setIsLoading(false);
    }
  }

  if (decks.length < 2) return null;

  return (
    <section
      className="mb-8 border-y border-[var(--border)] py-5"
      aria-labelledby="deck-comparison-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <h2
            id="deck-comparison-title"
            className="font-semibold text-[var(--text-primary)]"
          >
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {t("description")}
          </p>
        </div>
        {[leftId, rightId].map((value, index) => (
          <label
            key={index}
            className="grid gap-1 text-xs text-[var(--text-secondary)]"
          >
            {index === 0 ? t("firstDeck") : t("secondDeck")}
            <select
              value={value}
              onChange={(event) =>
                index === 0
                  ? setLeftId(event.target.value)
                  : setRightId(event.target.value)
              }
              className="min-w-44 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button
          type="button"
          onClick={handleCompare}
          disabled={isLoading || leftId === rightId}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowLeftRight className="h-4 w-4" />
          )}
          {t("compare")}
        </button>
      </div>

      {hasError && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {t("error")}
        </p>
      )}
      {comparison && <DeckComparisonResults comparison={comparison} />}
    </section>
  );
}
