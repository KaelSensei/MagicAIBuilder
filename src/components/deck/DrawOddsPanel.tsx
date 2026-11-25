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
 * A question without an answer names what is missing instead of showing 0%:
 * the formula's gaps, a minimum above the cards drawn among them, and the
 * lands question in a deck without lands, whose 0% a player would misread.
 * Not responsible for: the formula (`lib/deck/draw-odds.ts`), the library
 * count (`lib/deck/draw-odds-library.ts`), the draw count
 * (`lib/deck/cards-drawn.ts`) or the controls (`DrawOddsFields`).
 *
 * @module components/deck/DrawOddsPanel
 */
import { useCallback, useId, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { cardsDrawnBy, usualTable, type DrawPoint } from "@/lib/deck/cards-drawn";
import { CHANCE_PERCENT_FORMAT } from "@/lib/deck/chance-percent-format";
import {
  chanceOfAtLeast,
  type DrawOdds,
  type DrawOddsGap,
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
import { OpeningHandLands } from "./OpeningHandLands";

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
 * Why the panel shows no figure: one of the formula's gaps, or `no-lands`,
 * the lands question in a deck whose library holds no land. The formula
 * answers that one with a known 0%, but a player would read the zero as a
 * measured chance (I-97 AC-97-05).
 */
type PanelGap = DrawOddsGap | "no-lands";

/** The answer the panel shows: the formula's, or a gap the panel names. */
type PanelOdds =
  DrawOdds | { readonly kind: "unknown"; readonly reason: PanelGap };

/** The panel's translator, scoped to the draw-odds messages. */
type DrawOddsTranslate = ReturnType<typeof useTranslations<"deck.drawOdds">>;

/**
 * Whether the player must fix the formula's gap before a missing land
 * matters. Every gap but `more-wanted-than-drawn` does: with no land in the
 * library, no minimum, however low, gets a land into the hand, so `no-lands`
 * names the deeper fix.
 *
 * @param odds - the formula's answer
 */
function comesBeforeNoLands(odds: DrawOdds): boolean {
  return odds.kind === "unknown" && odds.reason !== "more-wanted-than-drawn";
}

/**
 * The formula's answer, unless the lands question meets a deck without lands
 * (see `PanelGap`). The gaps come in the order the player fixes them.
 *
 * @param question - the counts the formula takes
 * @param target - what the question counts as a hit
 */
function answerOf(
  question: DrawOddsQuestion,
  target: DrawOddsTarget
): PanelOdds {
  const odds = chanceOfAtLeast(question);
  if (comesBeforeNoLands(odds)) return odds;
  if (target.kind === "lands" && question.matching === 0) {
    return { kind: "unknown", reason: "no-lands" };
  }
  return odds;
}

/**
 * The sentence that names a gap. Only the minimum above the cards drawn
 * quotes the counts, so the player sees which number to change.
 *
 * @param reason - why the panel shows no figure
 * @param question - the counts the sentence may quote
 * @param t - the draw-odds translator
 */
function gapSentence(
  reason: PanelGap,
  question: DrawOddsQuestion,
  t: DrawOddsTranslate
): string {
  switch (reason) {
    case "empty-library":
    case "more-drawn-than-library":
    case "more-matching-than-library":
    case "not-a-card-count":
    case "no-lands":
      return t(`gap.${reason}`);
    case "more-wanted-than-drawn":
      return t("gap.more-wanted-than-drawn", {
        minimum: question.minimum,
        drawn: question.drawn,
      });
  }
  const _exhaustive: never = reason;
  return _exhaustive;
}

/**
 * The answer, announced as a status: the chance as a percentage, or, when the
 * question has no answer, what is missing. Never a zero standing in for an
 * unknown value.
 */
function OddsFigure({
  odds,
  question,
}: {
  readonly odds: PanelOdds;
  readonly question: DrawOddsQuestion;
}) {
  const t = useTranslations("deck.drawOdds");
  const format = useFormatter();

  switch (odds.kind) {
    case "known":
      return (
        <output className="block text-lg font-semibold text-[var(--text-primary)]">
          {format.number(odds.probability, CHANCE_PERCENT_FORMAT)}
        </output>
      );
    case "unknown":
      return (
        <output className="block text-xs text-[var(--text-secondary)]">
          {gapSentence(odds.reason, question, t)}
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
  const odds = useMemo(() => answerOf(question, target), [question, target]);

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
      <OddsFigure odds={odds} question={question} />
      <QuestionInputs question={question} />
      {drawPoint.kind === "turn" && (
        <p className={NOTE_CLASS}>{t("drawRule", { table })}</p>
      )}
      <OpeningHandLands deck={deck} table={table} />
      <p className={NOTE_CLASS}>{t("countNotGame")}</p>
    </section>
  );
}
