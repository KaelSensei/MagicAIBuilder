"use client";
/**
 * The cards behind one mana curve bar, listed under the chart when the bar is activated: each
 * card with its quantity and front face's type line, the bar's permanents and spells, and its
 * copies by colour (I-37 10.2). Its count is the bar's figure, from the same predicate (10.3).
 *
 * @module components/deck/CurveBucketCards
 */
import { useId, useMemo } from "react";
import { useTranslations } from "next-intl";
import { facesOf } from "@/lib/deck-lab/card-faces";
import { CURVE_TOP_BUCKET, curveBucketCards } from "@/lib/deck/curve-breakdown";
import type { DeckCard } from "@/lib/deck/types";
import { bucketLabel } from "./ManaCurveBar";

interface CurveBucketCardsProps {
  /** The builder's deck analysis cards (commander, partner and every zone). */
  readonly cards: readonly DeckCard[];
  /** The open bar's bucket, `CURVE_TOP_BUCKET` for 7 and more. */
  readonly bucket: number;
}

/**
 * The open bar's cards, as a region labelled by its heading.
 *
 * @param props.cards - the builder's deck analysis cards
 * @param props.bucket - the open bar's bucket
 */
export function CurveBucketCards({ cards, bucket }: CurveBucketCardsProps) {
  const t = useTranslations("deck");
  const headingId = useId();
  const { rows, count, parts, colours } = useMemo(
    () => curveBucketCards(cards, bucket),
    [cards, bucket]
  );
  // The 7+ bar mixes mana values, so each of its cards shows its own.
  const showsManaValue = bucket === CURVE_TOP_BUCKET;

  return (
    <section
      aria-labelledby={headingId}
      className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-secondary)]"
    >
      <h3
        id={headingId}
        className="mb-2 font-semibold text-[var(--text-primary)]"
      >
        {t("curve.bucketHeading", { cmc: bucketLabel(bucket), count })}
      </h3>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.id} className="flex items-baseline gap-2">
            <span className="tabular-nums">
              {t("curve.quantity", { count: row.quantity })}
            </span>
            <span className="text-[var(--text-primary)]">{row.name}</span>
            <span className="truncate opacity-80">
              {facesOf(row).front.typeLine}
            </span>
            {showsManaValue && (
              <span className="ml-auto tabular-nums">
                {t("curve.manaValue", { value: row.cmc })}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2">{t("curve.split", { ...parts })}</p>
      <ul
        aria-label={t("curve.byColour")}
        className="mt-1 flex flex-wrap gap-x-3"
      >
        {colours.map(({ colour, copies }) => (
          <li key={colour}>
            {t("curve.colourCount", {
              colour: t(`stats.color.${colour}`),
              count: copies,
            })}
          </li>
        ))}
      </ul>
    </section>
  );
}
