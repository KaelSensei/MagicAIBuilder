"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface DeckListRefreshNoticeProps {
  readonly onRetry: () => void;
}

/** Warn when cached decks remain visible after a failed refresh. */
export function DeckListRefreshNotice({ onRetry }: DeckListRefreshNoticeProps) {
  const t = useTranslations("deck");

  return (
    <div
      role="alert"
      className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3"
    >
      <AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0 text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {t("home.loadFailedTitle")}
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          {t("home.loadFailedDescription")}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        {t("home.retry")}
      </button>
    </div>
  );
}
