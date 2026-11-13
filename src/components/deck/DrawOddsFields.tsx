"use client";
/**
 * Draw odds fields: the three labelled controls that state a draw-odds
 * question — what to look for, when, and at least how many.
 *
 * Deck analysis, I-97. Each field is a native control with a visible label,
 * so it has an accessible name and a keyboard path without extra wiring.
 * Not responsible for: the answer or its inputs (`DrawOddsPanel`).
 *
 * @module components/deck/DrawOddsFields
 */
import { useId } from "react";
import { useTranslations } from "next-intl";
import type { DrawPoint } from "@/lib/deck/cards-drawn";
import type { DrawOddsTarget } from "@/lib/deck/draw-odds-library";

/** Value of the "Lands" option; a card option's value is its name after `CARD_VALUE_PREFIX`. */
const LANDS_VALUE = "lands";
const CARD_VALUE_PREFIX = "card:";

/** Value of the "Opening hand" option; a turn's option value is its number. */
const OPENING_HAND_VALUE = "opening-hand";

/**
 * Turns offered after the opening hand. Ten covers the early and middle game a
 * land or a key card is asked about; a turn that draws more cards than a short
 * library holds is still offered, and the panel names that gap.
 */
const TURNS_OFFERED = 10;
const OFFERED_TURNS: readonly number[] = Array.from(
  { length: TURNS_OFFERED },
  (_, index) => index + 1
);

/** Shared look of the fields. */
const FIELD_CLASS =
  "rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]";

/** A field's label, on the left of its control. */
const LABEL_CLASS = "text-xs text-[var(--text-secondary)]";

/** A field's row: the label on the left, the control on the right. */
const ROW_CLASS = "flex items-center justify-between gap-2";

/**
 * The target a select value stands for.
 *
 * @param value - `LANDS_VALUE`, or a card name after `CARD_VALUE_PREFIX`
 */
function targetFromValue(value: string): DrawOddsTarget {
  return value.startsWith(CARD_VALUE_PREFIX)
    ? { kind: "card", name: value.slice(CARD_VALUE_PREFIX.length) }
    : { kind: "lands" };
}

/** @returns the select value that stands for a target */
function valueOfTarget(target: DrawOddsTarget): string {
  return target.kind === "card"
    ? `${CARD_VALUE_PREFIX}${target.name}`
    : LANDS_VALUE;
}

/**
 * The draw point a select value stands for.
 *
 * @param value - `OPENING_HAND_VALUE`, or a turn number from `OFFERED_TURNS`
 */
function drawPointFromValue(value: string): DrawPoint {
  return value === OPENING_HAND_VALUE
    ? { kind: "opening-hand" }
    : { kind: "turn", turn: Number(value) };
}

/** @returns the select value that stands for a draw point */
function valueOfDrawPoint(point: DrawPoint): string {
  return point.kind === "turn" ? String(point.turn) : OPENING_HAND_VALUE;
}

/**
 * What the question counts: the lands, or one card of the library.
 *
 * @param props.target - the target shown as selected
 * @param props.cardNames - the library's card names, one option each
 * @param props.onChange - receives the target the player picks
 */
export function DrawOddsTargetField({
  target,
  cardNames,
  onChange,
}: {
  readonly target: DrawOddsTarget;
  readonly cardNames: readonly string[];
  readonly onChange: (target: DrawOddsTarget) => void;
}) {
  const t = useTranslations("deck.drawOdds");
  const id = useId();

  return (
    <div className={ROW_CLASS}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {t("target")}
      </label>
      <select
        id={id}
        value={valueOfTarget(target)}
        onChange={(event) => onChange(targetFromValue(event.target.value))}
        className={`min-w-0 max-w-[60%] ${FIELD_CLASS}`}
      >
        <option value={LANDS_VALUE}>{t("lands")}</option>
        <optgroup label={t("cardGroup")}>
          {cardNames.map((name) => (
            <option key={name} value={`${CARD_VALUE_PREFIX}${name}`}>
              {name}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}

/**
 * When the question looks: the opening hand, or one of the first
 * `TURNS_OFFERED` turns.
 *
 * @param props.point - the draw point shown as selected
 * @param props.onChange - receives the draw point the player picks
 */
export function DrawOddsPointField({
  point,
  onChange,
}: {
  readonly point: DrawPoint;
  readonly onChange: (point: DrawPoint) => void;
}) {
  const t = useTranslations("deck.drawOdds");
  const id = useId();

  return (
    <div className={ROW_CLASS}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {t("drawPoint")}
      </label>
      <select
        id={id}
        value={valueOfDrawPoint(point)}
        onChange={(event) => onChange(drawPointFromValue(event.target.value))}
        className={FIELD_CLASS}
      >
        <option value={OPENING_HAND_VALUE}>{t("openingHand")}</option>
        {OFFERED_TURNS.map((turn) => (
          <option key={turn} value={String(turn)}>
            {t("turn", { turn })}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * The fewest matching cards that answer "yes", as the player types it. The
 * text is passed through unparsed, so a blank field stays blank.
 *
 * @param props.value - the field's text
 * @param props.onChange - receives the text the player types
 */
export function DrawOddsMinimumField({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const t = useTranslations("deck.drawOdds");
  const id = useId();

  return (
    <div className={ROW_CLASS}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {t("minimum")}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-16 ${FIELD_CLASS}`}
      />
    </div>
  );
}
