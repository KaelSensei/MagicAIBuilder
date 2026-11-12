"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";

/**
 * Directs visitors to their first deck without promising product outcomes.
 *
 * @returns the closing call to action
 */
export function FinalCta() {
  const t = useTranslations("landing");
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const ctaHref = isLoggedIn ? "/decks" : "/builder/guest";
  const ctaLabel = isLoggedIn ? t("cta.ctaLoggedIn") : t("cta.ctaLoggedOut");

  return (
    <section
      className="mx-auto max-w-6xl px-4 pb-16 md:px-8"
      aria-labelledby="cta-title"
    >
      <div className="rounded-[var(--lumen-radius-2xl)] border border-[var(--border)] bg-[var(--surface)] px-6 py-10 shadow-[var(--lumen-shadow-md)] md:px-10">
        <h2
          id="cta-title"
          className="max-w-[18ch] text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl"
        >
          {t("cta.heading")}
        </h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
          {t("cta.subtitle")}
        </p>
        {/* gap-2 keeps the arrow 8px from the label, as the landing drew it. */}
        <ButtonLink href={ctaHref} size="lg" className="mt-6 gap-2">
          {ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    </section>
  );
}
