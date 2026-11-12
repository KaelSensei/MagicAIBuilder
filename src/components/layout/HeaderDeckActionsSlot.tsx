"use client";

/**
 * Lazy entry to the header's deck actions.
 *
 * Shell (`components/layout`). `Header` and `HeaderMobileMenu` render this slot
 * instead of `HeaderDeckActions`, so the deck store and the import dialog load
 * in their own chunk instead of every page's first bundle (audit_architecture
 * 1.10, slice P1-52). The actions are still server-rendered; only their client
 * code arrives after the page's own.
 *
 * @module layout/HeaderDeckActionsSlot
 */

import dynamic from "next/dynamic";

/**
 * `HeaderDeckActions`, loaded on demand, with the same props.
 *
 * Until the chunk arrives the slot renders nothing: the server HTML already
 * holds the buttons, so a placeholder would only matter before hydration.
 */
export const HeaderDeckActionsSlot = dynamic(
  () =>
    import("@/components/layout/HeaderDeckActions").then(
      (module) => module.HeaderDeckActions
    ),
  { loading: () => null }
);
