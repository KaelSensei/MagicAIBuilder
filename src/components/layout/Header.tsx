"use client";

import { useCallback, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Loader2, Menu, Package, Plus, Shield, Sparkles, Upload, X } from "lucide-react";
import { ImportDialog } from "@/components/deck/ImportDialog";
import { UserMenu } from "@/components/auth/UserMenu";
import { HeaderMobileMenu } from "@/components/layout/HeaderMobileMenu";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { useDeckStore } from "@/lib/deck/store";

interface HeaderProps {
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

export function Header({ deckId }: HeaderProps = {}) {
  const t = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [isCreatingImportDeck, setIsCreatingImportDeck] = useState(false);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);

  const createDeck = useDeckStore((s) => s.createDeck);
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck);

  const handleNewDeck = useCallback(async () => {
    if (isCreatingDeck) return;
    setIsCreatingDeck(true);
    try {
      const id = await createDeck("New Deck");
      router.push(`/builder/${id}`);
    } finally {
      setIsCreatingDeck(false);
    }
  }, [createDeck, isCreatingDeck, router]);

  const handleImportFromHome = useCallback(async () => {
    if (isCreatingImportDeck) return;
    setIsCreatingImportDeck(true);
    try {
      const id = await createDeck(
        t("nav.importedDeck", { date: format.dateTime(new Date()) })
      );
      await setActiveDeck(id);
      setImportOpen(true);
    } finally {
      setIsCreatingImportDeck(false);
    }
  }, [createDeck, format, isCreatingImportDeck, setActiveDeck, t]);

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

      <nav aria-label={t("nav.myDecks")} className="ml-2 hidden items-center gap-1 md:flex">
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
          {deckId ? (
            <ImportDialog>
              <Button variant="secondary">
                <Upload className="h-3.5 w-3.5" />
                {t("nav.import")}
              </Button>
            </ImportDialog>
          ) : (
            <ImportDialog open={importOpen} onOpenChange={setImportOpen}>
              <Button
                variant="secondary"
                onClick={handleImportFromHome}
                disabled={isCreatingImportDeck}
              >
                {isCreatingImportDeck ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {t("nav.import")}
              </Button>
            </ImportDialog>
          )}
          <Button onClick={handleNewDeck} disabled={isCreatingDeck}>
            {isCreatingDeck ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {t("nav.newDeck")}
          </Button>
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
        importOpen={importOpen}
        isCreatingDeck={isCreatingDeck}
        isCreatingImportDeck={isCreatingImportDeck}
        onClose={handleCloseMenu}
        onImportOpenChange={setImportOpen}
        onImportFromHome={handleImportFromHome}
        onNewDeck={handleNewDeck}
      />
    </header>
  );
}
