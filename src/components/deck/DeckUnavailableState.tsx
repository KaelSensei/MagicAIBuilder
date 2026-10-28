"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface DeckUnavailableStateProps {
  readonly isLoading: boolean;
  readonly loadError: string | null;
  readonly errorSource?: "list" | "deck";
  readonly onRetry: () => void;
}

/** Show a retry for a failed deck-list request, but not for a genuinely missing deck. */
export function DeckUnavailableState({
  isLoading,
  loadError,
  errorSource = "list",
  onRetry,
}: DeckUnavailableStateProps) {
  const t = useTranslations("builder");
  const deck = useTranslations("deck");
  const common = useTranslations("common");
  const errorTitle = errorSource === "deck" ? common("error.title") : deck("home.loadFailedTitle");
  const errorDescription = errorSource === "deck" ? common("error.description") : deck("home.loadFailedDescription");
  const retryLabel = errorSource === "deck" ? common("error.retry") : deck("home.retry");

  if (isLoading) {
    return (
      <div className="flex w-full flex-col self-stretch text-[var(--text-secondary)]">
        <div className="flex h-11 items-center gap-4 border-b border-[var(--border)] px-4">
          <output aria-busy="true" className="text-sm">{t("loading")}</output>
          <div aria-hidden="true" className="h-2 w-20 rounded bg-[var(--surface)]" />
        </div>
        <div aria-hidden="true" className="grid flex-1 grid-cols-1 motion-safe:animate-pulse lg:grid-cols-[15rem_minmax(0,1fr)_16rem]">
          <aside className="hidden border-r border-[var(--border)] p-3 lg:block">
            <div className="mb-4 h-9 rounded bg-[var(--surface)]" />
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((slot) => (
                <div key={slot} className="aspect-[3/4] rounded bg-[var(--surface)]" />
              ))}
            </div>
          </aside>
          <main className="min-w-0 p-4">
            <div className="mb-4 h-20 rounded-lg bg-[var(--surface)]" />
            <div className="mb-5 h-8 rounded bg-[var(--surface)]" />
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((slot) => (
                <div key={slot} className="h-10 rounded bg-[var(--surface)]" />
              ))}
            </div>
          </main>
          <aside className="hidden border-l border-[var(--border)] p-3 lg:block">
            {[0, 1, 2].map((slot) => (
              <div key={slot} className="mb-4 rounded-lg border border-[var(--border)] p-4">
                <div className="mb-3 h-4 w-2/3 rounded bg-[var(--surface)]" />
                <div className="h-20 rounded bg-[var(--surface)]" />
              </div>
            ))}
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center max-w-sm px-6">
      <p className="text-[var(--text-primary)] font-medium mb-2">
        {loadError ? errorTitle : t("deckNotFound.title")}
      </p>
      {loadError && (
        <>
          <p className="text-sm text-[var(--text-secondary)] mb-4" role="alert">
            {errorDescription}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {retryLabel}
          </button>
        </>
      )}
      <Link
        href="/decks"
        className="block mt-4 text-[var(--accent-text)] hover:underline text-sm"
      >
        {t("deckNotFound.back")}
      </Link>
    </div>
  );
}
