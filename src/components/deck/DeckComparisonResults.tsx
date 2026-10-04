"use client";

import { useFormatter, useTranslations } from "next-intl";
import type {
  DeckCardComparison,
  DeckProfileComparison,
} from "@/lib/deck/comparison";

interface DeckComparisonResultsProps {
  readonly comparison: {
    readonly cards: DeckCardComparison;
    readonly profile: DeckProfileComparison;
  };
}

export function DeckComparisonResults({
  comparison,
}: DeckComparisonResultsProps) {
  const t = useTranslations("deck.comparison");
  const format = useFormatter();

  return (
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
      {comparison.profile.roleDifferences.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            {t("roleDifferences")}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {comparison.profile.roleDifferences.map((difference) => (
              <ProfileMetric
                key={difference.role}
                label={t(`roles.${difference.role}`)}
                value={`${difference.leftQuantity} → ${difference.rightQuantity}`}
              />
            ))}
          </div>
        </div>
      )}
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

interface ComparisonListCard {
  readonly key: string;
  readonly name: string;
  readonly quantity?: number;
  readonly leftQuantity?: number;
  readonly rightQuantity?: number;
}

function ComparisonList({
  title,
  cards,
  showQuantities = false,
}: {
  readonly title: string;
  readonly cards: readonly ComparisonListCard[];
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
