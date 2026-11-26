"use client";
/**
 * The toast store: the toasts on screen, and the timers that close the ones
 * that close by themselves.
 *
 * How long each kind stays, and which kinds wait for the player, is the
 * toast policy's rule (`lib/ui/toast-policy.ts`). Each timer is cancelled
 * when its toast is removed, so a dismissed toast leaves no timer running.
 */
import { create } from "zustand";
import type { DeckFailureToastKey } from "@/lib/deck/failure-toasts";
import { toastLifetime, type ToastType } from "@/lib/ui/toast-policy";

export type { ToastType } from "@/lib/ui/toast-policy";

/**
 * The catalog keys a toast may be raised by, as `useTranslations()` without a
 * namespace reads them. Raised by code that has no locale of its own (the deck
 * store); the toast container translates them in the player's locale. The
 * deck store's save and load failures are listed in `lib/deck/failure-toasts.ts`.
 */
export type LocalizedToastKey =
  | "deck.sync.conflictReloaded"
  | "deck.undo.openOriginalDeck"
  | DeckFailureToastKey;

/** A toast's text: the words themselves, or the catalog key the container translates. */
export type ToastMessage = string | { readonly key: LocalizedToastKey };

export interface Toast {
  id: string;
  type: ToastType;
  message: ToastMessage;
}

interface ToastStore {
  toasts: Toast[];
  add: (type: ToastType, message: ToastMessage) => void;
  /** Removes the toast and cancels its timer. Unknown ids are ignored. */
  remove: (id: string) => void;
  /** Stops the toast's countdown while the player reads it (pointer or focus on it). */
  hold: (id: string) => void;
  /** Gives a held toast a fresh reading time. A toast that waits for the player stays. */
  release: (id: string) => void;
}

/**
 * The pending auto-close timer of each toast, by id. Kept outside the state:
 * no component renders a timer, and a state update per tick would re-render
 * every subscriber.
 */
const closeTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Cancels the toast's pending auto-close, if it has one. */
function cancelCloseTimer(id: string): void {
  const timer = closeTimers.get(id);
  if (timer === undefined) return;
  clearTimeout(timer);
  closeTimers.delete(id);
}

/** Returns a state updater that removes the toast with the given id */
function withoutToast(id: string) {
  return (state: ToastStore) => ({ toasts: state.toasts.filter((t) => t.id !== id) });
}

export const useToastStore = create<ToastStore>((set, get) => {
  /** Starts the toast's countdown afresh, unless its kind waits for the player. */
  function scheduleClose(toast: Toast): void {
    cancelCloseTimer(toast.id);
    const lifetime = toastLifetime(toast.type);
    if (lifetime === null) return;
    closeTimers.set(
      toast.id,
      setTimeout(() => get().remove(toast.id), lifetime)
    );
  }

  return {
    toasts: [],
    add: (type, message) => {
      const toast: Toast = { id: crypto.randomUUID(), type, message };
      set((state) => ({ toasts: [...state.toasts, toast] }));
      scheduleClose(toast);
    },
    remove: (id) => {
      cancelCloseTimer(id);
      set(withoutToast(id));
    },
    hold: cancelCloseTimer,
    release: (id) => {
      const toast = get().toasts.find((t) => t.id === id);
      if (toast !== undefined) scheduleClose(toast);
    },
  };
});

/** Convenience hook — returns typed toast helpers */
export function useToast() {
  const { add } = useToastStore();

  return {
    success: (message: string) => add("success", message),
    error: (message: string) => add("error", message),
    warning: (message: string) => add("warning", message),
    info: (message: string) => add("info", message),
    toast: add,
  };
}
