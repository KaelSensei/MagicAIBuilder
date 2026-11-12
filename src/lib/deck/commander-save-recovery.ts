/**
 * Rollbacks of the deck store's command-zone saves: when the one request that
 * saves a commander or partner change fails, the zone that was on screen
 * before it comes back, with the failure toast, unless a later choice has
 * replaced the failed attempt on screen.
 *
 * @module deck/commander-save-recovery
 */
import { useToastStore } from "@/hooks/useToast";

import { withLoadedCardCount } from "./loaded-card-count";
import type { Deck, DeckCard } from "./types";

/** The commander, partner and pairing shown together in the command zone. */
export type CommandZone = Pick<Deck, "commander" | "partner" | "pairingType">;

/** The slice of deck-store state a commander rollback reads and writes. */
interface DecksState {
  readonly decks: Record<string, Deck>;
}

/** A commander save or clear that may still need to be undone. */
export interface FailedCommanderSave {
  readonly activeDeckId: string;
  /** The command zone this attempt put on screen. */
  readonly attempted: CommandZone;
  /** The command zone on screen before this attempt. */
  readonly previous: CommandZone;
}

/**
 * Compares two command-zone slots by card identity.
 *
 * @param a - First slot, empty when null
 * @param b - Second slot, empty when null
 * @returns True when both slots hold the same card or are both empty
 */
function isSameSlot(a: DeckCard | null, b: DeckCard | null): boolean {
  return (a?.id ?? null) === (b?.id ?? null);
}

/**
 * Captures the command zone of a deck before an optimistic commander change.
 *
 * @param deck - Deck about to change, or undefined when it is not loaded
 * @returns The commander, partner and pairing to restore if the save fails
 */
export function commandZoneOf(deck: Deck | undefined): CommandZone {
  return {
    commander: deck?.commander ?? null,
    partner: deck?.partner ?? null,
    pairingType: deck?.pairingType ?? "none",
  };
}

/**
 * Restores the command zone that was on screen before a commander save failed,
 * while that failed attempt is still the commander on screen.
 *
 * A later commander choice is left alone, and so is a partner chosen while the
 * save was pending. The save is one request the server stores all or nothing,
 * so a failed attempt never left a partial record behind: the previous zone is
 * exactly what the server still holds.
 *
 * @param setDeckState - Store update used only when a rollback is required
 * @param state - Store snapshot taken when the save failed
 * @param save - The attempt that just failed
 * @returns Nothing. Updates the store and shows an error when the commander is restored.
 */
export function restoreCommanderAfterFailedSave(
  setDeckState: (partial: DecksState) => void,
  state: DecksState,
  save: FailedCommanderSave
): void {
  const currentDeck = state.decks[save.activeDeckId];
  if (
    !currentDeck ||
    !isSameSlot(currentDeck.commander, save.attempted.commander)
  ) {
    return;
  }
  const partner = isSameSlot(currentDeck.partner, save.attempted.partner)
    ? save.previous.partner
    : currentDeck.partner;
  setDeckState({
    decks: {
      ...state.decks,
      [save.activeDeckId]: withLoadedCardCount({
        ...currentDeck,
        commander: save.previous.commander,
        partner,
        pairingType: save.previous.pairingType,
        updatedAt: new Date(),
      }),
    },
  });
  useToastStore.getState().add("error", "Could not save commander — try again");
}

/** A partner save that may still need to be undone. */
export interface FailedPartnerSave {
  readonly activeDeckId: string;
  readonly attemptedPartnerId: string | null;
  readonly previousPartner: DeckCard | null;
  readonly previousPairingType: Deck["pairingType"];
}

/**
 * Restores the previous partner when this attempt is still the partner on
 * screen. A later partner choice is left alone. The save is one request the
 * server stores all or nothing, so the previous partner is what it still holds.
 *
 * @param setDeckState - Store update used only when a rollback is required
 * @param state - Store snapshot taken when the save failed
 * @param save - The attempt that just failed
 * @returns Nothing. Updates the store and shows an error when the partner is restored.
 */
export function restorePartnerAfterFailedSave(
  setDeckState: (partial: DecksState) => void,
  state: DecksState,
  save: FailedPartnerSave
): void {
  const currentDeck = state.decks[save.activeDeckId];
  const currentPartnerId = currentDeck?.partner?.id ?? null;
  if (!currentDeck || currentPartnerId !== save.attemptedPartnerId) return;
  setDeckState({
    decks: {
      ...state.decks,
      [save.activeDeckId]: withLoadedCardCount({
        ...currentDeck,
        partner: save.previousPartner,
        pairingType: save.previousPairingType,
        updatedAt: new Date(),
      }),
    },
  });
  useToastStore.getState().add("error", "Could not save partner — try again");
}
