"use client";
/**
 * Words each line of the path to a target bracket (`pathToBracket`) through
 * next-intl, under `builder.details.bracketPath`.
 *
 * Context: deck building (ui), read by `BracketPathList`. The lines carry
 * numbers and card names only; every sentence lives in the catalogues, which
 * name no replacement card and hold no verdict word (I-77 5.3, pinned by
 * `bracket-path-wording.test.ts`). Card names are joined with the locale's
 * list format.
 *
 * @module deck/use-bracket-path-text
 */
import { useFormatter, useTranslations } from "next-intl";
import type { BracketLevel } from "@/lib/constants/brackets";
import type { BracketTermKey } from "@/lib/deck/bracket-assessment";
import type { BracketPathLine } from "@/lib/deck/path-to-bracket";

/**
 * Returns a function that words one line of the path.
 *
 * @param target - the deck's target bracket, named by a term no single count
 *   brings down to it
 * @returns the sentence of a line, in the current locale
 */
export function useBracketPathText(
  target: BracketLevel
): (line: BracketPathLine) => string {
  const t = useTranslations("builder.details.bracketPath");
  const formatter = useFormatter();
  const cards = (names: readonly string[]) =>
    formatter.list(names, { type: "conjunction" });
  const termName = (key: BracketTermKey) => t(`term.${key}`);

  return (line) => {
    switch (line.kind) {
      case "cedhIntent":
        return t("cedhIntent");
      case "noRuleStops":
        return t("noRuleStops", { target: line.target });
      case "gameChangerFloor":
        return t("gameChangerFloor", {
          target: line.target,
          allowed: line.allowed,
          count: line.count,
          cards: cards(line.cards),
        });
      case "restrictionFloor":
        return t(`restrictionFloor.${line.rule}`, {
          target: line.target,
          count: line.count,
          cards: cards(line.cards),
        });
      case "comboFloorNotChecked":
        return t("comboFloorNotChecked");
      case "tooFewCards":
        return t("tooFewCards", { count: line.deckSize });
      case "term":
        return t(`termReads.${line.measure}`, {
          term: termName(line.key),
          score: line.score,
          value: line.value,
          bound: line.bound,
          wouldRead: line.wouldRead,
        });
      case "termOutOfReach":
        return t("termOutOfReach", {
          term: termName(line.key),
          score: line.score,
          target,
        });
    }
    const unworded: never = line;
    return unworded;
  };
}
