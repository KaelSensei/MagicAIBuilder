"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const DISCLAIMER_TAGS = {
  scryfall: (chunks: React.ReactNode) => (
    <a href="https://scryfall.com" target="_blank" rel="noopener noreferrer">
      {chunks}
    </a>
  ),
};

/** Legal attribution for the public landing page. */
export function LandingFooter() {
  const t = useTranslations("landing");

  return (
    <footer className="landing-footer">
      <Link href="#top" className="landing-logo">MagicAIBuilder</Link>
      <p>{t("footer.copyright")}</p>
      <div className="landing-disclaimer">
        {t.rich("footer.disclaimer", DISCLAIMER_TAGS)}
      </div>
    </footer>
  );
}
