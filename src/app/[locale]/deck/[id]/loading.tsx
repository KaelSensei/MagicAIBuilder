"use client";

import { useTranslations } from "next-intl";

/** Route fallback while a shared deck and its viewer context are loading. */
export default function Loading() {
  const t = useTranslations("deck");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div aria-hidden="true" className="h-16 border-b border-[var(--border)]">
        <div className="mx-auto flex h-full max-w-5xl items-center gap-6 px-4">
          <div className="h-5 w-36 rounded bg-[var(--surface)]" />
          <div className="hidden h-4 w-44 rounded bg-[var(--surface)] sm:block" />
        </div>
      </div>
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <div role="status" aria-busy="true">
          <span className="sr-only">{t("publicLoading")}</span>
          <div aria-hidden="true" className="motion-safe:animate-pulse">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row">
              <div className="h-28 w-full rounded-xl bg-[var(--surface)] sm:h-24 sm:w-40" />
              <div className="flex-1 space-y-3">
                <div className="h-7 w-64 max-w-full rounded bg-[var(--surface)]" />
                <div className="h-4 w-44 rounded bg-[var(--surface)]" />
                <div className="h-4 w-32 rounded bg-[var(--surface)]" />
              </div>
            </div>
            <div className="mb-4 h-5 w-36 rounded bg-[var(--surface)]" />
            <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              {[0, 1, 2, 3].map((slot) => (
                <div key={slot} className="flex items-center gap-4">
                  <div className="h-4 w-6 rounded bg-[var(--border)]" />
                  <div className="h-4 w-1/2 rounded bg-[var(--border)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
