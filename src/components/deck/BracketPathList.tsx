"use client";
/**
 * The "To reach Bracket N" list: what stands between a Commander deck's
 * estimated bracket and the target the player picked (I-77 slice 4,
 * requirements 5.1 to 5.4).
 *
 * Context: deck building (ui), under the target picker in `DeckDetailsPanel`.
 * It computes the assessment as the builder's badge does, `computeDeckStats`
 * then `explainBracket`, with the combos `useCombos` found: the same cached
 * query the builder page reads, mapped by the same `comboDataOf`. A lookup
 * still pending says the combo floor is being checked, and a failed one says
 * it was not checked (4.3, issue #1840). Every line is a
 * sentence, never a colour alone, and the bracket is called "estimated",
 * never "your bracket" (1.2).
 *
 * Not responsible for: the audit view and the badge (`BracketIndicator`,
 * slice 2), or saving the target.
 *
 * @module deck/BracketPathList
 */
import { useId, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { BracketAssessment } from "@/lib/deck/bracket-assessment";
import { comboDataOf } from "@/lib/deck/combo-data-of";
import { explainBracket, type ComboData } from "@/lib/deck/explain-bracket";
import {
  pathToBracket,
  type BracketPathLine,
} from "@/lib/deck/path-to-bracket";
import { computeDeckStats } from "@/lib/deck/stats";
import type { Deck } from "@/lib/deck/types";
import { useCombos } from "@/modules/combos/client";
import { useBracketPathText } from "./use-bracket-path-text";

/**
 * The deck's combo data, read as the builder's badge reads it: pending while
 * the lookup has not answered, unavailable once it failed.
 */
function useComboData(deck: Deck): ComboData {
  const { data, isLoading, isError } = useCombos(deck);
  return useMemo(
    () => comboDataOf({ data, isLoading, isError }),
    [data, isLoading, isError]
  );
}

/** The deck's assessment, or null for a format without bracket scoring. */
function useBracketAssessment(deck: Deck): BracketAssessment | null {
  const comboData = useComboData(deck);
  return useMemo(
    () => explainBracket({ deck, stats: computeDeckStats(deck), comboData }),
    [deck, comboData]
  );
}

/** A key no other line of the same list holds: a kind repeats only per rule or term. */
function lineKey(line: BracketPathLine): string {
  switch (line.kind) {
    case "restrictionFloor":
      return `${line.kind}-${line.rule}`;
    case "term":
    case "termOutOfReach":
      return `${line.kind}-${line.key}`;
    default:
      return line.kind;
  }
}

interface BracketPathListProps {
  /** The store's active deck; its `targetBracket` is the target. */
  readonly deck: Deck;
}

/** Lists what stands between the deck's estimate and its target bracket. */
export function BracketPathList({ deck }: BracketPathListProps) {
  const t = useTranslations("builder.details.bracketPath");
  const headingId = useId();
  const assessment = useBracketAssessment(deck);
  const lineText = useBracketPathText(deck.targetBracket);
  if (assessment === null) return null;

  const lines = pathToBracket(assessment, deck.targetBracket);
  return (
    <section
      aria-labelledby={headingId}
      className="space-y-1 border-b border-[var(--border)] px-3 py-2 text-xs"
    >
      <h3 id={headingId} className="font-medium text-[var(--text-primary)]">
        {t("title", { target: deck.targetBracket })}
      </h3>
      <p className="text-[var(--text-secondary)]">
        {t("estimate", { estimate: assessment.estimate })}
      </p>
      <ul className="list-disc space-y-1 pl-4 text-[var(--text-secondary)]">
        {lines.map((line) => (
          <li key={lineKey(line)}>{lineText(line)}</li>
        ))}
      </ul>
    </section>
  );
}
