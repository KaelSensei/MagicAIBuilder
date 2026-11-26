/**
 * The UI state the header's deck actions share between their two instances.
 *
 * Shell (`components/layout`). `Header` owns one value of this state and hands
 * it to the desktop bar's and the mobile menu's `HeaderDeckActionsSlot`. The
 * two must share it: the mobile menu closes itself on a press, so an import
 * started there opens the one dialog the desktop instance hosts. This module
 * carries no store import, so `Header` stays light; the actions themselves
 * live in `HeaderDeckActions`.
 *
 * @module layout/header-deck-actions-state
 */

import type { Dispatch, SetStateAction } from "react";

/** What the deck actions are doing right now; one value per header. */
export interface HeaderDeckActionsUiState {
  /** The import dialog is open, whichever instance asked for it. */
  readonly importOpen: boolean;
  /** "New Deck" is waiting for the server; the button is disabled meanwhile. */
  readonly isCreatingDeck: boolean;
  /** "Import" is creating the deck that will receive the list. */
  readonly isCreatingImportDeck: boolean;
}

/**
 * The deck actions' state and its setter, when a page holds them instead of
 * `Header`. The decks page does, so its empty library's "Import a decklist"
 * starts the header's import and the header's dialog opens.
 */
export interface SharedHeaderDeckActions {
  readonly state: HeaderDeckActionsUiState;
  readonly onChange: Dispatch<SetStateAction<HeaderDeckActionsUiState>>;
}

/** Nothing pending, dialog closed. */
export const IDLE_HEADER_DECK_ACTIONS: HeaderDeckActionsUiState = {
  importOpen: false,
  isCreatingDeck: false,
  isCreatingImportDeck: false,
};
