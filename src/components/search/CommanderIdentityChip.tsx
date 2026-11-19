"use client";
/**
 * The chip above the builder's search results that says whether the name
 * search stays inside the commander's colours, with the one button that
 * widens it or scopes it again.
 *
 * Search context, builder page (I-01, AC-01-160 to AC-01-162). The state is
 * written in words, never shown by colour alone; the button is a native
 * button, so it works from the keyboard.
 *
 * @module components/search/CommanderIdentityChip
 */
import { useTranslations } from "next-intl";
import { Palette } from "lucide-react";
import type { CommanderIdentityChipState } from "@/hooks/useCommanderIdentityScope";

/** Props of {@link CommanderIdentityChip}. */
export interface CommanderIdentityChipProps {
  readonly state: CommanderIdentityChipState;
  /** Widens a scoped search, or scopes a widened one again. */
  readonly onToggle: () => void;
}

/** The scope chip; renders nothing when the deck has no identity to scope to. */
export function CommanderIdentityChip({
  state,
  onToggle,
}: CommanderIdentityChipProps) {
  const t = useTranslations("search.identityScope");
  if (state === "hidden") return null;
  const widened = state === "widened";
  return (
    <div className="flex items-center gap-2 rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)]">
      <Palette className="h-3 w-3 shrink-0" aria-hidden="true" />
      <output aria-live="polite" className="min-w-0 flex-1">
        {t(widened ? "widened" : "scoped")}
      </output>
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 rounded px-1.5 py-0.5 font-medium text-[var(--accent-text)] transition-colors hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {t(widened ? "narrow" : "widen")}
      </button>
    </div>
  );
}
CommanderIdentityChip.displayName = "CommanderIdentityChip";
