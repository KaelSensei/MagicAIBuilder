"use client";

import { Loader2, Package, Plus, Shield, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { ImportDialog } from "@/components/deck/ImportDialog";
import { UserMenu } from "@/components/auth/UserMenu";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

interface HeaderMobileMenuProps {
  readonly open: boolean;
  readonly deckId?: string;
  readonly importOpen: boolean;
  readonly isCreatingDeck: boolean;
  readonly isCreatingImportDeck: boolean;
  readonly onClose: () => void;
  readonly onImportOpenChange: (open: boolean) => void;
  readonly onImportFromHome: () => Promise<void>;
  readonly onNewDeck: () => Promise<void>;
}

/**
 * Full-width navigation shown under the header on small screens.
 *
 * @param props - open state and the same deck actions the desktop bar uses
 * @returns the menu, or nothing while it is closed
 */
export function HeaderMobileMenu({
  open,
  deckId,
  importOpen,
  isCreatingDeck,
  isCreatingImportDeck,
  onClose,
  onImportOpenChange,
  onImportFromHome,
  onNewDeck,
}: HeaderMobileMenuProps) {
  const t = useTranslations("common");

  if (!open) return null;

  return (
    <div className="absolute top-full right-0 left-0 z-50 border-b border-[var(--border)] bg-[var(--surface)] shadow-[var(--lumen-shadow-md)] md:hidden">
      <nav aria-label={t("nav.myDecks")} className="flex flex-col gap-1 p-4">
        <Link
          href="/decks"
          onClick={onClose}
          className="rounded-[var(--lumen-radius-md)] px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
        >
          {t("nav.myDecks")}
        </Link>
        <Link
          href="/collection"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-[var(--lumen-radius-md)] px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
        >
          <Package className="h-3.5 w-3.5" />
          {t("nav.collection")}
        </Link>
        <Link
          href="/rules/game-changers"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-[var(--lumen-radius-md)] px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
        >
          <Shield className="h-3.5 w-3.5" />
          {t("nav.rules")}
        </Link>
        <hr className="my-2 border-[var(--border)]" />
        {deckId ? (
          <ImportDialog>
            <Button variant="secondary" onClick={onClose} className="w-fit">
              <Upload className="h-3.5 w-3.5" />
              {t("nav.import")}
            </Button>
          </ImportDialog>
        ) : (
          <ImportDialog open={importOpen} onOpenChange={onImportOpenChange}>
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                void onImportFromHome();
              }}
              disabled={isCreatingImportDeck}
              className="w-fit"
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
        <Button
          onClick={() => {
            onClose();
            void onNewDeck();
          }}
          disabled={isCreatingDeck}
          className="mt-2 w-fit"
        >
          {isCreatingDeck ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {t("nav.newDeck")}
        </Button>
        <div className="pt-2">
          <UserMenu />
        </div>
      </nav>
    </div>
  );
}
