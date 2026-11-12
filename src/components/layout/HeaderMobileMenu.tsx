"use client";

/**
 * The header's navigation on small screens: the same links, deck actions and
 * account menu as the desktop bar, stacked under it.
 *
 * Shell (`components/layout`). The deck actions come from
 * `HeaderDeckActionsSlot`, as in `Header`, and share the header's UI state so
 * an import started here, which closes the menu, opens the one dialog the
 * desktop instance hosts.
 *
 * @module layout/HeaderMobileMenu
 */

import type { Dispatch, SetStateAction } from "react";
import { Package, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { UserMenu } from "@/components/auth/UserMenu";
import type { HeaderDeckActionsUiState } from "@/components/layout/header-deck-actions-state";
import { HeaderDeckActionsSlot } from "@/components/layout/HeaderDeckActionsSlot";
import { Link } from "@/i18n/navigation";

interface HeaderMobileMenuProps {
  readonly open: boolean;
  /** The deck open in the builder. Import then fills it instead of a new deck. */
  readonly deckId?: string;
  /** Shared with the desktop bar; see `header-deck-actions-state`. */
  readonly deckActions: HeaderDeckActionsUiState;
  readonly onDeckActionsChange: Dispatch<
    SetStateAction<HeaderDeckActionsUiState>
  >;
  readonly onClose: () => void;
}

/**
 * Full-width navigation shown under the header on small screens.
 *
 * Every link and action closes the menu as it runs.
 *
 * @returns the menu, or nothing while it is closed
 */
export function HeaderMobileMenu({
  open,
  deckId,
  deckActions,
  onDeckActionsChange,
  onClose,
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
        <HeaderDeckActionsSlot
          deckId={deckId}
          layout="mobile"
          uiState={deckActions}
          onUiStateChange={onDeckActionsChange}
          onAction={onClose}
        />
        <div className="pt-2">
          <UserMenu />
        </div>
      </nav>
    </div>
  );
}
