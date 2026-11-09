"use client";

import { useMemo } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { DeckCard } from "@/lib/deck/types";
import type { PlaytestEngine } from "@/lib/playtest/engine";
import {
  adviseKeep,
  classifyHand,
  type KeepAdvice,
  type KeepVerdict,
} from "@/lib/playtest/keep-rules";

/** The mulligan state and deck bracket the Commander keep rules need. */
export interface KeepRulesContext {
  readonly mulligan: Pick<
    PlaytestEngine,
    "mulliganCount" | "firstMulliganFree" | "cardsToBottom"
  >;
  /** The deck's target bracket; null when it has none. */
  readonly bracket: number | null;
}

interface OpeningHandKeepAdviceProps {
  readonly hand: readonly DeckCard[];
  readonly context: KeepRulesContext;
}

function verdictClassName(verdict: KeepVerdict | "noRule"): string {
  switch (verdict) {
    case "keep":
      return "text-emerald-300";
    case "mulligan":
      return "text-amber-300";
    case "judgment":
      return "text-sky-300";
    case "noRule":
      return "text-[var(--text-secondary)]";
  }
  const exhaustiveVerdict: never = verdict;
  return exhaustiveVerdict;
}

/**
 * Shows the guide's keep advice for a Commander hand at its mulligan stage,
 * or what to put on the bottom while a London mulligan's choice is pending.
 *
 * @param props - the hand, and the mulligan state and bracket it is judged at
 * @returns the cheap-ramp count, the advice and its source
 */
export function OpeningHandKeepAdvice({
  hand,
  context,
}: OpeningHandKeepAdviceProps) {
  const t = useTranslations("builder.playtestEvidence.openingHand.keep");
  const handClass = useMemo(() => classifyHand(hand), [hand]);
  const advice = useMemo(
    () =>
      adviseKeep({
        hand: handClass,
        mulligan: context.mulligan,
        bracket: context.bracket,
      }),
    [handClass, context.mulligan, context.bracket]
  );

  return (
    <>
      <p className="text-xs text-[var(--text-secondary)]">
        {t("cheapRamp", { count: handClass.cheapRamp })}
      </p>
      {context.mulligan.cardsToBottom > 0 ? (
        <p className="text-xs text-[var(--text-primary)]">{t("bottomTip")}</p>
      ) : (
        <AdviceLines advice={advice} />
      )}
      <p className="text-[10px] text-[var(--text-secondary)]">{t("source")}</p>
    </>
  );
}

function AdviceLines({ advice }: { readonly advice: KeepAdvice }) {
  const t = useTranslations("builder.playtestEvidence.openingHand.keep");
  const format = useFormatter();

  switch (advice.kind) {
    case "bracket":
      return (
        <>
          <p
            className={`text-xs font-semibold ${verdictClassName(advice.verdict)}`}
          >
            {t(`verdict.${advice.verdict}`)}
          </p>
          <p className="text-xs text-[var(--text-primary)]">
            {t("bracketReason", {
              bracket: advice.bracket,
              stage: t(`stage.${advice.stage}`),
              against: advice.against,
              margin: format.number(advice.marginPct / 100, {
                style: "percent",
                signDisplay: "exceptZero",
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }),
            })}
          </p>
          {advice.verdict === "judgment" && (
            <p className="text-xs text-[var(--text-secondary)]">
              {t("judgmentNote")}
            </p>
          )}
        </>
      );
    case "generic":
      return (
        <>
          <p
            className={`text-xs font-semibold ${verdictClassName(advice.verdict)}`}
          >
            {t(`verdict.${advice.verdict}`)}
          </p>
          <p className="text-xs text-[var(--text-primary)]">
            {t(`everyShell.${advice.rule}`)}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {t("genericNote", { stage: t(`stage.${advice.stage}`) })}
          </p>
        </>
      );
    case "noRule":
      return (
        <>
          <p className={`text-xs font-semibold ${verdictClassName("noRule")}`}>
            {t("verdict.noRule")}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {t(`noRule.${advice.reason}`, {
              stage: t(`stage.${advice.stage}`),
            })}
          </p>
        </>
      );
  }
  const exhaustiveAdvice: never = advice;
  return exhaustiveAdvice;
}
