"use client";

import {
  BadgeCheck,
  CircleDollarSign,
  Gauge,
  Palette,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { SuggestionEvidence } from "@/lib/ai/suggestion-evidence";
import { cn } from "@/components/ui/utils";

function titleCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function SuggestionEvidenceDetails({
  evidence,
}: {
  readonly evidence: SuggestionEvidence;
}) {
  const t = useTranslations("deck.ai.evidence");
  const colors =
    evidence.colorIdentity.length > 0
      ? evidence.colorIdentity.join("/")
      : t("colorless");
  const colorStatus =
    evidence.colorCompatible === null
      ? t("unknown")
      : evidence.colorCompatible
        ? t("compatible")
        : t("incompatible");
  const legalStatus =
    evidence.commanderLegal === null
      ? t("unknown")
      : evidence.commanderLegal
        ? t("commanderLegal")
        : t("commanderIllegal");

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
            {titleCase(evidence.role)}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <Gauge className="h-3 w-3 shrink-0" />
          {evidence.manaValue === null
            ? evidence.curveImpact
            : `MV ${evidence.manaValue} · ${evidence.curveImpact}`}
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
            : `$${evidence.priceUsd.toFixed(2)}`}
        </span>
      </div>
    </div>
  );
}
