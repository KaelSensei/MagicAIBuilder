"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

/** Landing navigation for the public Commander guide. */
export function LandingNavbar() {
  const t = useTranslations("landing");
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <nav className="landing-nav" aria-label={t("navbar.ariaLabel")}>
      <Link href="#top" className="landing-logo">
        MagicAIBuilder
      </Link>
      <ul className="landing-nav-links">
        <li><Link href="#capabilities">{t("navbar.capabilities")}</Link></li>
        {isLoggedIn ? (
          <li><Link href="/decks" className="nav-cta">{t("navbar.myDecks")}</Link></li>
        ) : (
          <li><Link href="/builder/guest" className="nav-cta">{t("navbar.guestDeck")}</Link></li>
        )}
      </ul>
    </nav>
  );
}
