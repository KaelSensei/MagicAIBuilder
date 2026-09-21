"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { fetchDeck } from "@/lib/db/deck-api";
import {
  compareDeckCards,
  compareDeckProfiles,
  type DeckCardComparison,
  type DeckProfileComparison,
} from "@/lib/deck/comparison";

interface DeckOption {
  readonly id: string;
  readonly name: string;
}

interface DeckComparisonPanelProps {
  readonly decks: readonly DeckOption[];
}

interface DeckComparisonResult {
  readonly cards: DeckCardComparison;
  readonly profile: DeckProfileComparison;
}

export function DeckComparisonPanel({ decks }: DeckComparisonPanelProps) {
  const t = useTranslations("deck.comparison");
  const format = useFormatter();
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
        fetchDeck(leftId),
        fetchDeck(rightId),
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
      {comparison && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-2 sm:grid-cols-3">
            <ProfileMetric
              label={t("averageManaValue")}
              value={`${comparison.profile.leftAverageCmc} → ${comparison.profile.rightAverageCmc}`}
            />
            <ProfileMetric
              label={t("estimatedPrice")}
              value={`${format.number(comparison.profile.leftPrice, { style: "currency", currency: "USD" })} → ${format.number(comparison.profile.rightPrice, { style: "currency", currency: "USD" })}`}
            />
            <ProfileMetric
              label={t("uniqueColors")}
              value={`${comparison.profile.onlyLeftColors.join("") || "—"} → ${comparison.profile.onlyRightColors.join("") || "—"}`}
            />
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <ComparisonList
              title={t("onlyFirst")}
              cards={comparison.cards.onlyLeft}
            />
            <ComparisonList
              title={t("onlySecond")}
              cards={comparison.cards.onlyRight}
            />
            <ComparisonList
              title={t("quantityChanges")}
              cards={comparison.cards.quantityChanges}
              showQuantities
            />
            <p className="text-sm text-[var(--text-secondary)] md:col-span-3">
              {t("shared", { count: comparison.cards.shared.length })}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function ProfileMetric({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
      <p className="text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

function ComparisonList({
  title,
  cards,
  showQuantities = false,
}: {
  readonly title: string;
  readonly cards: readonly {
    readonly key: string;
    readonly name: string;
    readonly quantity?: number;
    readonly leftQuantity?: number;
    readonly rightQuantity?: number;
  }[];
  readonly showQuantities?: boolean;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        {title}
      </h3>
      {cards.length === 0 ? (
        <span className="text-sm text-[var(--text-secondary)]">—</span>
      ) : (
        <ul className="space-y-1 text-sm text-[var(--text-primary)]">
          {cards.map((card) => (
            <li key={card.key} className="flex justify-between gap-3">
              <span>{card.name}</span>
              <span className="tabular-nums text-[var(--text-secondary)]">
                {showQuantities
                  ? `${card.leftQuantity} → ${card.rightQuantity}`
                  : `×${card.quantity}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
