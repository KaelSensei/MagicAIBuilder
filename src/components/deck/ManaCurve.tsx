"use client";
/**
 * The mana curve chart of the statistics column — Linear/Vercel dashboard aesthetic.
 *
 * Given the deck's cards, each bar stacks its permanents and spells, and activating a bar lists
 * its cards under the chart (I-37 10.2, 10.3). The builder and the shared deck view both pass
 * them; without cards it draws the plain curve. The card list is read-only.
 *
 * @module components/deck/ManaCurve
 */
import { useCallback, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";
import type { DeckCard } from "@/lib/deck/types";
import { AVERAGE_MANA_VALUE_FORMAT } from "@/lib/deck/average-mana-value";
import {
  curveMedians,
  curvePartsByBucket,
  NO_PARTS,
  totalManaValue,
} from "@/lib/deck/curve-breakdown";
import { CurveBucketCards } from "./CurveBucketCards";
import {
  bucketLabel,
  ManaCurveBar,
  permanentFill,
  spellFill,
  type CurveBarSelection,
} from "./ManaCurveBar";

interface ManaCurveProps {
  readonly curve: Readonly<Record<number, number>>;
  /**
   * The deck's average mana value (`averageManaValue`), shown beside the title: the Stats panel's
   * own figure, not an average of the bars. Without it the chart shows no average.
   */
  readonly averageManaValue?: number;
  /**
   * The builder's deck analysis cards (`sharedDeckCurveCards` on the shared deck view); without
   * them the bars are plain and not pressable.
   */
  readonly cards?: readonly DeckCard[];
  /**
   * The element of the chart's title: a heading at the level the page's outline needs (the shared
   * deck view's panels are `h3`), or a plain paragraph, the builder's, by default.
   */
  readonly titleAs?: ManaCurveTitleElement;
  readonly className?: string;
}

/** The elements the chart's title can be. */
export type ManaCurveTitleElement = "p" | "h2" | "h3" | "h4";

const BUCKETS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

// Ghost grid lines at 25%, 50%, 75%, 100% of chart height
const GRID_LINES = [0.25, 0.5, 0.75, 1];

/** The legend's neutral swatch colour: the bars change colour by bucket, the parts by fill. */
const LEGEND_COLOR = "#94a3b8";

/**
 * The deck's average mana value beside the chart's title, as its caller computed it: the bars
 * count the commanders and cap at 7+, so an average of the bars would disagree with the Stats
 * panel's (I-37). An empty curve has nothing to average and shows a dash.
 */
function CurveAverage({
  curve,
  value,
}: {
  readonly curve: Readonly<Record<number, number>>;
  readonly value: number;
}) {
  const t = useTranslations("deck");
  const format = useFormatter();
  const hasCopies = BUCKETS.some((bucket) => (curve[bucket] ?? 0) > 0);
  const shown = hasCopies
    ? format.number(value, AVERAGE_MANA_VALUE_FORMAT)
    : "—";
  return (
    <span className="text-xs text-[var(--text-secondary)] tabular-nums">
      {t("stats.avgCmcInline", { value: shown })}
    </span>
  );
}

/** The medians, without and with lands, and the total mana value of the deck's cards. */
function CurveFigures({ cards }: { readonly cards: readonly DeckCard[] }) {
  const t = useTranslations("deck");
  const format = useFormatter();
  const medians = useMemo(() => curveMedians(cards), [cards]);
  const total = useMemo(() => totalManaValue(cards), [cards]);
  // An even count's median is the mean of two values: one decimal at most.
  const shown = (median: number | null) =>
    median === null ? "—" : format.number(median, { maximumFractionDigits: 1 });
  return (
    <div className="-mt-3 mb-4 flex flex-wrap justify-between gap-x-3 text-xs text-[var(--text-secondary)] tabular-nums">
      <span>
        {t("curve.median", {
          value: shown(medians.withoutLands),
          withLands: shown(medians.withLands),
        })}
      </span>
      <span>{t("curve.total", { value: format.number(total) })}</span>
    </div>
  );
}

/** Names both parts of a bar in words, beside their fills. */
function CurveLegend() {
  const t = useTranslations("deck");
  const entries = [
    {
      key: "permanents",
      fill: permanentFill(LEGEND_COLOR),
      label: t("curve.permanents"),
    },
    { key: "spells", fill: spellFill(LEGEND_COLOR), label: t("curve.spells") },
  ];
  return (
    <ul
      aria-label={t("curve.legend")}
      className="mt-2 flex gap-3 text-[10px] text-[var(--text-secondary)]"
    >
      {entries.map(({ key, fill, label }) => (
        <li key={key} className="flex items-center gap-1">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: fill }}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}

/** The bars' parts and the open bar; no selection at all without the deck's cards. */
function useCurveSelection(cards: readonly DeckCard[] | undefined) {
  const [openBucket, setOpenBucket] = useState<number | null>(null);
  const parts = useMemo(
    () => (cards ? curvePartsByBucket(cards) : null),
    [cards]
  );
  const onToggle = useCallback(
    (bucket: number) =>
      setOpenBucket((open) => (open === bucket ? null : bucket)),
    []
  );
  const onClose = useCallback(() => setOpenBucket(null), []);
  // A bar a deck edit emptied cannot stay open.
  const shownBucket =
    openBucket !== null && parts?.has(openBucket) ? openBucket : null;
  const selectionOf = (bucket: number): CurveBarSelection | undefined =>
    parts
      ? {
          parts: parts.get(bucket) ?? NO_PARTS,
          pressed: shownBucket === bucket,
          onToggle,
          onClose,
        }
      : undefined;
  return { hasParts: parts !== null, shownBucket, selectionOf };
}

/**
 * The mana curve chart.
 *
 * @param props.curve - copies per bucket, from `buildManaCurve`
 * @param props.averageManaValue - the deck's average, from `averageManaValue`; none shown without it
 * @param props.cards - the builder's deck analysis cards, for the parts and the card lists
 * @param props.titleAs - the title's element; a paragraph unless the page's outline needs a heading
 */
export function ManaCurve({
  curve,
  averageManaValue,
  cards,
  titleAs: Title = "p",
  className,
}: ManaCurveProps) {
  const t = useTranslations("deck");
  const { hasParts, shownBucket, selectionOf } = useCurveSelection(cards);
  const maxCount = Math.max(...BUCKETS.map((b) => curve[b] ?? 0), 1);

  return (
    <div
      className={cn(
        "rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Title className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-widest">
          {t("stats.manaCurve")}
        </Title>
        {averageManaValue !== undefined && (
          <CurveAverage curve={curve} value={averageManaValue} />
        )}
      </div>
      {cards && <CurveFigures cards={cards} />}

      {/* Chart area */}
      <div className="relative" style={{ height: 140 }}>
        {/* Ghost grid lines */}
        {GRID_LINES.map((frac) => (
          <div
            key={frac}
            className="absolute left-0 right-0 border-t border-white/10"
            style={{ bottom: `${frac * 100}%` }}
          />
        ))}

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-1.5">
          {BUCKETS.map((bucket) => (
            <ManaCurveBar
              key={bucket}
              bucket={bucket}
              count={curve[bucket] ?? 0}
              maxCount={maxCount}
              selection={selectionOf(bucket)}
            />
          ))}
        </div>
      </div>

      {/* CMC labels below chart */}
      <div className="flex gap-1.5 mt-1.5">
        {BUCKETS.map((bucket) => (
          <div key={bucket} className="flex-1 flex justify-center">
            <span className="text-[10px] text-[var(--text-secondary)]">
              {bucketLabel(bucket)}
            </span>
          </div>
        ))}
      </div>

      {hasParts && <CurveLegend />}
      {cards && shownBucket !== null && (
        <CurveBucketCards cards={cards} bucket={shownBucket} />
      )}
    </div>
  );
}
