"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const DISCLAIMER_TAGS = {
  scryfall: (chunks: ReactNode) => (
    <a
      href="https://scryfall.com"
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[var(--accent-text)] underline decoration-[var(--accent-soft)] underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      {chunks}
    </a>
  ),
};

/**
 * Legal attribution for the public landing page.
 *
 * @returns the landing footer
 */
export function LandingFooter() {
  const t = useTranslations("landing");

  return (
    <footer className="border-t border-[var(--border)] px-4 py-8 text-sm text-[var(--text-secondary)] md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link
          href="#top"
          className="font-semibold text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          MagicAIBuilder
        </Link>
        <p>{t("footer.copyright")}</p>
      </div>
      <p className="mx-auto mt-4 max-w-6xl leading-7">{t.rich("footer.disclaimer", DISCLAIMER_TAGS)}</p>
    </footer>
  );
}
