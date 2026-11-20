"use client";
/**
 * One captioned table of the `/stats` page: a row per value, each with its
 * deck count over its denominator, a bar that repeats that figure, and links
 * to the decks behind it (I-60 requirements 1.2, 2.3 and 2.4).
 *
 * The bar is decorative: the figure beside it carries the meaning in text,
 * every bar shares one colour, and the table is the chart's text equivalent.
 *
 * @module components/stats/StatsFigureTable
 */
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** One value of a table and the decks that hold it. */
export interface FigureRow {
  readonly key: string;
  readonly label: ReactNode;
  readonly deckIds: readonly string[];
  /** True when the count is a floor, read "at least" (requirement 3.5) */
  readonly atLeast?: boolean;
}

/** What one table shows. */
export interface StatsFigureTableProps {
  readonly caption: string;
  /** The heading of the value column */
  readonly header: string;
  readonly rows: readonly FigureRow[];
  /** The denominator of every row */
  readonly total: number;
  readonly deckNames: ReadonlyMap<string, string>;
  /** A sentence shown above the table */
  readonly note?: ReactNode;
}

/** The class of a body cell in every table of the page. */
export const STATS_CELL = "border-t border-[var(--border)] px-2 py-2 align-top";

/** A captioned table of deck counts, each with its denominator and its decks. */
export function StatsFigureTable(props: StatsFigureTableProps) {
  const { caption, header, rows, total, deckNames, note } = props;
  const t = useTranslations("stats");
  return (
    <section className="overflow-x-auto">
      {note && (
        <p className="mb-2 text-sm text-[var(--text-secondary)]">{note}</p>
      )}
      <table className="w-full text-left text-sm">
        <caption className="mb-2 text-left text-lg font-semibold">
          {caption}
        </caption>
        <thead className="text-xs uppercase text-[var(--text-secondary)]">
          <tr>
            <th scope="col" className="px-2 py-1">
              {header}
            </th>
            <th scope="col" className="px-2 py-1">
              {t("decksHeader")}
            </th>
            <th scope="col" className="px-2 py-1">
              {t("linksHeader")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row" className={`${STATS_CELL} font-medium`}>
                {row.label}
              </th>
              <td className={STATS_CELL}>
                <DeckFigure
                  count={row.deckIds.length}
                  total={total}
                  atLeast={row.atLeast}
                />
              </td>
              <td className={STATS_CELL}>
                <DeckLinks deckIds={row.deckIds} deckNames={deckNames} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** What a figure shows. */
export interface DeckFigureProps {
  readonly count: number;
  readonly total: number;
  readonly atLeast?: boolean;
}

/** "7 of 12 decks", with a bar of the same share beside it. */
export function DeckFigure({ count, total, atLeast = false }: DeckFigureProps) {
  const t = useTranslations("stats");
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="whitespace-nowrap">
        {t(atLeast ? "atLeastOfDecks" : "ofDecks", { count, total })}
      </span>
      <span
        aria-hidden="true"
        className="h-2 w-20 shrink-0 rounded bg-[var(--surface-hover)]"
      >
        <span
          className="block h-2 rounded bg-[var(--accent)]"
          style={{ width: `${percent}%` }}
        />
      </span>
    </div>
  );
}

/** What a list of deck links shows. */
export interface DeckLinksProps {
  readonly deckIds: readonly string[];
  readonly deckNames: ReadonlyMap<string, string>;
}

/** Links to the decks behind a figure, each by its name. */
export function DeckLinks({ deckIds, deckNames }: DeckLinksProps) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {deckIds.map((deckId) => (
        <li key={deckId}>
          <Link
            href={`/builder/${deckId}`}
            className="text-[var(--accent-text)] underline-offset-2 hover:underline"
          >
            {deckNames.get(deckId) ?? deckId}
          </Link>
        </li>
      ))}
    </ul>
  );
}
