"use client";

/**
 * Import from a page without a deck: the header's "Import" outside the builder.
 *
 * Shell (`components/layout`). It lives apart from `HeaderDeckActions` so a
 * page that shares the header's deck-action state can start the same import
 * without loading the import dialog, which only the header hosts (see
 * `HeaderDeckActions`).
 *
 * @module layout/use-import-into-new-deck
 */

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { HeaderDeckActionsUiState } from "@/components/layout/header-deck-actions-state";
import { useDeckCreateFailureReport } from "@/hooks/useDeckFailureReport";
import { useDeckStore } from "@/lib/deck/store";

/**
 * Creates a deck named after today's date, activates it, then asks for the
 * import dialog to open on it.
 *
 * Refuses a second press while one creation is pending. On failure the
 * player gets a toast, the dialog stays closed, and the action can be pressed
 * again.
 *
 * @param pending - an import deck is being created already
 * @param onUiStateChange - the setter of the header's shared deck-action state
 * @returns the action to run on a press
 */
export function useImportIntoNewDeck(
  pending: boolean,
  onUiStateChange: Dispatch<SetStateAction<HeaderDeckActionsUiState>>
) {
  const t = useTranslations("common");
  const format = useFormatter();
  const createDeck = useDeckStore((s) => s.createDeck);
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck);
  const reportFailure = useDeckCreateFailureReport();

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
