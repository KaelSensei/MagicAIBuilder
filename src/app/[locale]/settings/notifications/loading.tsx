"use client";

import { useTranslations } from "next-intl";

/** Route fallback that keeps notification settings responsive while loading. */
export default function Loading() {
  const t = useTranslations("settings.notifications");
  return (
    <main className="min-h-screen bg-[var(--bg)] p-6 text-[var(--text-primary)]">
      <output aria-busy="true" className="sr-only">{t("loading")}</output>
      <div aria-hidden="true" className="mx-auto max-w-2xl space-y-4 motion-safe:animate-pulse">
        <div className="h-8 w-56 rounded bg-[var(--surface)]" />
        {[0, 1, 2, 3].map((slot) => <div key={slot} className="h-16 rounded-lg border border-[var(--border)] bg-[var(--surface)]" />)}
      </div>
    </main>
  );
}
