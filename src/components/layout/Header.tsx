"use client";
// App header with nav — responsive with hamburger menu on mobile
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Layers, Loader2, Menu, Moon, Package, Plus, Shield, Sun, Upload, X } from "lucide-react";
import { ImportDialog } from "@/components/deck/ImportDialog";
import { useTheme } from "@/hooks/useTheme";
import { UserMenu } from "@/components/auth/UserMenu";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { useDeckStore } from "@/lib/deck/store";

interface HeaderProps {
  readonly deckId?: string;
}

export function Header({ deckId }: HeaderProps = {}) {
  const t = useTranslations("common");
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
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
      const id = await createDeck(`Imported Deck — ${new Date().toLocaleString()}`);
      setActiveDeck(id);
      setImportOpen(true);
    } finally {
      setIsCreatingImportDeck(false);
    }
  }, [createDeck, isCreatingImportDeck, setActiveDeck]);

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--surface)] flex items-center px-4 md:px-6 gap-3 md:gap-6 shrink-0">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
      >
        <Layers className="w-5 h-5 text-[var(--accent)]" />
        <span className="font-semibold text-base hidden sm:inline">{t("appName")}</span>
      </Link>

      {/* Nav — hidden on mobile */}
      <nav className="hidden md:flex items-center gap-4 ml-4">
        <Link
          href="/decks"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {t("nav.myDecks")}
        </Link>
        <Link
          href="/collection"
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Package className="w-3.5 h-3.5" />
          {t("nav.collection")}
        </Link>
        <Link
          href="/rules/game-changers"
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
          {t("nav.rules")}
        </Link>
      </nav>

      {/* Desktop actions — hidden on mobile */}
      <div className="ml-auto hidden md:flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label={t("theme.toggle")}
          title={theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        {deckId ? (
          <ImportDialog>
            <button className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {t("nav.import")}
            </button>
          </ImportDialog>
        ) : (
          <ImportDialog open={importOpen} onOpenChange={setImportOpen}>
            <button
              onClick={handleImportFromHome}
              disabled={isCreatingImportDeck}
              className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded border border-[var(--border)] hover:border-[var(--accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingImportDeck ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {t("nav.import")}
            </button>
          </ImportDialog>
        )}
        <button
          type="button"
          onClick={handleNewDeck}
          disabled={isCreatingDeck}
          className="flex items-center gap-1.5 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreatingDeck ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          {t("nav.newDeck")}
        </button>
        <LocaleSwitcher />
        <UserMenu />
      </div>

      {/* Mobile: theme toggle + hamburger */}
      <div className="ml-auto flex md:hidden items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-secondary)]"
          aria-label={t("theme.toggle")}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-secondary)]"
          aria-label={t("menu.open")}
        >
          {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 z-50 md:hidden bg-[var(--surface)] border-b border-[var(--border)] shadow-lg">
          <nav className="flex flex-col p-4 gap-3">
            <Link
              href="/decks"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2"
            >
              {t("nav.myDecks")}
            </Link>
            <Link
              href="/collection"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2"
            >
              <Package className="w-3.5 h-3.5" />
              {t("nav.collection")}
            </Link>
            <Link
              href="/rules/game-changers"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2"
            >
              <Shield className="w-3.5 h-3.5" />
              {t("nav.rules")}
            </Link>
            <hr className="border-[var(--border)]" />
            {deckId ? (
              <ImportDialog>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {t("nav.import")}
                </button>
              </ImportDialog>
            ) : (
              <ImportDialog open={importOpen} onOpenChange={setImportOpen}>
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    await handleImportFromHome();
                  }}
                  disabled={isCreatingImportDeck}
                  className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingImportDeck ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {t("nav.import")}
                </button>
              </ImportDialog>
            )}
            <button
              type="button"
              onClick={async () => {
                setMenuOpen(false);
                await handleNewDeck();
              }}
              disabled={isCreatingDeck}
              className="flex items-center gap-1.5 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-3 py-2 rounded transition-colors w-fit disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingDeck ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {t("nav.newDeck")}
            </button>
            <div className="pt-1">
              <UserMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
