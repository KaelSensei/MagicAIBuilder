"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ButtonLink } from "@/components/ui/ButtonLink";

const NAV_LINK_CLASS =
  "inline-flex items-center rounded-[var(--lumen-radius-pill)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

/**
 * The bar's pill is px-4 py-2, which no Button size has (sm is px-3.5, md is
 * py-2.5). px-4 over the small size keeps it as drawn; adopting `sm` outright
 * is a visual change for its own pull request.
 */
const NAVBAR_PILL_PADDING = "px-4";

/**
 * Landing navigation for the public Commander guide.
 *
 * @returns the sticky landing bar
 */
export function LandingNavbar() {
  const t = useTranslations("landing");
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <nav
      className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)]/90 px-4 py-3 shadow-[var(--lumen-shadow-sm)] backdrop-blur-md md:px-8"
      aria-label={t("navbar.ariaLabel")}
    >
      <Link
        href="#top"
        className="flex items-center gap-2.5 rounded-[var(--lumen-radius-md)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--lumen-radius-md)] bg-[var(--accent-soft)] text-[var(--accent-text)]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-base font-semibold tracking-tight">
          Magic<span className="text-[var(--accent-text)]">AI</span>Builder
        </span>
      </Link>
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="#capabilities" className={NAV_LINK_CLASS}>
            {t("navbar.capabilities")}
          </Link>
        </li>
        <li>
          <ThemeToggle />
        </li>
        <li>
          {isLoggedIn ? (
            <ButtonLink href="/decks" className={NAVBAR_PILL_PADDING}>
              {t("navbar.myDecks")}
            </ButtonLink>
          ) : (
            <ButtonLink href="/builder/guest" className={NAVBAR_PILL_PADDING}>
              {t("navbar.guestDeck")}
            </ButtonLink>
          )}
        </li>
      </ul>
    </nav>
  );
}
