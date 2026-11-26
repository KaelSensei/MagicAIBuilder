"use client";
// Focus return for Radix dialogs that open from state rather than a Dialog.Trigger
import { useMemo, useRef } from "react";

/** The `Dialog.Content` focus props that `useDialogFocusReturn` supplies. */
export interface DialogFocusReturnProps {
  readonly onOpenAutoFocus: () => void;
  readonly onCloseAutoFocus: (event: Event) => void;
}

/**
 * Returns focus to whatever opened a Radix dialog once it closes.
 *
 * A modal `Dialog.Content` focuses its `Dialog.Trigger` on close. Most dialogs
 * here open from state (`setOpen(true)`, a store flag) and have no trigger, so
 * focus fell to `<body>` and keyboard users lost their place. These handlers
 * remember the element that had focus when the dialog opened and focus it
 * again on close, if it is still on the page.
 *
 * Opening still moves focus to the dialog's first control: the open handler
 * only records, it does not prevent Radix's own initial focus.
 *
 * The opener can leave while the dialog is open: the collection's empty state,
 * whose "Add cards" opens the add dialog, unmounts once a first card is added.
 * `fallback` then names where focus goes instead of `<body>`.
 *
 * @param fallback - the element to focus when the opener has left the page;
 *   read on close, and stable across renders (a `useCallback`)
 * @returns props to spread onto `Dialog.Content`
 */
export function useDialogFocusReturn(
  fallback?: () => HTMLElement | null
): DialogFocusReturnProps {
  const returnTarget = useRef<HTMLElement | null>(null);

  return useMemo(
    () => ({
      onOpenAutoFocus: () => {
        const active = document.activeElement;
        returnTarget.current = active instanceof HTMLElement ? active : null;
      },
      onCloseAutoFocus: (event: Event) => {
        event.preventDefault();
        const target = returnTarget.current;
        returnTarget.current = null;
        if (target?.isConnected) {
          target.focus();
          return;
        }
        fallback?.()?.focus();
      },
    }),
    [fallback]
  );
}
