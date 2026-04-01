"use client";

import { Sparkles } from "lucide-react";
import type { DecksSortDir, DecksSortKey, DecksViewMode } from "@/lib/deck/deck-listing";

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
            Grid
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
            List
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
          aria-label="Sort decks"
        >
          <option value="updatedAt:desc">Updated (newest)</option>
          <option value="updatedAt:asc">Updated (oldest)</option>
          <option value="name:asc">Name (A–Z)</option>
          <option value="name:desc">Name (Z–A)</option>
          <option value="bracket:asc">Bracket (low→high)</option>
          <option value="bracket:desc">Bracket (high→low)</option>
        </select>
      </div>

      <button
        onClick={onOpenWizard}
        className="flex items-center gap-2 rounded-lg border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
      >
        <Sparkles className="h-4 w-4" />
        Build with AI
      </button>

      <button
        onClick={onNewDeck}
        disabled={disableNewDeck}
        className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCreating ? (
          // keep icon local to avoid extra props; lucide import is cheap
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <span className="inline-flex h-4 w-4 items-center justify-center">+</span>
        )}
        New Deck
      </button>
    </div>
  );
}

