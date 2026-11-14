/**
 * The data-as-of line on a deck (I-86).
 *
 * One note: the rules edition, how prices are stored, and whether card data
 * came from the daily file. It renders the facts it is given. It does not
 * fetch, and a missing date is a sentence rather than a zero.
 *
 * @module components/deck/DataAsOfLine
 */
"use client";

import { useTranslations } from "next-intl";
import { describeDataAsOf, type DataAsOfFacts } from "@/lib/deck/data-as-of";

/**
 * The data-as-of note.
 *
 * @param props.facts - Dates already stored. Null is "not recorded", never a guess.
 */
export function DataAsOfLine({ facts }: { readonly facts: DataAsOfFacts }) {
  const t = useTranslations("dataAsOf");
  const line = describeDataAsOf(facts);
  const rules =
    line.rules.kind === "dated" ? t("rulesDated", { date: line.rules.isoDate }) : t("rulesAbsent");
  const prices =
    line.prices.kind === "dated" ? t("pricesDated", { date: line.prices.isoDate }) : t("pricesStored");
  const cardData =
    line.cardData.kind === "loaded"
      ? t("cardDataLoaded", { date: line.cardData.isoDate })
      : t("cardDataPending");

  return (
    <p role="note" aria-label={t("label")} className="px-1 text-xs text-[var(--text-secondary)]">
      {rules}
      <span aria-hidden="true"> · </span>
      {prices}
      <span aria-hidden="true"> · </span>
      {cardData}
    </p>
  );
}
