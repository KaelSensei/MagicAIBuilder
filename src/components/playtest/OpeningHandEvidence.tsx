"use client";

import { useMemo } from "react";
import { CircleGauge } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DeckCard } from "@/lib/deck/types";
import {
  analyzeOpeningHand,
  type OpeningHandLandStatus,
} from "@/lib/playtest/opening-hand-evidence";
import {
  OpeningHandKeepAdvice,
  type KeepRulesContext,
} from "@/components/playtest/OpeningHandKeepAdvice";

interface OpeningHandEvidenceProps {
  readonly hand: readonly DeckCard[];
  /**
   * Set when the guide's keep rules apply (Commander): the stage-aware keep
   * advice then replaces the land-only verdict.
   */
  readonly keepRules?: KeepRulesContext;
}

function statusClassName(status: OpeningHandLandStatus): string {
  switch (status) {
    case "land-light":
    case "land-heavy":
      return "text-amber-300";
    case "balanced":
      return "text-emerald-300";
  }
  const exhaustiveStatus: never = status;
  return exhaustiveStatus;
}

/**
 * Shows opening-hand evidence while a mulligan is still useful: the guide's
 * keep advice for Commander, the land balance otherwise, and missing colors.
 *
 * @param props - current opening hand, and the keep-rule context when it applies
 * @returns a compact evidence row with an actionable verdict
 */
export function OpeningHandEvidence({ hand, keepRules }: OpeningHandEvidenceProps) {
  const t = useTranslations("builder.playtestEvidence.openingHand");
  const evidence = useMemo(() => analyzeOpeningHand(hand), [hand]);
  const colors = evidence.missingColors.map((color) => t(`colors.${color}`)).join(", ");
  const landClassName = statusClassName(evidence.isDead ? "land-light" : evidence.landStatus);
  const warning = evidence.isDead
    ? t("deadHand")
    : t(`status.${evidence.landStatus}`);

  return (
    <div
      className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <CircleGauge
          className={`mt-0.5 h-4 w-4 shrink-0 ${keepRules ? "text-[var(--text-secondary)]" : landClassName}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--text-primary)]">
            {t("landCount", { count: evidence.landCount })}
          </p>
          {keepRules ? (
            <>
              <OpeningHandKeepAdvice hand={hand} context={keepRules} />
              {evidence.isDead && <p className="text-xs text-amber-300">{t("deadHand")}</p>}
            </>
          ) : (
            <p className={`text-xs ${landClassName}`}>{warning}</p>
          )}
          {evidence.missingColors.length > 0 && (
            <p className="text-xs text-amber-200">{t("missingColors", { colors })}</p>
          )}
        </div>
      </div>
    </div>
  );
}
