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
import {
  ariaCurrentPage,
  CURRENT_PAGE_LINK_CLASS,
  currentNavDestination,
} from "@/components/layout/primary-nav";
import { Link, usePathname } from "@/i18n/navigation";

const MENU_LINK_CLASS = `rounded-[var(--lumen-radius-md)] px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)] ${CURRENT_PAGE_LINK_CLASS}`;

/** A menu link led by an icon. */
const MENU_ICON_LINK_CLASS = `flex items-center gap-1.5 ${MENU_LINK_CLASS}`;

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
 * Every link and action closes the menu as it runs. The link to the page the
 * player is on is marked as in the desktop bar (`primary-nav`).
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
  const current = currentNavDestination(usePathname());

  if (!open) return null;

  return (
    <div className="absolute top-full right-0 left-0 z-50 border-b border-[var(--border)] bg-[var(--surface)] shadow-[var(--lumen-shadow-md)] md:hidden">
      <nav aria-label={t("nav.myDecks")} className="flex flex-col gap-1 p-4">
        <Link
          href="/decks"
          aria-current={ariaCurrentPage(current, "decks")}
          onClick={onClose}
          className={MENU_LINK_CLASS}
        >
          {t("nav.myDecks")}
        </Link>
        <Link
          href="/collection"
          aria-current={ariaCurrentPage(current, "collection")}
          onClick={onClose}
          className={MENU_ICON_LINK_CLASS}
        >
          <Package className="h-3.5 w-3.5" />
          {t("nav.collection")}
        </Link>
        <Link
          href="/rules/game-changers"
          aria-current={ariaCurrentPage(current, "rules")}
          onClick={onClose}
          className={MENU_ICON_LINK_CLASS}
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
