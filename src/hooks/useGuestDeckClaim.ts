"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  claimGuestDeck,
  declineGuestClaim,
  hasDeclinedGuestClaim,
  readClaimableGuestDeck,
  type GuestDeckSummary,
} from "@/lib/deck/guest-claim";

/** Where the offer to save a guest deck stands. */
export type GuestDeckClaimState =
  | { readonly kind: "hidden" }
  | { readonly kind: "offered"; readonly deck: GuestDeckSummary }
  | { readonly kind: "saving"; readonly deck: GuestDeckSummary }
  | { readonly kind: "failed"; readonly deck: GuestDeckSummary }
  | {
      readonly kind: "saved";
      readonly deckId: string;
      readonly deckName: string;
    };

interface UseGuestDeckClaimOptions {
  /** Offer a deck the user already declined; the deck list keeps it reachable. */
  readonly includeDeclined: boolean;
  /** Called with the new deck's id once the account holds it. */
  readonly onSaved?: (deckId: string) => void;
}

const HIDDEN: GuestDeckClaimState = { kind: "hidden" };

/**
 * Offers a signed-in user to save the guest deck this browser still holds.
 *
 * Nothing is saved without the user's say: `accept` saves, `decline` keeps the
 * deck in the browser and stops the offer following them. `accept` runs once
 * at a time, so a double click sends one request.
 *
 * @param options - whether to include a declined deck, and what to do once saved
 * @returns the offer's state and its three actions
 */
export function useGuestDeckClaim({
  includeDeclined,
  onSaved,
}: UseGuestDeckClaimOptions) {
  const { status } = useSession();
  const [state, setState] = useState<GuestDeckClaimState>(HIDDEN);
  const saving = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setState(HIDDEN);
      return;
    }
    const claimable = readClaimableGuestDeck();
    if (
      !claimable ||
      (!includeDeclined && hasDeclinedGuestClaim(claimable.deck))
    ) {
      setState(HIDDEN);
      return;
    }
    setState({ kind: "offered", deck: claimable.summary });
  }, [status, includeDeclined]);

  const accept = useCallback(async () => {
    if (saving.current) return;
    // Read again: the deck may have changed since the offer was shown.
    const claimable = readClaimableGuestDeck();
    if (!claimable) {
      setState(HIDDEN);
      return;
    }
    saving.current = true;
    setState({ kind: "saving", deck: claimable.summary });
    const outcome = await claimGuestDeck(claimable.deck);
    saving.current = false;
    if (outcome.kind === "failed") {
      setState({ kind: "failed", deck: claimable.summary });
      return;
    }
    setState(outcome);
    onSaved?.(outcome.deckId);
  }, [onSaved]);

  const decline = useCallback(() => {
    const claimable = readClaimableGuestDeck();
    if (claimable) declineGuestClaim(claimable.deck);
    setState(HIDDEN);
  }, []);

  const dismiss = useCallback(() => setState(HIDDEN), []);

  return { state, accept, decline, dismiss };
}
