"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AlertTriangle, RotateCcw } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

interface ErrorBoundaryProps {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}

/**
 * Route-level error boundary for every localised page.
 *
 * Without this file a render failure falls through to Next.js' default error
 * screen, which is untranslated and offers no way back into the app.
 */
export default function LocaleError({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations("common.error");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <AlertTriangle
          className="w-10 h-10 mx-auto mb-4 text-amber-400"
          aria-hidden="true"
        />

        <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {t("title")}
        </h1>

        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {t("description")}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            {t("retry")}
          </button>

          <Link
            href="/decks"
            className="px-4 py-2 rounded-lg border border-white/20 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {t("backToDecks")}
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-[var(--text-secondary)] opacity-60">
            {t("reference")}: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
