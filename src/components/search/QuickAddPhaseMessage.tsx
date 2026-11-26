"use client";
/**
 * The quick-add palette's status line under the query: too short, searching,
 * failed or nothing found.
 *
 * Card catalog, quick add (I-37). A failed search is an alert; the results
 * phase shows no line, because the result list speaks for itself.
 *
 * @module search/QuickAddPhaseMessage
 */
import { useTranslations } from "next-intl";

/** What the palette shows under the query. */
export type QuickAddPhase = "idle" | "loading" | "error" | "empty" | "results";

/**
 * The idle, loading, error and empty lines. Results render their own list.
 *
 * @param props - The phase the host computed from the search
 * @returns The line for the phase, or null for results
 */
export function QuickAddPhaseMessage(props: { readonly phase: QuickAddPhase }) {
  const t = useTranslations("search");
  switch (props.phase) {
    case "idle":
      return (
        <p className="text-sm text-[var(--text-secondary)]">
          {t("quickAdd.idle")}
        </p>
      );
    case "loading":
      return (
        <p className="text-sm text-[var(--text-secondary)]">
          {t("quickAdd.searching")}
        </p>
      );
    case "error":
      return (
        <p role="alert" className="text-sm text-red-400">
          {t("quickAdd.error")}
        </p>
      );
    case "empty":
      return (
        <p className="text-sm text-[var(--text-secondary)]">
          {t("quickAdd.noResults")}
        </p>
      );
    case "results":
      return null;
  }
  const _exhaustive: never = props.phase;
  return _exhaustive;
}
