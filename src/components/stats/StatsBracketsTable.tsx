"use client";
/**
 * The brackets table of the `/stats` page: for each bracket, the Commander
 * decks estimated at it beside the decks whose player aims for it (I-60
 * requirement 2.2). The estimate is made without combo data, which the note
 * under the table says (I-77 4.3).
 *
 * @module components/stats/StatsBracketsTable
 */
import { useTranslations } from "next-intl";
import type { BracketCount } from "@/lib/deck/player-stats";
import { DeckFigure, DeckLinks, STATS_CELL } from "./StatsFigureTable";

/** What the brackets table shows. */
export interface StatsBracketsTableProps {
  readonly brackets: readonly BracketCount[];
  /** The Commander decks counted: the denominator of every cell */
  readonly total: number;
  readonly deckNames: ReadonlyMap<string, string>;
}

/** Decks per estimated bracket beside decks per target bracket. */
export function StatsBracketsTable({
  brackets,
  total,
  deckNames,
}: StatsBracketsTableProps) {
  const t = useTranslations("stats");
  return (
    <section className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="mb-2 text-left text-lg font-semibold">
          {t("brackets.caption")}
        </caption>
        <thead className="text-xs uppercase text-[var(--text-secondary)]">
          <tr>
            <th scope="col" className="px-2 py-1">
              {t("brackets.header")}
            </th>
            <th scope="col" className="px-2 py-1">
              {t("brackets.computedHeader")}
            </th>
            <th scope="col" className="px-2 py-1">
              {t("brackets.targetHeader")}
            </th>
          </tr>
        </thead>
        <tbody>
          {brackets.map((entry) => (
            <tr key={entry.bracket}>
              <th scope="row" className={`${STATS_CELL} font-medium`}>
                {t("brackets.level", { level: entry.bracket })}
              </th>
              <td className={STATS_CELL}>
                <DeckFigure
                  count={entry.computedDeckIds.length}
                  total={total}
                />
                <DeckLinks
                  deckIds={entry.computedDeckIds}
                  deckNames={deckNames}
                />
              </td>
              <td className={STATS_CELL}>
                <DeckFigure count={entry.targetDeckIds.length} total={total} />
                <DeckLinks
                  deckIds={entry.targetDeckIds}
                  deckNames={deckNames}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {t("brackets.comboNote")}
      </p>
    </section>
  );
}
