"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { ManaFloats } from "./ManaFloats";

/** Mana colors in WUBRG + Colorless order */
const MANA_COLORS = [
  { code: "W", label: "White" },
  { code: "U", label: "Blue" },
  { code: "B", label: "Black" },
  { code: "R", label: "Red" },
  { code: "G", label: "Green" },
  { code: "C", label: "Colorless" },
] as const;

/** Rich-text tag renderers for next-intl t.rich() calls */
const RICH_TAGS = {
  strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
  br: () => <br />,
};

/** Hero section -- gradient headline, CTA, floating mana particles */
export function Hero() {
  const t = useTranslations("landing");
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const ctaHref = isLoggedIn ? "/decks" : "/auth/signin";
  const ctaLabel = isLoggedIn ? t("hero.ctaLoggedIn") : t("hero.ctaLoggedOut");

  return (
    <section className="landing-hero">
      <div className="hero-bg" />
      <ManaFloats />

      {/* Real Scryfall mana symbols -- W U B R G C */}
      <div className="hero-mana-pips" aria-label="All mana colors">
        {MANA_COLORS.map((c) => (
          <Image
            key={c.code}
            src={`https://svgs.scryfall.io/card-symbols/${c.code}.svg`}
            alt={c.label}
            width={40}
            height={40}
            className="w-10 h-10"
            unoptimized
          />
        ))}
      </div>

      <p className="hero-eyebrow">{"\u2726"} {t("hero.eyebrow")} {"\u2726"}</p>

      <h1>
        <span className="hero-line1">{t("hero.line1")}</span>
        <span className="hero-line2">{t("hero.line2")}</span>
      </h1>

      <p className="hero-sub">
        {t.rich("hero.subtitle", RICH_TAGS)}
      </p>

      <div className="hero-actions">
        <Link href={ctaHref} className="btn-primary">
          {ctaLabel}
        </Link>
        <Link href="#product" className="btn-secondary">
          {t("hero.secondaryCta")}
        </Link>
      </div>

      <p className="hero-note">
        {t("hero.note")}
      </p>
    </section>
  );
}
