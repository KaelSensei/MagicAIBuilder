"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
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
        <div className="inline-flex overflow-hidden rounded-lg border border-[var(--border)]">
          <button
            type="button"
            onClick={() => onSetViewMode("grid")}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              viewMode === "grid"
                ? "bg-[var(--accent)] text-white"
                : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            }`}
            aria-pressed={viewMode === "grid"}
          >
            {t("controls.grid")}
          </button>
          <button
            type="button"
            onClick={() => onSetViewMode("list")}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-[var(--accent)] text-white"
                : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            }`}
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
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
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

      <button
        type="button"
        onClick={onOpenWizard}
        className="flex items-center gap-2 rounded-lg border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
      >
        <Sparkles className="h-4 w-4" />
        {t("controls.buildWithAI")}
      </button>

      <button
        type="button"
        onClick={onNewDeck}
        disabled={disableNewDeck}
        className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCreating ? (
          // keep icon local to avoid extra props; lucide import is cheap
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <span className="inline-flex h-4 w-4 items-center justify-center">
            +
          </span>
        )}
        {t("controls.newDeck")}
      </button>
    </div>
  );
}
