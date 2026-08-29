"use client";

import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PlaytestEngine } from "@/lib/playtest/engine";
import {
  analyzeDrawProgress,
  type DrawProgressStatus,
} from "@/lib/playtest/draw-progress-evidence";

interface DrawProgressEvidenceProps {
  readonly engine: PlaytestEngine;
}

function statusClassName(status: DrawProgressStatus): string {
  switch (status) {
    case "natural":
      return "text-white/60";
    case "drawing-extra":
      return "text-sky-300";
    case "library-empty":
      return "text-amber-300";
  }
  const exhaustiveStatus: never = status;
  return exhaustiveStatus;
}

/**
 * Shows how many cards the current run has accessed beyond natural draws.
 *
 * @param props - current in-memory playtest state
 * @returns a compact draw-progression evidence row
 */
export function DrawProgressEvidence({ engine }: DrawProgressEvidenceProps) {
  const t = useTranslations("playtestEvidence.drawProgress");
  const evidence = useMemo(() => {
    const cardsOutsideLibrary =
      engine.hand.length +
      engine.battlefield.length +
      engine.graveyard.length +
      engine.exile.length;

    return analyzeDrawProgress({
      turn: engine.turn,
      mulliganCount: engine.mulliganCount,
      cardsOutsideLibrary,
      libraryCount: engine.library.length,
    });
  }, [engine]);

  return (
    <div
      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <BookOpen
          className={`mt-0.5 h-4 w-4 shrink-0 ${statusClassName(evidence.status)}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/80">
            {t("cardsSeen", { count: evidence.cardsSeen })}
          </p>
          <p className={`text-xs ${statusClassName(evidence.status)}`}>
            {t(`status.${evidence.status}`, {
              count: evidence.additionalCardsSeen,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
