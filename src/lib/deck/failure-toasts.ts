/**
 * The toasts the deck store raises when a deck save or load fails, as catalogue keys.
 *
 * The store has no locale of its own, so it raises each message by its key and the toast
 * container translates it in the player's locale (I-01, #1738). The English catalogue keeps the
 * words the store used to hard-code. Every key lives in each locale's `deck.json`, under `sync`;
 * the toast store accepts them through its `LocalizedToastKey` (`hooks/useToast.ts`).
 *
 * @module deck/failure-toasts
 */
import type { DeckOpenError } from "@/lib/deck/deck-open-error";

/** The catalogue key of each deck save or load failure the store reports. */
export type DeckFailureToastKey =
  | "deck.sync.refreshFailed"
  | "deck.sync.openFailed"
  | "deck.sync.renameFailed"
  | "deck.sync.descriptionFailed"
  | "deck.sync.tagsFailed"
  | "deck.sync.targetBracketFailed"
  | "deck.sync.manualBracketFailed"
  | "deck.sync.budgetFailed"
  | "deck.sync.cardRemovalFailed";

/** A failure toast, raised by its catalogue key. */
export interface DeckFailureToast {
  readonly key: DeckFailureToastKey;
}

/** The failure toast of each deck save or load the store reports by key. */
export const DECK_FAILURE_TOASTS = {
  refresh: { key: "deck.sync.refreshFailed" },
  open: { key: "deck.sync.openFailed" },
  rename: { key: "deck.sync.renameFailed" },
  description: { key: "deck.sync.descriptionFailed" },
  tags: { key: "deck.sync.tagsFailed" },
  targetBracket: { key: "deck.sync.targetBracketFailed" },
  manualBracket: { key: "deck.sync.manualBracketFailed" },
  budget: { key: "deck.sync.budgetFailed" },
  cardRemoval: { key: "deck.sync.cardRemovalFailed" },
} satisfies Readonly<Record<string, DeckFailureToast>>;

/**
 * The toast for each way opening a deck fails. A deck the server does not have (404) gets none:
 * a retry cannot bring it back, and the builder's "Deck not found" state is the only message.
 */
const OPEN_FAILURE_TOASTS: Readonly<
  Record<DeckOpenError["kind"], DeckFailureToast | undefined>
> = {
  "not-found": undefined,
  failed: DECK_FAILURE_TOASTS.open,
};

/**
 * The toast to raise when opening a deck failed.
 *
 * @param openError - why the deck did not open
 * @returns the open-failure toast, or `undefined` for a deck the server does not have
 */
export function openFailureToast(
  openError: DeckOpenError
): DeckFailureToast | undefined {
  return OPEN_FAILURE_TOASTS[openError.kind];
}
