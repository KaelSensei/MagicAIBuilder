"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

const HEADING_TAGS = {
  br: () => <br />,
  span: (chunks: React.ReactNode) => <span>{chunks}</span>,
};

/** Final call-to-action with gradient text and glow background */
export function FinalCta() {
  const t = useTranslations("landing");
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const ctaHref = isLoggedIn ? "/decks" : "/auth/signin";
  const ctaLabel = isLoggedIn ? t("cta.ctaLoggedIn") : t("cta.ctaLoggedOut");

  return (
    <section className="landing-final-cta">
      <h2 className="reveal">
        {t.rich("cta.heading", HEADING_TAGS)}
      </h2>
      <p className="reveal">
        {t("cta.subtitle")}
      </p>
      <Link href={ctaHref} className="btn-primary reveal">
        {ctaLabel}
      </Link>
    </section>
  );
}
