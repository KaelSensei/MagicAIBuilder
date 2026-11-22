"use client";
/**
 * Lands in the opening hand: the section of the Draw odds panel that shows how
 * many lands an opening seven holds on average, the chance of each count from
 * 0 to 7, and the chance of N lands by turn N for turns 1 to 7.
 *
 * Deck analysis, I-97. Every figure is an exact count of equally likely hands
 * (`openingHandLands`), never a simulated game, so the same deck always shows
 * the same digits and every edit to the deck moves them. Lands are the
 * main-deck cards filed under the "land" category, as `countLibrary` and the
 * deck stats count them. Both counts are tables with header cells, so no
 * figure is carried by a bar or a colour alone. A library without figures
 * names what is missing with the panel's own gap sentences.
 * Not responsible for: the figures (`lib/deck/opening-hand-lands.ts`), the
 * table the deck is played at (`usualTable`, chosen by the panel), mulligans
 * or the castability of a curve (I-31).
 *
 * @module components/deck/OpeningHandLands
 */
import { useId, useMemo } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { TableSize } from "@/lib/deck/cards-drawn";
import { CHANCE_PERCENT_FORMAT } from "@/lib/deck/chance-percent-format";
import {
  countLibrary,
  type DrawOddsTarget,
} from "@/lib/deck/draw-odds-library";
import {
  openingHandLands,
  type LandCountChance,
  type LandDropChance,
  type OpeningHandLands as LandFigures,
} from "@/lib/deck/opening-hand-lands";
import type { Deck } from "@/lib/deck/types";

/** The section counts the deck's lands, whatever the panel's question asks. */
const LANDS: DrawOddsTarget = { kind: "lands" };

/** A small explanatory line, as under the panel's figure. */
const NOTE_CLASS =
  "mt-2 text-[10px] leading-snug text-[var(--text-secondary)] opacity-70";

const TABLE_CLASS = "mt-2 w-full text-xs";
const CAPTION_CLASS = "mb-1 text-left text-[var(--text-secondary)]";
const HEAD_CLASS =
  "py-1 text-left font-normal text-[var(--text-secondary)] [&:last-child]:text-right";
const ROW_HEAD_CLASS =
  "py-1 text-left font-normal text-[var(--text-secondary)]";
const CELL_CLASS = "py-1 text-[var(--text-primary)]";
const FIGURE_CLASS = "py-1 text-right font-medium text-[var(--text-primary)]";

/**
 * The chance of exactly 0 to 7 lands in the opening seven, one row a count.
 */
function LandSpreadTable({
  spread,
}: {
  readonly spread: readonly LandCountChance[];
}) {
  const t = useTranslations("deck.drawOdds.openingLands");
  const format = useFormatter();

  return (
    <table className={TABLE_CLASS}>
      <caption className={CAPTION_CLASS}>{t("spreadCaption")}</caption>
      <thead>
        <tr>
          <th scope="col" className={HEAD_CLASS}>
            {t("landsColumn")}
          </th>
          <th scope="col" className={HEAD_CLASS}>
            {t("chanceColumn")}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--border)]">
        {spread.map((row) => (
          <tr key={row.lands}>
            <th scope="row" className={ROW_HEAD_CLASS}>
              {t("landCount", { lands: row.lands })}
            </th>
            <td className={FIGURE_CLASS}>
              {format.number(row.probability, CHANCE_PERCENT_FORMAT)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The chance of at least N lands by turn N, one row a turn: one land drop a
 * turn (CR 305.2), so N lands by turn N is a land drop on every turn so far.
 */
function LandDropTable({
  landDrops,
}: {
  readonly landDrops: readonly LandDropChance[];
}) {
  const t = useTranslations("deck.drawOdds");
  const format = useFormatter();

  return (
    <table className={TABLE_CLASS}>
      <caption className={CAPTION_CLASS}>
        {t("openingLands.dropsCaption")}
      </caption>
      <thead>
        <tr>
          <th scope="col" className={HEAD_CLASS}>
            {t("openingLands.turnColumn")}
          </th>
          <th scope="col" className={HEAD_CLASS}>
            {t("openingLands.landsColumn")}
          </th>
          <th scope="col" className={HEAD_CLASS}>
            {t("openingLands.chanceColumn")}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--border)]">
        {landDrops.map((drop) => (
          <tr key={drop.turn}>
            <th scope="row" className={ROW_HEAD_CLASS}>
              {t("turn", { turn: drop.turn })}
            </th>
            <td className={CELL_CLASS}>
              {t("openingLands.landsByTurn", { lands: drop.turn })}
            </td>
            <td className={FIGURE_CLASS}>
              {format.number(drop.probability, CHANCE_PERCENT_FORMAT)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The figures, or the panel's sentence for what is missing: never a table of
 * zeros standing in for a library with nothing to count.
 */
function LandFiguresView({
  figures,
  table,
}: {
  readonly figures: LandFigures;
  readonly table: TableSize;
}) {
  const t = useTranslations("deck.drawOdds");

  switch (figures.kind) {
    case "unknown":
      return (
        <p className="text-xs text-[var(--text-secondary)]">
          {t(`gap.${figures.reason}`)}
        </p>
      );
    case "known":
      return (
        <>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {t("openingLands.average", { average: figures.averageLands })}
          </p>
          <LandSpreadTable spread={figures.spread} />
          <p className={NOTE_CLASS}>{t("openingLands.roundingNote")}</p>
          <LandDropTable landDrops={figures.landDrops} />
          {/* CR 103.8a and 103.8c: the panel's own note on the first draw. */}
          <p className={NOTE_CLASS}>
            {t("openingLands.drawsNote", {
              drawRule: t("drawRule", { table }),
            })}
          </p>
          {/* CR 103.5: the opening seven is counted as dealt, never mulliganed. */}
          <p className={NOTE_CLASS}>{t("openingLands.scopeNote")}</p>
        </>
      );
  }
  const _exhaustive: never = figures;
  return _exhaustive;
}

interface OpeningHandLandsProps {
  /** The deck asked about; only its cards are read */
  readonly deck: Pick<Deck, "cards">;
  /** The table the deck is played at, which decides the turn-1 draw */
  readonly table: TableSize;
}

/**
 * The lands of the deck's opening hand and first turns: the average, the
 * spread from 0 to 7 and the land drops of turns 1 to 7, recounted on every
 * edit to the deck. Keeps no state and makes no request.
 *
 * @param props.deck - the deck asked about
 * @param props.table - the table the deck is played at
 */
export function OpeningHandLands({ deck, table }: OpeningHandLandsProps) {
  const t = useTranslations("deck.drawOdds.openingLands");
  const headingId = useId();
  const figures = useMemo(
    () => openingHandLands(countLibrary(deck, LANDS), table),
    [deck, table]
  );

  return (
    <section
      aria-labelledby={headingId}
      className="mt-3 border-t border-[var(--border)] pt-3"
    >
      <h4
        id={headingId}
        className="mb-2 text-xs uppercase tracking-wide text-[var(--text-secondary)]"
      >
        {t("title")}
      </h4>
      <LandFiguresView figures={figures} table={table} />
    </section>
  );
}
