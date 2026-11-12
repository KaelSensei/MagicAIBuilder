"use client";

/**
 * The app shell's top bar: brand, primary navigation, theme, language, account
 * and the deck actions.
 *
 * Shell (`components/layout`), rendered by every page. It holds no deck logic:
 * "New Deck" and "Import" come from `HeaderDeckActionsSlot`, loaded lazily so
 * public pages do not ship the deck store in their first bundle. The header
 * only owns the UI state those actions share between the desktop bar and the
 * mobile menu.
 *
 * @module layout/Header
 */

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Menu, Package, Shield, Sparkles, X } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { IDLE_HEADER_DECK_ACTIONS } from "@/components/layout/header-deck-actions-state";
import { HeaderDeckActionsSlot } from "@/components/layout/HeaderDeckActionsSlot";
import { HeaderMobileMenu } from "@/components/layout/HeaderMobileMenu";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface HeaderProps {
  /** The deck open in the builder. Import then fills it instead of a new deck. */
  readonly deckId?: string;
}

const NAV_LINK_CLASS =
  "inline-flex items-center gap-1.5 rounded-[var(--lumen-radius-pill)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

/**
 * Paints the product name with the Lumen violet on the "AI" syllable.
 *
 * @param name - localized product name
 * @returns the wordmark
 */
function BrandWordmark({ name }: { readonly name: string }) {
  const marker = "AI";
  const index = name.indexOf(marker);
  if (index < 0) return name;

  return (
    <>
      {name.slice(0, index)}
      <span className="text-[var(--accent-text)]">{marker}</span>
      {name.slice(index + marker.length)}
    </>
  );
}

/**
 * The top bar of every page.
 *
 * On wide screens the deck actions, the language switch and the account menu
 * sit in the bar; on small screens a toggle opens `HeaderMobileMenu`, which
 * holds the same links and actions.
 */
export function Header({ deckId }: HeaderProps = {}) {
  const t = useTranslations("common");
  const [menuOpen, setMenuOpen] = useState(false);
  const [deckActions, setDeckActions] = useState(IDLE_HEADER_DECK_ACTIONS);

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  return (
    <header className="relative z-40 flex h-16 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)]/90 px-4 shadow-[var(--lumen-shadow-sm)] backdrop-blur-md md:gap-6 md:px-6">
      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-[var(--lumen-radius-md)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--lumen-radius-md)] bg-[var(--accent-soft)] text-[var(--accent-text)]">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="hidden text-base font-semibold tracking-tight sm:inline">
          <BrandWordmark name={t("appName")} />
        </span>
      </Link>

      <nav
        aria-label={t("nav.myDecks")}
        className="ml-2 hidden items-center gap-1 md:flex"
      >
        <Link href="/decks" className={NAV_LINK_CLASS}>
          {t("nav.myDecks")}
        </Link>
        <Link href="/collection" className={NAV_LINK_CLASS}>
          <Package className="h-3.5 w-3.5" />
          {t("nav.collection")}
        </Link>
        <Link href="/rules/game-changers" className={NAV_LINK_CLASS}>
          <Shield className="h-3.5 w-3.5" />
          {t("nav.rules")}
        </Link>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <div className="hidden items-center gap-2 md:flex">
          <HeaderDeckActionsSlot
            deckId={deckId}
            layout="desktop"
            uiState={deckActions}
            onUiStateChange={setDeckActions}
          />
          <LocaleSwitcher />
          <UserMenu />
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-[var(--lumen-radius-pill)] border border-[var(--border)] p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] md:hidden"
          aria-label={t("menu.open")}
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <HeaderMobileMenu
        open={menuOpen}
        deckId={deckId}
        deckActions={deckActions}
        onDeckActionsChange={setDeckActions}
        onClose={handleCloseMenu}
      />
    </header>
  );
}
