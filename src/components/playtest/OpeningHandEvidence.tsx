"use client";

import { useMemo } from "react";
import { CircleGauge } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DeckCard } from "@/lib/deck/types";
import {
  analyzeOpeningHandLands,
  type OpeningHandLandStatus,
} from "@/lib/playtest/opening-hand-evidence";

interface OpeningHandEvidenceProps {
  readonly hand: readonly DeckCard[];
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
 * Shows deterministic land-balance evidence while a mulligan is still useful.
 *
 * @param props - current opening hand
 * @returns a compact evidence row with an actionable verdict
 */
export function OpeningHandEvidence({ hand }: OpeningHandEvidenceProps) {
  const t = useTranslations("builder.playtestEvidence.openingHand");
  const evidence = useMemo(() => analyzeOpeningHandLands(hand), [hand]);

  return (
    <div
      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <CircleGauge
          className={`mt-0.5 h-4 w-4 shrink-0 ${statusClassName(evidence.status)}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/80">
            {t("landCount", { count: evidence.landCount })}
          </p>
          <p className={`text-xs ${statusClassName(evidence.status)}`}>
            {t(`status.${evidence.status}`)}
          </p>
        </div>
      </div>
    </div>
  );
}
