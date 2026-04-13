"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

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
        {t.rich("cta.heading", {
          br: () => <br />,
          span: (chunks) => <span>{chunks}</span>,
        })}
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
