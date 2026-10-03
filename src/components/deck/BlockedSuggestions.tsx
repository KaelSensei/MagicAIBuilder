"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CardSuggestion } from "@/hooks/useAISuggestions";
import { getSuggestionLegality } from "@/lib/ai/suggestion-review";

interface Props {
  readonly suggestions: readonly CardSuggestion[];
}

/** Presents hard legality failures separately from optional strategic advice. */
export function BlockedSuggestions({ suggestions }: Props) {
  const t = useTranslations("deck.ai.legality");
  if (suggestions.length === 0) return null;
  return (
    <section
      aria-label={t("title")}
      className="space-y-1.5 rounded-lg border border-red-500/40 bg-red-500/5 p-2"
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
        <ShieldAlert className="h-3.5 w-3.5" />
        {t("title")}
      </div>
      <p className="text-[10px] leading-relaxed text-[var(--text-secondary)]">
        {t("description")}
      </p>
      {suggestions.map((suggestion) => {
        const legality = getSuggestionLegality(suggestion.evidence);
        if (legality.status !== "blocked") return null;
        return (
          <div
            key={suggestion.name}
            className="rounded-md bg-[var(--background)] px-2 py-1.5"
          >
            <p className="text-xs font-medium text-[var(--text-primary)]">
              {suggestion.name}
            </p>
            <p className="text-[10px] text-red-400">
              {legality.reasons.map((reason) => t(reason)).join(" · ")}
            </p>
          </div>
        );
      })}
    </section>
  );
}
