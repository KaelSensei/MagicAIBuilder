"use client";

/**
 * The header's deck actions, "New Deck" and "Import", shown on every page.
 *
 * Shell (`components/layout`); the only part of the header that touches the
 * deck store and the import dialog. Pages reach it through
 * `HeaderDeckActionsSlot`, which loads this module lazily. The desktop bar and
 * the mobile menu each render one instance; both read and write the UI state
 * that `Header` owns (see `header-deck-actions-state`).
 *
 * Only the desktop instance renders the `ImportDialog`. The mobile menu
 * unmounts itself on every press, so a dialog rendered inside it disappeared
 * with the menu the moment "Import" opened it; the desktop bar is always
 * mounted, only hidden by CSS on small screens, and the dialog is a portal, so
 * it shows from there on every viewport.
 *
 * @module layout/HeaderDeckActions
 */

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Loader2, Plus, Upload, type LucideIcon } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { ImportDialog } from "@/components/deck/ImportDialog";
import type { HeaderDeckActionsUiState } from "@/components/layout/header-deck-actions-state";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToast";
import { useDeckStore } from "@/lib/deck/store";
import { logger } from "@/lib/logger";

/** Where the actions sit. The layouts differ only in button spacing. */
export type HeaderDeckActionsLayout = "desktop" | "mobile";

export interface HeaderDeckActionsProps {
  /** The deck open in the builder. Import then fills it instead of a new deck. */
  readonly deckId?: string;
  readonly layout: HeaderDeckActionsLayout;
  /** Shared with the other instance through `Header`. */
  readonly uiState: HeaderDeckActionsUiState;
  readonly onUiStateChange: Dispatch<SetStateAction<HeaderDeckActionsUiState>>;
  /** Runs on every press, before the action. The mobile menu closes with it. */
  readonly onAction?: () => void;
}

type UiStateChange = HeaderDeckActionsProps["onUiStateChange"];

interface LayoutConfig {
  /** Renders the one `ImportDialog`; the other instance only asks to open it. */
  readonly hostsImportDialog: boolean;
  readonly importClassName: string | undefined;
  readonly newDeckClassName: string | undefined;
}

// The desktop bar hosts the dialog because it never unmounts (see the module
// header). In the mobile menu the buttons stack in a column and keep their own
// width.
const LAYOUTS: Record<HeaderDeckActionsLayout, LayoutConfig> = {
  desktop: {
    hostsImportDialog: true,
    importClassName: undefined,
    newDeckClassName: undefined,
  },
  mobile: {
    hostsImportDialog: false,
    importClassName: "w-fit",
    newDeckClassName: "mt-2 w-fit",
  },
};

/**
 * Logs a failed deck creation and tells the player why, in a toast.
 *
 * Logging alone made the button look inert: it spun, the request failed, and
 * the player was left on the same screen with no explanation.
 */
function useCreateFailureReport() {
  const t = useTranslations("common");
  const addToast = useToastStore((s) => s.add);

  return useCallback(
    (operation: string, error: unknown) => {
      logger.error("Unexpected error", operation, error);
      addToast(
        "error",
        t("nav.createFailed", {
          reason:
            error instanceof Error ? error.message : t("nav.unknownError"),
        })
      );
    },
    [addToast, t]
  );
}

/**
 * Creates a deck named in the player's locale and opens it in the builder.
 *
 * Refuses a second press while one creation is pending. On failure the
 * player gets a toast and the button is enabled again.
 */
function useNewDeck(pending: boolean, onUiStateChange: UiStateChange) {
  const t = useTranslations("common");
  const router = useRouter();
  const createDeck = useDeckStore((s) => s.createDeck);
  const reportFailure = useCreateFailureReport();

  return useCallback(async () => {
    if (pending) return;
    onUiStateChange((s) => ({ ...s, isCreatingDeck: true }));
    try {
      // The default name is stored data: write it once, in the creator's
      // locale, as the imported-deck name does.
      const id = await createDeck(t("nav.newDeck"));
      router.push(`/builder/${id}`);
    } catch (error) {
      reportFailure("HeaderDeckActions.newDeck", error);
    } finally {
      onUiStateChange((s) => ({ ...s, isCreatingDeck: false }));
    }
  }, [createDeck, onUiStateChange, pending, reportFailure, router, t]);
}

/**
 * Import from a page without a deck: creates a deck named after the date,
 * activates it, then opens the import dialog on it.
 *
 * Same pending and failure rules as `useNewDeck`.
 */
function useImportFromHome(pending: boolean, onUiStateChange: UiStateChange) {
  const t = useTranslations("common");
  const format = useFormatter();
  const createDeck = useDeckStore((s) => s.createDeck);
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck);
  const reportFailure = useCreateFailureReport();

  return useCallback(async () => {
    if (pending) return;
    onUiStateChange((s) => ({ ...s, isCreatingImportDeck: true }));
    try {
      const id = await createDeck(
        t("nav.importedDeck", { date: format.dateTime(new Date()) })
      );
      await setActiveDeck(id);
      onUiStateChange((s) => ({ ...s, importOpen: true }));
    } catch (error) {
      reportFailure("HeaderDeckActions.importFromHome", error);
    } finally {
      onUiStateChange((s) => ({ ...s, isCreatingImportDeck: false }));
    }
  }, [
    createDeck,
    format,
    onUiStateChange,
    pending,
    reportFailure,
    setActiveDeck,
    t,
  ]);
}

function ActionIcon({
  pending,
  icon: Icon,
}: {
  readonly pending: boolean;
  readonly icon: LucideIcon;
}) {
  return pending ? (
    <Loader2 className="h-3.5 w-3.5 animate-spin" />
  ) : (
    <Icon className="h-3.5 w-3.5" />
  );
}

/**
 * "Import" and "New Deck" for the header.
 *
 * In the builder, "Import" opens the dialog on the current deck. Elsewhere it
 * first creates a deck (see `useImportFromHome`). "New Deck" creates and opens
 * a deck (see `useNewDeck`). `onAction` runs first on every press, so the
 * mobile menu is gone before the action starts; the dialog survives that
 * because the desktop instance hosts it, and its open state is the shared
 * `uiState.importOpen` on every page.
 */
export function HeaderDeckActions({
  deckId,
  layout,
  uiState,
  onUiStateChange,
  onAction,
}: HeaderDeckActionsProps) {
  const t = useTranslations("common");
  const { importOpen, isCreatingDeck, isCreatingImportDeck } = uiState;
  const layoutConfig = LAYOUTS[layout];
  const newDeck = useNewDeck(isCreatingDeck, onUiStateChange);
  const importFromHome = useImportFromHome(
    isCreatingImportDeck,
    onUiStateChange
  );

  const handleImportOpenChange = useCallback(
    (open: boolean) => onUiStateChange((s) => ({ ...s, importOpen: open })),
    [onUiStateChange]
  );
  const openImport = useCallback(
    () => handleImportOpenChange(true),
    [handleImportOpenChange]
  );

  const press = (action: () => void | Promise<void>) => () => {
    onAction?.();
    void action();
  };

  const importButton = (
    <Button
      variant="secondary"
      onClick={press(deckId ? openImport : importFromHome)}
      disabled={isCreatingImportDeck}
      className={layoutConfig.importClassName}
    >
      <ActionIcon pending={isCreatingImportDeck} icon={Upload} />
      {t("nav.import")}
    </Button>
  );

  return (
    <>
      {layoutConfig.hostsImportDialog ? (
        // The button stays the dialog's trigger here, so it keeps the popup
        // semantics and gets focus back when the dialog closes.
        <ImportDialog open={importOpen} onOpenChange={handleImportOpenChange}>
          {importButton}
        </ImportDialog>
      ) : (
        importButton
      )}
      <Button
        onClick={press(newDeck)}
        disabled={isCreatingDeck}
        className={layoutConfig.newDeckClassName}
      >
        <ActionIcon pending={isCreatingDeck} icon={Plus} />
        {t("nav.newDeck")}
      </Button>
    </>
  );
}
