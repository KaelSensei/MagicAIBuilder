"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const NAV_LINK_CLASS =
  "inline-flex items-center rounded-[var(--lumen-radius-pill)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

const PRIMARY_LINK_CLASS =
  "inline-flex items-center rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-[var(--lumen-shadow-sm)] transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

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
            <Link href="/decks" className={PRIMARY_LINK_CLASS}>
              {t("navbar.myDecks")}
            </Link>
          ) : (
            <Link href="/builder/guest" className={PRIMARY_LINK_CLASS}>
              {t("navbar.guestDeck")}
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
