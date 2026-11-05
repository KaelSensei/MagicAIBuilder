"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

/** Directs visitors to their first deck without promising product outcomes. */
export function FinalCta() {
  const t = useTranslations("landing");
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const ctaHref = isLoggedIn ? "/decks" : "/builder/guest";
  const ctaLabel = isLoggedIn ? t("cta.ctaLoggedIn") : t("cta.ctaLoggedOut");

  return (
    <section className="landing-final-cta" aria-labelledby="cta-title">
      <h2 id="cta-title">{t("cta.heading")}</h2>
      <p>{t("cta.subtitle")}</p>
      <Link href={ctaHref} className="btn-primary">
        {ctaLabel}
      </Link>
    </section>
  );
}
