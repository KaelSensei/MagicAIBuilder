"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { HeroPreview } from "./HeroPreview";

const PRIMARY_LINK_CLASS =
  "inline-flex items-center gap-2 rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--lumen-shadow-sm)] transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

const SECONDARY_LINK_CLASS =
  "inline-flex items-center rounded-[var(--lumen-radius-pill)] px-4 py-2.5 text-sm font-medium text-[var(--accent-text)] transition-colors hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

/**
 * Introduces the Commander-first capabilities available in the application.
 *
 * @returns the hero section
 */
export function Hero() {
  const t = useTranslations("landing");
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const ctaHref = isLoggedIn ? "/decks" : "/builder/guest";
  const ctaLabel = isLoggedIn ? t("hero.ctaLoggedIn") : t("hero.ctaLoggedOut");

  return (
    <section
      className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
      id="top"
      aria-labelledby="landing-title"
    >
      <div>
        <p className="mb-5 inline-flex items-center gap-2 rounded-[var(--lumen-radius-pill)] bg-[var(--accent-soft)] px-3 py-1 text-sm font-medium text-[var(--accent-text)]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {t("hero.eyebrow")}
        </p>
        <h1
          id="landing-title"
          className="max-w-[16ch] text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-6xl"
        >
          {t("hero.heading")}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
          {t("hero.subtitle")}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={ctaHref} className={PRIMARY_LINK_CLASS}>
            {ctaLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="#capabilities" className={SECONDARY_LINK_CLASS}>
            {t("hero.secondaryCta")}
          </Link>
        </div>
        <p className="mt-4 max-w-xl text-sm text-[var(--text-secondary)]">
          {t("hero.note")}
        </p>
      </div>
      <HeroPreview />
    </section>
  );
}
