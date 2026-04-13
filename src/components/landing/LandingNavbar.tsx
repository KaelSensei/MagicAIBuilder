"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

/** Fixed glassmorphism navbar with brand links */
export function LandingNavbar() {
  const t = useTranslations("landing");
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <nav className="landing-nav">
      <div className="landing-logo">
        MagicAIBuilder
      </div>
      <ul className="landing-nav-links">
        <li><Link href="#product">{t("navbar.features")}</Link></li>
        <li><Link href="#how">{t("navbar.howItWorks")}</Link></li>
        {isLoggedIn ? (
          <li><Link href="/decks" className="nav-cta">{t("navbar.myDecks")}</Link></li>
        ) : (
          <li><Link href="/auth/signin" className="nav-cta">{t("navbar.getStarted")}</Link></li>
        )}
      </ul>
    </nav>
  );
}
