"use client";

import { useTranslations } from "next-intl";

/** Route fallback that preserves the editor workspace during navigation. */
export default function Loading() {
  const t = useTranslations("builder");

  return (
    <main className="min-h-screen bg-[var(--bg)] p-4 text-[var(--text-primary)] sm:p-6">
      <output aria-busy="true" className="sr-only">
        {t("loading")}
      </output>
      <div aria-hidden="true" className="mx-auto grid max-w-[1800px] gap-4 motion-safe:animate-pulse lg:grid-cols-[minmax(15rem,1fr)_minmax(26rem,2fr)_minmax(15rem,1fr)]">
        <div className="h-96 rounded-lg border border-[var(--border)] bg-[var(--surface)]" />
        <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="h-8 w-1/3 rounded bg-[var(--border)]/60" />
          {[0, 1, 2, 3, 4].map((slot) => (
            <div key={slot} className="h-14 rounded bg-[var(--border)]/60" />
          ))}
        </div>
        <div className="h-72 rounded-lg border border-[var(--border)] bg-[var(--surface)]" />
      </div>
    </main>
  );
}
