"use client";

import {
  BadgeCheck,
  CircleDollarSign,
  Gauge,
  Palette,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import type {
  CurvePosition,
  SuggestionEvidence,
} from "@/lib/ai/suggestion-evidence";
import { cn } from "@/components/ui/utils";

function titleCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

/** The `deck.ai.evidence` message that words a curve position. */
function curveMessageKey(
  position: CurvePosition
): "curveBelow" | "curveNear" | "curveAbove" {
  switch (position) {
    case "below":
      return "curveBelow";
    case "near":
      return "curveNear";
    case "above":
      return "curveAbove";
    default: {
      const unhandled: never = position;
      return unhandled;
    }
  }
}

/**
 * The curve line in the player's language: the card's mana value and where it
 * sits against the deck average, both in the locale's number format, or
 * "unknown" when the card was not found.
 */
function useCurveLine({
  manaValue,
  curve,
}: Pick<SuggestionEvidence, "manaValue" | "curve">): string {
  const t = useTranslations("deck.ai.evidence");
  const format = useFormatter();
  if (curve === null || manaValue === null) return t("curveUnknown");
  return t(curveMessageKey(curve.position), {
    manaValue: format.number(manaValue),
    average: format.number(curve.deckAverage, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  });
}

/**
 * The checked facts beside one AI suggestion: role, curve position, colour
 * fit, Commander legality and price, each worded in the player's language and
 * number format. An unknown fact reads as unknown, never as a negative.
 */
export function SuggestionEvidenceDetails({
  evidence,
}: {
  readonly evidence: SuggestionEvidence;
}) {
  const t = useTranslations("deck.ai.evidence");
  const category = useTranslations("builder.categories");
  const format = useFormatter();
  const colors =
    evidence.colorIdentity.length > 0
      ? evidence.colorIdentity.join("/")
      : t("colorless");
  let colorStatus = t("unknown");
  if (evidence.colorCompatible !== null) {
    colorStatus = evidence.colorCompatible ? t("compatible") : t("incompatible");
  }
  let legalStatus = t("unknown");
  if (evidence.commanderLegal !== null) {
    legalStatus = evidence.commanderLegal ? t("commanderLegal") : t("commanderIllegal");
  }
  const curveLine = useCurveLine(evidence);

  return (
    <div className="mt-2 rounded-md border border-[var(--border)]/80 bg-[var(--surface)]/60 p-2">
      <div
        className={cn(
          "mb-2 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider",
          evidence.verified ? "text-emerald-400" : "text-amber-400"
        )}
      >
        <BadgeCheck className="h-3 w-3" />
        {evidence.verified ? t("verified") : t("unavailable")}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          <Tag className="h-3 w-3 shrink-0" />
          <span className="text-[var(--text-primary)]">
            {category.has(evidence.role) ? category(evidence.role) : titleCase(evidence.role)}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <Gauge className="h-3 w-3 shrink-0" />
          {curveLine}
        </span>
        <span
          className={cn(
            "flex items-center gap-1",
            evidence.colorCompatible === false && "text-red-400"
          )}
        >
          <Palette className="h-3 w-3 shrink-0" />
          {evidence.colorCompatible === null
            ? colorStatus
            : `${colors} · ${colorStatus}`}
        </span>
        <span
          className={cn(
            "flex items-center gap-1",
            evidence.commanderLegal === false && "text-red-400"
          )}
        >
          <ShieldCheck className="h-3 w-3 shrink-0" />
          {legalStatus}
        </span>
        <span className="flex items-center gap-1">
          <CircleDollarSign className="h-3 w-3 shrink-0" />
          {evidence.priceUsd === null
            ? t("unknown")
            : format.number(evidence.priceUsd, { style: "currency", currency: "USD" })}
        </span>
      </div>
    </div>
  );
}
