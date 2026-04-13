"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

/** Simple footer with brand + links */
export function LandingFooter() {
  const t = useTranslations("landing");

  return (
    <footer className="landing-footer">
      <div className="landing-logo" style={{ fontSize: "0.9rem" }}>
        MagicAIBuilder
      </div>
      <div style={{ display: "flex", gap: "2rem" }}>
        <Link href="#">{t("footer.privacy")}</Link>
        <Link href="#">{t("footer.terms")}</Link>
        <Link href="#">{t("footer.contact")}</Link>
        <Link href="#">{t("footer.discord")}</Link>
      </div>
      <div>{t("footer.copyright")}</div>
      <div className="landing-disclaimer">
        {t.rich("footer.disclaimer", {
          scryfall: (chunks) => (
            <a href="https://scryfall.com" target="_blank" rel="noopener noreferrer">
              {chunks}
            </a>
          ),
        })}
      </div>
    </footer>
  );
}
