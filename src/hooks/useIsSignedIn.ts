"use client";
/**
 * Whether a player is signed in, read from Auth.js's session context.
 *
 * `useSession` throws outside a `SessionProvider`, and the deck row is drawn
 * in places that mount none (the deck preview, older component tests). An
 * action that needs an account only has to know that someone is signed in;
 * with no provider above it, nobody is.
 *
 * @module hooks/useIsSignedIn
 */
import { SessionContext } from "next-auth/react";
import { useContext } from "react";

/**
 * Reads the session without requiring a provider.
 *
 * @returns true once a session with a user is known; false for a guest, while
 *   the session loads, and when no `SessionProvider` is mounted
 */
export function useIsSignedIn(): boolean {
  const session = useContext(SessionContext);
  return Boolean(session?.data?.user);
}
