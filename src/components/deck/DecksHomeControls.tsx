"use client";

import { useTranslations } from "next-intl";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fieldShellClassName } from "@/components/ui/Input";
import { cn } from "@/components/ui/utils";
import type {
  DecksSortDir,
  DecksSortKey,
  DecksViewMode,
} from "@/lib/deck/deck-listing";

export type DecksHomeControlsProps = {
  readonly viewMode: DecksViewMode;
  readonly sortKey: DecksSortKey;
  readonly sortDir: DecksSortDir;
  readonly onSetViewMode: (mode: DecksViewMode) => void;
  readonly onSetSort: (key: DecksSortKey, dir: DecksSortDir) => void;
  readonly onOpenWizard: () => void;
  readonly onNewDeck: () => void;
  readonly disableNewDeck: boolean;
  readonly isCreating: boolean;
};

export function DecksHomeControls({
  viewMode,
  sortKey,
  sortDir,
  onSetViewMode,
  onSetSort,
  onOpenWizard,
  onNewDeck,
  disableNewDeck,
  isCreating,
}: DecksHomeControlsProps) {
  const t = useTranslations("deck");

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 sm:flex">
        <div className="inline-flex gap-1 rounded-[var(--lumen-radius-pill)] border border-[var(--border)] bg-[var(--background)] p-1">
          <button
            type="button"
            onClick={() => onSetViewMode("grid")}
            className={cn(
              "rounded-[var(--lumen-radius-pill)] px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
              viewMode === "grid"
                ? "bg-[var(--accent)] text-white"
                : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
            aria-pressed={viewMode === "grid"}
          >
            {t("controls.grid")}
          </button>
          <button
            type="button"
            onClick={() => onSetViewMode("list")}
            className={cn(
              "rounded-[var(--lumen-radius-pill)] px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
              viewMode === "list"
                ? "bg-[var(--accent)] text-white"
                : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
            aria-pressed={viewMode === "list"}
          >
            {t("controls.list")}
          </button>
        </div>

        <select
          value={`${sortKey}:${sortDir}`}
          onChange={(e) => {
            const [k, d] = e.target.value.split(":");
            if (k === "updatedAt" || k === "name" || k === "bracket") {
              const nextKey: DecksSortKey = k;
              if (d === "asc" || d === "desc") {
                const nextDir: DecksSortDir = d;
                onSetSort(nextKey, nextDir);
              }
            }
          }}
          className={cn(fieldShellClassName, "px-3 py-2")}
          aria-label={t("controls.sortDecks")}
        >
          <option value="updatedAt:desc">
            {t("controls.sortUpdatedNewest")}
          </option>
          <option value="updatedAt:asc">
            {t("controls.sortUpdatedOldest")}
          </option>
          <option value="name:asc">{t("controls.sortNameAsc")}</option>
          <option value="name:desc">{t("controls.sortNameDesc")}</option>
          <option value="bracket:asc">{t("controls.sortBracketAsc")}</option>
          <option value="bracket:desc">{t("controls.sortBracketDesc")}</option>
        </select>
      </div>

      <Button type="button" variant="secondary" size="sm" onClick={onOpenWizard}>
        <Sparkles className="h-4 w-4" />
        {t("controls.buildWithAI")}
      </Button>

      <Button type="button" variant="primary" size="sm" onClick={onNewDeck} disabled={disableNewDeck}>
        {isCreating ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {t("controls.newDeck")}
      </Button>
    </div>
  );
}
