"use client";
/**
 * The builder page's departure from a deck the player deletes there.
 *
 * Why: the deck store drops a deleted deck before the delete's caller can start the trip to the
 * library, and the page answers a deck missing from the store with "Deck not found". The page
 * holds this state so that, for a deck it deleted itself, it knows it is leaving instead. The
 * state lives and dies with the page, so a later visit to the same address (the Back button, a
 * stale link) still reports the deck missing.
 */
import { useMemo, useState } from "react";

/** What the delete control tells the page: leaving after a confirmed delete, or staying. */
export interface DeckDepartureControls {
  /** The player confirmed the delete; call it before the store can drop the deck. */
  readonly leave: () => void;
  /** The delete was refused or failed: the deck stays open. */
  readonly stay: () => void;
}

/** The page's side: whether it is leaving, plus the controls it hands to the delete control. */
export interface DeckDeparture extends DeckDepartureControls {
  /** True from a confirmed delete until the delete fails or the page goes away. */
  readonly isLeaving: boolean;
}

/**
 * Holds whether the builder page is leaving the open deck after deleting it.
 *
 * @returns the state and its controls; the object changes only when `isLeaving` does
 */
export function useDeckDeparture(): DeckDeparture {
  const [isLeaving, setIsLeaving] = useState(false);
  return useMemo(
    () => ({
      isLeaving,
      leave: () => setIsLeaving(true),
      stay: () => setIsLeaving(false),
    }),
    [isLeaving]
  );
}
