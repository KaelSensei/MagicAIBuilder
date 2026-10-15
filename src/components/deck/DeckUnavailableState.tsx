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
    return <p className="text-[var(--text-secondary)]" role="status">{t("loading")}</p>;
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
