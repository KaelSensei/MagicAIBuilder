"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import type { CardAlternative } from "@/hooks/useAISuggestions";
import { SuggestionEvidenceDetails } from "./SuggestionEvidenceDetails";

export function SuggestionAlternatives({
  alternatives,
  addedCards,
  onAdd,
}: {
  readonly alternatives: readonly CardAlternative[];
  readonly addedCards: ReadonlySet<string>;
  readonly onAdd: (name: string) => void;
}) {
  const t = useTranslations("deck.ai");
  if (alternatives.length === 0) return null;

  return (
    <details className="mt-2 rounded-md border border-dashed border-[var(--border)] px-2 py-1.5">
      <summary className="cursor-pointer text-[10px] font-medium text-[var(--accent-text)]">
        {t("alternativeCount", { count: alternatives.length })}
      </summary>
      <div className="mt-2 space-y-2">
        {alternatives.map((alternative) => (
          <div
            key={`${alternative.dimension}-${alternative.name}`}
            className="rounded-md bg-[var(--background)] p-2"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[11px] font-medium text-[var(--text-primary)]">
                    {alternative.name}
                  </span>
                  <span className="rounded-full bg-[var(--accent)]/10 px-1.5 py-0.5 text-[9px] font-medium text-[var(--accent-text)]">
                    {t(
                      `alternative${alternative.dimension.charAt(0).toUpperCase()}${alternative.dimension.slice(1)}`
                    )}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] leading-tight text-[var(--text-secondary)]">
                  {alternative.reason}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAdd(alternative.name)}
                disabled={addedCards.has(alternative.name)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white disabled:cursor-default disabled:bg-green-600"
                aria-label={
                  addedCards.has(alternative.name)
                    ? t("added")
                    : t("addCard", { name: alternative.name })
                }
              >
                {addedCards.has(alternative.name) ? (
                  "✓"
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </button>
            </div>
            {alternative.evidence && (
              <SuggestionEvidenceDetails evidence={alternative.evidence} />
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
