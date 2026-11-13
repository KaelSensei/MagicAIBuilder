"use client";
/**
 * The three states a meta source shares with the other: loading with nothing
 * listed yet, failed with a retry, and answered with nothing to list.
 *
 * Meta-insights context, `ui/`. Presentational; the EDHREC and tournament
 * sections render it above their rows. The shifts section has its own states,
 * because "no report" there means "no history yet", not an empty list.
 *
 * @module meta-insights/ui/MetaSourceStatus
 */
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { SkeletonRows } from "./SkeletonRows";

/** One source's state and the words for its empty answer. */
export interface MetaSourceStatusProps {
  readonly isLoading: boolean;
  readonly error: string | null;
  /** True when the source has listed nothing so far. */
  readonly isEmpty: boolean;
  /** Placeholder rows while loading; about what the source usually returns. */
  readonly skeletonRows: number;
  /** Shown once the source answered with nothing, and nothing failed. */
  readonly emptyMessage: string;
  /** Reads this source again, alone. */
  readonly onRetry: () => void;
}

/**
 * Skeleton rows while a source with nothing listed loads, the error line with
 * its retry when it failed, and the empty message when it answered with nothing.
 * The skeleton shows only while the list is empty, so a refresh keeps the rows
 * the visitor already reads.
 */
export function MetaSourceStatus({
  isLoading,
  error,
  isEmpty,
  skeletonRows,
  emptyMessage,
  onRetry,
}: MetaSourceStatusProps) {
  const t = useTranslations("deck");
  return (
    <>
      {isLoading && isEmpty && <SkeletonRows count={skeletonRows} />}

      {error && (
        <div className="flex items-center gap-1.5 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="min-w-0 flex-1">{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 text-[10px] font-medium text-[var(--accent-text)] hover:underline"
          >
            {t("meta.refresh")}
          </button>
        </div>
      )}

      {!isLoading && !error && isEmpty && (
        <p className="text-xs text-[var(--text-secondary)] text-center py-2">
          {emptyMessage}
        </p>
      )}
    </>
  );
}
