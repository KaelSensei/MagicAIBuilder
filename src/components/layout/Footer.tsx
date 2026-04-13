"use client";

import { useTranslations } from "next-intl";
import { KeyboardShortcutsTrigger } from "./KeyboardShortcutsModal";

const LINK_TAG = {
  link: (chunks: React.ReactNode) => (
    <a
      href="https://company.wizards.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:text-[var(--text-primary)] transition-colors"
    >
      {chunks}
    </a>
  ),
};

/** Legal footer -- displayed on the home page */
export function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-6 mt-auto">
      <div className="max-w-4xl mx-auto space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed">
        <p>{t("footer.wizardsTrademarks")}</p>
        <p>{t.rich("footer.notAffiliated", LINK_TAG)}</p>
        <p>{t("footer.scryfallDisclaimer")}</p>
        <div className="flex items-center justify-end">
          <KeyboardShortcutsTrigger />
        </div>
      </div>
    </footer>
  );
}
