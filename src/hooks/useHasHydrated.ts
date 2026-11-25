/**
 * Whether the component's client code is running yet: false in the server
 * render and in the hydration over it, true in every render after.
 *
 * Server HTML reaches the browser before its client code does. A component
 * reads this to render, until the hydration, what the server and the browser
 * agree on: a text that does not depend on the browser's clock
 * (`DeckDatesLine`), or a button that stays disabled until its click handler
 * exists (`HeaderDeckActions`).
 *
 * It uses `useSyncExternalStore` rather than a `useEffect` that sets a state:
 * React hydrates with the server snapshot, so both sides render the same
 * markup, then re-renders at once with the client snapshot; a render that is
 * not a hydration (a client-side navigation, a unit test) reads true from the
 * start, with no extra render.
 *
 * @module hooks/useHasHydrated
 */
import { useSyncExternalStore } from "react";

/** Nothing to undo: whether the component has hydrated never changes back. */
function unsubscribeFromNothing(): void {
  // The store below never changes, so there is no listener to remove.
}

/** Hydration is the only change the store below has, and React handles it. */
function subscribeToNothing(): () => void {
  return unsubscribeFromNothing;
}

/** Every render in the browser that is not a hydration. */
function clientSnapshot(): boolean {
  return true;
}

/** The server render, and the hydration that must match it. */
function serverSnapshot(): boolean {
  return false;
}

/**
 * False in the server render and in the hydration, true in every render
 * after, and true at once in a render that is not a hydration.
 *
 * @returns whether the component's client code is running
 */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    clientSnapshot,
    serverSnapshot
  );
}
