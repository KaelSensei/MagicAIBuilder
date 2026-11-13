"use client";
/**
 * Draw odds panel: the exact chance of drawing at least a minimum number of
 * lands, or of copies of one chosen card, in the opening hand or by a chosen
 * turn, shown beside the four inputs of the formula.
 *
 * Deck analysis, I-97. The figure is a count of equally likely hands
 * (`chanceOfAtLeast`), never a simulated or recorded game, so the same deck
 * always shows the same digits. The library comes from `countLibrary`: the
 * main deck only, 99 cards or 98 with a partner (CR 401.1, 903.6). The cards
 * drawn by a turn follow the format's usual table (`cardsDrawnBy`, CR 103.8).
 * A question without an answer names what is missing instead of showing 0%.
 * Not responsible for: the formula (`lib/deck/draw-odds.ts`), the library
 * count (`lib/deck/draw-odds-library.ts`), the draw count
 * (`lib/deck/cards-drawn.ts`) or the controls (`DrawOddsFields`).
 *
 * @module components/deck/DrawOddsPanel
 */
import { useCallback, useId, useMemo, useState } from "react";
import {
  useFormatter,
  useTranslations,
  type NumberFormatOptions,
} from "next-intl";
import { cardsDrawnBy, usualTable, type DrawPoint } from "@/lib/deck/cards-drawn";
import {
  chanceOfAtLeast,
  type DrawOdds,
  type DrawOddsQuestion,
} from "@/lib/deck/draw-odds";
import {
  countLibrary,
  libraryCardNames,
  type DrawOddsTarget,
} from "@/lib/deck/draw-odds-library";
import type { Deck } from "@/lib/deck/types";
import {
  DrawOddsMinimumField,
  DrawOddsPointField,
  DrawOddsTargetField,
} from "./DrawOddsFields";

/** The default question: the deck's lands. */
const LANDS: DrawOddsTarget = { kind: "lands" };

/** The default draw point: the opening hand. */
const OPENING_HAND: DrawPoint = { kind: "opening-hand" };

/**
 * The minimum a new question starts from: three lands, the question I-97's
 * definition of done names, or one copy of a chosen card, its outcome's
 * "at least one copy".
 */
const DEFAULT_MINIMUM: Readonly<Record<DrawOddsTarget["kind"], number>> = {
  lands: 3,
  card: 1,
};

/**
 * A chance as a percentage with one decimal, in the reader's locale: "50.1%"
 * in English, "50,1 %" in French. The fixed decimal keeps the digits stable
 * from one open to the next.
 */
const PERCENT_FORMAT: Readonly<NumberFormatOptions> = {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

/** A small explanatory line under the figure. */
const NOTE_CLASS =
  "mt-2 text-[10px] leading-snug text-[var(--text-secondary)] opacity-70";

/**
 * Reads a count the player typed. A blank field is not a zero: it stays
 * `NaN`, which `chanceOfAtLeast` reports as `not-a-card-count`.
 *
 * @param text - the field's value, as the number input hands it over
 * @returns the number typed, or `NaN` when the field is blank
 */
function parseCardCount(text: string): number {
  return text.trim() === "" ? Number.NaN : Number(text);
}

/**
 * The target the panel asks about. A chosen card that has left the library,
 * moved to Considering or removed, has no option left to show, so the
 * question goes back to the lands rather than counting a card the select no
 * longer names.
 *
 * @param chosen - the target the player last chose
 * @param cardNames - the names the library holds now
 */
function targetStillInLibrary(
  chosen: DrawOddsTarget,
  cardNames: readonly string[]
): DrawOddsTarget {
  return chosen.kind === "card" && !cardNames.includes(chosen.name)
    ? LANDS
    : chosen;
}

/**
 * The answer, announced as a status: the chance as a percentage, or, when the
 * question has no answer, what is missing. Never a zero standing in for an
 * unknown value.
 */
function OddsFigure({ odds }: { readonly odds: DrawOdds }) {
  const t = useTranslations("deck.drawOdds");
  const format = useFormatter();

  switch (odds.kind) {
    case "known":
      return (
        <output className="block text-lg font-semibold text-[var(--text-primary)]">
          {format.number(odds.probability, PERCENT_FORMAT)}
        </output>
      );
    case "unknown":
      return (
        <output className="block text-xs text-[var(--text-secondary)]">
          {t(`gap.${odds.reason}`)}
        </output>
      );
  }
  const _exhaustive: never = odds;
  return _exhaustive;
}

/**
 * The inputs of the formula, as a list of labelled counts, so the player can
 * check the figure by hand. A count the player left blank reads "not set".
 */
function QuestionInputs({ question }: { readonly question: DrawOddsQuestion }) {
  const t = useTranslations("deck.drawOdds");
  const rows = [
    { label: t("librarySize"), value: question.librarySize },
    { label: t("matching"), value: question.matching },
    { label: t("drawn"), value: question.drawn },
    { label: t("minimum"), value: question.minimum },
  ];

  return (
    <dl className="divide-y divide-[var(--border)]">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between py-1">
          <dt className="text-xs text-[var(--text-secondary)]">{row.label}</dt>
          <dd className="text-xs font-medium text-[var(--text-primary)]">
            {Number.isFinite(row.value) ? row.value : t("notSet")}
          </dd>
        </div>
      ))}
    </dl>
  );
}

interface DrawOddsPanelProps {
  /** The deck asked about: its cards, and its format for the turn draws. */
  readonly deck: Pick<Deck, "cards" | "format">;
}

/**
 * The chance of drawing at least the minimum of lands, or of one chosen card,
 * by the chosen point of the game, with the inputs that produced it and the
 * reminder that it is a count of hands. Starts on three lands in the opening
 * hand. Keeps no state outside the component and makes no request.
 *
 * @param props.deck - the deck asked about
 */
export function DrawOddsPanel({ deck }: DrawOddsPanelProps) {
  const t = useTranslations("deck.drawOdds");
  const headingId = useId();
  const [chosenTarget, setChosenTarget] = useState<DrawOddsTarget>(LANDS);
  const [drawPoint, setDrawPoint] = useState<DrawPoint>(OPENING_HAND);
  const [minimumText, setMinimumText] = useState(
    String(DEFAULT_MINIMUM.lands)
  );

  const cardNames = useMemo(() => libraryCardNames(deck), [deck]);
  const target = targetStillInLibrary(chosenTarget, cardNames);
  const table = usualTable(deck.format);
  const library = useMemo(() => countLibrary(deck, target), [deck, target]);
  const question = useMemo<DrawOddsQuestion>(
    () => ({
      ...library,
      drawn: cardsDrawnBy(drawPoint, table),
      minimum: parseCardCount(minimumText),
    }),
    [library, drawPoint, table, minimumText]
  );
  const odds = useMemo(() => chanceOfAtLeast(question), [question]);

  const chooseTarget = useCallback((next: DrawOddsTarget) => {
    setChosenTarget(next);
    setMinimumText(String(DEFAULT_MINIMUM[next.kind]));
  }, []);

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4"
    >
      <h3
        id={headingId}
        className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2"
      >
        {t("title")}
      </h3>
      <div className="mb-2 space-y-2">
        <DrawOddsTargetField
          target={target}
          cardNames={cardNames}
          onChange={chooseTarget}
        />
        <DrawOddsPointField point={drawPoint} onChange={setDrawPoint} />
        <DrawOddsMinimumField value={minimumText} onChange={setMinimumText} />
      </div>
      <OddsFigure odds={odds} />
      <QuestionInputs question={question} />
      {drawPoint.kind === "turn" && (
        <p className={NOTE_CLASS}>{t("drawRule", { table })}</p>
      )}
      <p className={NOTE_CLASS}>{t("countNotGame")}</p>
    </section>
  );
}
