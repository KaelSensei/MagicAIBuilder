/**
 * How long each kind of toast stays on screen and how a screen reader hears
 * it. Pure: the toast store reads the lifetime, the toast container reads the
 * announcement.
 *
 * Not responsible for: the timers themselves (`hooks/useToast.ts`) or pausing
 * on hover and focus (`components/ui/Toast.tsx`).
 *
 * @module lib/ui/toast-policy
 */

/** The kinds of toast the app raises. */
export type ToastType = "success" | "error" | "warning" | "info";

/** How a screen reader hears a toast: at once, or once it is idle (WCAG 4.1.3). */
export type ToastAnnouncement = "assertive" | "polite";

/**
 * The least time a toast that closes by itself stays on screen, before any
 * time the pointer or focus spends on it.
 *
 * Eight seconds is a proposed default, not a figure WCAG sets: 2.2.1 (Timing
 * Adjustable, https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable,
 * read 2026-11-20) asks that a player can keep a message as long as they
 * need, which hover and focus pausing provide. Until 2026-11 toasts closed
 * after three seconds (five for a warning), too short to read a sentence.
 */
export const TOAST_READING_TIME_MS = 8_000;

interface ToastPolicy {
  /** Milliseconds before the toast closes by itself, or `null` when only the player closes it. */
  readonly lifetimeMs: number | null;
  readonly announcement: ToastAnnouncement;
}

/**
 * An error stays until the player dismisses it: it reports something that did
 * not happen (a save, an add), which the player must not miss by looking
 * away. It interrupts, for the same reason. Everything else confirms or
 * informs, so it waits for the screen reader to be idle and leaves by itself.
 */
const TOAST_POLICIES: Readonly<Record<ToastType, ToastPolicy>> = {
  error: { lifetimeMs: null, announcement: "assertive" },
  warning: { lifetimeMs: TOAST_READING_TIME_MS, announcement: "polite" },
  success: { lifetimeMs: TOAST_READING_TIME_MS, announcement: "polite" },
  info: { lifetimeMs: TOAST_READING_TIME_MS, announcement: "polite" },
};

/**
 * How long a toast of this kind stays on screen by itself.
 *
 * @returns milliseconds, or `null` for a toast only the player closes
 */
export function toastLifetime(type: ToastType): number | null {
  return TOAST_POLICIES[type].lifetimeMs;
}

/** How a screen reader announces a toast of this kind. */
export function toastAnnouncement(type: ToastType): ToastAnnouncement {
  return TOAST_POLICIES[type].announcement;
}
