/**
 * What stands between a deck and a lower target bracket (I-77 slice 4,
 * requirements 5.1 to 5.4, `docs/product/specs/i77-a-bracket-estimate-players-can-audit.md`).
 *
 * Reads a `BracketAssessment` and gives the lines of the "To reach bracket N"
 * list, as data: the official floors above the target first, with their
 * cards, then each heuristic term above it. Pure: no clock, no store, no
 * text. The builder words each line through next-intl.
 *
 * Not responsible for: the estimate itself (`explainBracket`), naming a
 * replacement card (5.3 forbids it), or the audit view (slice 2).
 *
 * @module deck/path-to-bracket
 */
import {
  BRACKET_DEFINITIONS,
  type BracketLevel,
  type BracketRestriction,
} from "@/lib/constants/brackets";
import type {
  BracketAssessment,
  BracketFloorRow,
  BracketTerm,
  BracketTermKey,
  TermMeasure,
  TermThreshold,
} from "./bracket-assessment";
import { scoreTerm } from "./bracket-terms";

/** One line of the path to a target bracket. */
export type BracketPathLine =
  | {
      /**
       * The target is Bracket 5: a list cannot show the cEDH intent that
       * sets it apart, so the estimate stops at 4 (I-77 1.3).
       */
      readonly kind: "cedhIntent";
    }
  | {
      /** The target is at or above the estimate (I-77 5.4). */
      readonly kind: "noRuleStops";
      readonly target: BracketLevel;
    }
  | {
      /** More Game Changers than the target allows (I-77 5.1). */
      readonly kind: "gameChangerFloor";
      readonly target: BracketLevel;
      /** The most Game Changers the target allows. */
      readonly allowed: number;
      readonly count: number;
      readonly cards: readonly string[];
    }
  | {
      /** Another official restriction the target does not allow (I-77 5.1). */
      readonly kind: "restrictionFloor";
      readonly rule: Exclude<BracketRestriction, "gameChangers">;
      readonly target: BracketLevel;
      readonly count: number;
      readonly cards: readonly string[];
    }
  | {
      /**
       * The two-card-combo floor was not checked: combo data was
       * unavailable, so the estimate was made without it (I-77 4.3).
       */
      readonly kind: "comboFloorNotChecked";
    }
  | {
      /** A list under 60 cards: its terms do not count (I-77 2.6). */
      readonly kind: "tooFewCards";
      readonly deckSize: number;
    }
  | {
      /**
       * A heuristic term that reads above the target, and the bound on one of
       * its counts past which it would read the target or lower (I-77 5.2):
       * `value` or fewer for `higherIsStronger`, above `bound` for
       * `lowerIsStronger`.
       */
      readonly kind: "term";
      readonly key: BracketTermKey;
      readonly score: number;
      readonly measure: TermMeasure;
      readonly value: number;
      readonly direction: TermThreshold["direction"];
      readonly bound: number;
      readonly wouldRead: number;
    }
  | {
      /** A term above the target that no single count brings down to it. */
      readonly kind: "termOutOfReach";
      readonly key: BracketTermKey;
      readonly score: number;
    };

/** The bracket only a declaration reaches: no list signal shows cEDH intent. */
const CEDH_BRACKET: BracketLevel = 5;

/** A bound to cross and a value past it to re-run the term with. */
interface Crossing {
  readonly bound: number;
  readonly value: number;
}

type CheckedFloorRow = Extract<BracketFloorRow, { status: "checked" }>;

function floorLine(
  row: CheckedFloorRow,
  target: BracketLevel
): BracketPathLine {
  const { count, cards } = row;
  if (row.rule === "gameChangers") {
    const allowed = BRACKET_DEFINITIONS[target].maxGameChangers;
    return { kind: "gameChangerFloor", target, allowed, count, cards };
  }
  return { kind: "restrictionFloor", rule: row.rule, target, count, cards };
}

/**
 * The checked floor rows that set a floor above the target, in floor order.
 * A row slice 3 checks (mass land denial, extra turns) joins the list here
 * without a change.
 */
function floorLines(
  assessment: BracketAssessment,
  target: BracketLevel
): readonly BracketPathLine[] {
  return assessment.floors.flatMap((row) =>
    row.status === "checked" && row.floor > target
      ? [floorLine(row, target)]
      : []
  );
}

/**
 * The combo floor, when the estimate could not check it for lack of combo
 * data (I-77 4.3). A floor this method does not detect yet (mass land denial,
 * extra turns) is a blind spot of the method, which the audit view words
 * (slice 2), not a gap of this deck's data.
 */
function notCheckedLines(
  assessment: BracketAssessment
): readonly BracketPathLine[] {
  const comboDataMissing = assessment.floors.some(
    (row) =>
      row.status === "notChecked" && row.reason === "comboDataUnavailable"
  );
  return comboDataMissing ? [{ kind: "comboFloorNotChecked" }] : [];
}

/**
 * The bounds a threshold's value could cross to read lower, nearest first.
 * A rising count crosses a bound by falling to it; a falling one (average
 * mana value) by rising above it, re-run at the next bound up, or one above
 * the last, which every value past the bound reads the same as.
 */
function crossings(threshold: TermThreshold): readonly Crossing[] {
  const { value, bounds } = threshold;
  if (threshold.direction === "higherIsStronger") {
    return bounds
      .filter((bound) => bound < value)
      .toReversed()
      .map((bound) => ({ bound, value: bound }));
  }
  return bounds.flatMap((bound, index) =>
    bound >= value ? [{ bound, value: bounds[index + 1] ?? bound + 1 }] : []
  );
}

/** The term re-scored with one threshold's value replaced. */
function rescore(
  term: BracketTerm,
  changed: TermThreshold,
  value: number
): number {
  return scoreTerm(
    term.key,
    term.thresholds.map((threshold) =>
      threshold === changed ? { ...threshold, value } : threshold
    )
  );
}

/**
 * The nearest change to one count that brings a term to the target or
 * lower, trying its counts in the term's order; out of reach when none does.
 */
function termLine(term: BracketTerm, target: BracketLevel): BracketPathLine {
  const nearest = term.thresholds
    .flatMap((threshold) =>
      crossings(threshold).map((crossing) => ({
        threshold,
        bound: crossing.bound,
        wouldRead: rescore(term, threshold, crossing.value),
      }))
    )
    .find((option) => option.wouldRead <= target);
  if (!nearest) {
    return { kind: "termOutOfReach", key: term.key, score: term.score };
  }
  return {
    kind: "term",
    key: term.key,
    score: term.score,
    measure: nearest.threshold.measure,
    value: nearest.threshold.value,
    direction: nearest.threshold.direction,
    bound: nearest.bound,
    wouldRead: nearest.wouldRead,
  };
}

/**
 * The heuristic part of the path. A list under 60 cards gets one line saying
 * its terms do not count (I-77 2.6). Otherwise the terms above the target are
 * listed when the heuristic reads above it: a term above the target does not
 * stand in the way when the mean of the terms does not.
 */
function heuristicLines(
  assessment: BracketAssessment,
  target: BracketLevel
): readonly BracketPathLine[] {
  const { kind, deckSize, heuristic, terms } = assessment.heuristicPart;
  if (kind === "tooFewCards") {
    return [{ kind: "tooFewCards", deckSize: deckSize.count }];
  }
  if (Math.round(heuristic) <= target) return [];
  return terms
    .filter((term) => term.score > target)
    .map((term) => termLine(term, target));
}

/**
 * Lists what stands between a deck's estimate and a lower target bracket.
 *
 * Floors come first, in the assessment's floor order, then the floors left
 * unchecked, then the terms in their order, so the same assessment always
 * gives the same lines (I-77 1.5). A target at or above the estimate gets one
 * line saying no official rule stops the deck there (5.4), followed by the
 * unchecked floors, since that holds only for the floors that were checked
 * (4.3). A Bracket 5 target gets only the cEDH line (1.3).
 *
 * @param assessment - an assessment from `explainBracket`
 * @param target - the bracket the player aims for
 * @returns the lines of the list, floors first
 */
export function pathToBracket(
  assessment: BracketAssessment,
  target: BracketLevel
): readonly BracketPathLine[] {
  if (target === CEDH_BRACKET) return [{ kind: "cedhIntent" }];
  const unchecked = notCheckedLines(assessment);
  if (target >= assessment.estimate) {
    return [{ kind: "noRuleStops", target }, ...unchecked];
  }
  return [
    ...floorLines(assessment, target),
    ...unchecked,
    ...heuristicLines(assessment, target),
  ];
}
