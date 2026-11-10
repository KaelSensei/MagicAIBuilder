"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { GuestDeckClaimOffer } from "./GuestDeckClaimOffer";

/** Locale-free paths, as next-intl's `usePathname` reports them. */
const GUEST_BUILDER_PATH = "/builder/guest";
const DECK_LIST_PATH = "/decks";

/**
 * The app-wide offer to save a guest deck, shown on the first page a signed-in
 * user opens, wherever sign-in sent them.
 *
 * The deck list shows its own inline offer, so this one stays out of the way
 * there. On the guest builder, a saved deck replaces the guest one on screen.
 *
 * @returns the floating offer, or nothing on the deck list
 */
export function GuestDeckClaimPrompt() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSaved = useCallback(
    (deckId: string) => {
      if (pathname === GUEST_BUILDER_PATH) router.replace(`/builder/${deckId}`);
    },
    [pathname, router]
  );

  if (pathname === DECK_LIST_PATH) return null;

  return <GuestDeckClaimOffer placement="floating" onSaved={handleSaved} />;
}
