"use client";
/**
 * Hands the signed-in account to the deck store, so the deck the player had
 * open before a full page load opens again, and so signing out forgets it
 * (I-37, issue #1851). It renders nothing.
 *
 * The store keeps the remembered deck per account (`lib/deck/open-deck-memory`)
 * and cannot read the session itself; this component is the one place the
 * session reaches it. It waits while the session loads, so a returning player
 * is never taken for a signed-out one.
 *
 * @module components/deck/OpenDeckAccountSync
 */
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDeckStore } from "@/lib/deck/store";

/**
 * Follows the session: the signed-in account's id once known, or null once
 * nobody is signed in. Mount it once, inside the `SessionProvider`.
 *
 * @returns nothing
 */
export function OpenDeckAccountSync(): null {
  const { data: session, status } = useSession();
  const syncOpenDeckWithAccount = useDeckStore(
    (state) => state.syncOpenDeckWithAccount
  );
  const accountId = session?.user?.id ?? null;

  useEffect(() => {
    if (status === "loading") return;
    void syncOpenDeckWithAccount(accountId);
  }, [accountId, status, syncOpenDeckWithAccount]);

  return null;
}
