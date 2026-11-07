"use client";

import { useTranslations } from "next-intl";

/** Route fallback that retains collection-page structure during navigation. */
export default function Loading() {
  const t = useTranslations("collection");

  return (
    <main className="min-h-screen bg-[var(--bg)] p-6 text-[var(--text-primary)]">
      <output aria-busy="true" className="sr-only">
        {t("loading")}
      </output>
      <div aria-hidden="true" className="mx-auto max-w-6xl motion-safe:animate-pulse">
        <div className="mb-6 h-8 w-48 rounded bg-[var(--surface)]" />
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((slot) => (
            <div key={slot} className="h-20 rounded-lg border border-[var(--border)] bg-[var(--surface)]" />
          ))}
        </div>
        <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          {[0, 1, 2, 3, 4].map((slot) => (
            <div key={slot} className="h-12 rounded bg-[var(--border)]/60" />
          ))}
        </div>
      </div>
    </main>
  );
}
