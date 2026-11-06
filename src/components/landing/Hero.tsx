"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

/** Introduces the Commander-first capabilities available in the application. */
export function Hero() {
  const t = useTranslations("landing");
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const ctaHref = isLoggedIn ? "/decks" : "/builder/guest";
  const ctaLabel = isLoggedIn ? t("hero.ctaLoggedIn") : t("hero.ctaLoggedOut");

  return (
    <section className="landing-hero" id="top" aria-labelledby="landing-title">
      <p className="hero-eyebrow">
        {t("hero.eyebrow")}
      </p>

      <h1 id="landing-title">{t("hero.heading")}</h1>

      <p className="hero-sub">{t("hero.subtitle")}</p>

      <div className="hero-actions">
        <Link href={ctaHref} className="btn-primary">
          {ctaLabel}
        </Link>
        <Link href="#capabilities" className="btn-secondary">
          {t("hero.secondaryCta")}
        </Link>
      </div>

      <p className="hero-note">{t("hero.note")}</p>
    </section>
  );
}
