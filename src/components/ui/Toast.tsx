"use client";
/**
 * The toast container: shows the toast store's messages at the bottom right,
 * each with a named dismiss button.
 *
 * Toasts sit in two live regions that are always mounted, a polite one and an
 * assertive one, so a screen reader hears each new toast by the kind's rule
 * (`lib/ui/toast-policy.ts`, WCAG 4.1.3). A live region inserted together with
 * its text is announced unreliably; one that already exists is not. A toast
 * stops its countdown while the pointer or focus is on it (WCAG 2.2.1).
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { useToastStore } from "@/hooks/useToast";
import type { Toast, ToastType } from "@/hooks/useToast";
import { toastAnnouncement } from "@/lib/ui/toast-policy";
import { cn } from "@/components/ui/utils";

const TOAST_STYLES: Record<
  ToastType,
  { icon: React.ReactNode }
> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />,
  },
  error: {
    icon: <XCircle className="h-4 w-4 shrink-0 text-red-600" />,
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />,
  },
  info: {
    icon: <Info className="h-4 w-4 shrink-0 text-violet-600" />,
  },
};

/** The toasts on screen, split by how a screen reader announces them, in their order. */
interface AnnouncedToasts {
  readonly polite: readonly Toast[];
  readonly assertive: readonly Toast[];
}

/** Splits the toasts by announcement in one pass, keeping their order. */
function byAnnouncement(toasts: readonly Toast[]): AnnouncedToasts {
  const polite: Toast[] = [];
  const assertive: Toast[] = [];
  for (const toast of toasts) {
    if (toastAnnouncement(toast.type) === "assertive") assertive.push(toast);
    else polite.push(toast);
  }
  return { polite, assertive };
}

/**
 * Keeps the toast's countdown stopped while `held` is true, and gives it a
 * fresh reading time once it is not. A toast removed while held stays
 * removed: the store ignores a release of an unknown id.
 */
function useHoldWhile(id: string, held: boolean): void {
  const hold = useToastStore((state) => state.hold);
  const release = useToastStore((state) => state.release);
  useEffect(() => {
    if (!held) return;
    hold(id);
    return () => release(id);
  }, [id, held, hold, release]);
}

/** One toast: its icon, its text and its dismiss button. */
function ToastItem({ toast }: { readonly toast: Toast }) {
  const t = useTranslations("common");
  // A toast raised by a catalog key (`LocalizedToastKey`) is translated here,
  // the one place with a locale; the keys span namespaces, hence no prefix.
  const translate = useTranslations();
  const remove = useToastStore((state) => state.remove);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useHoldWhile(toast.id, hovered || focused);

  return (
    <motion.div
      className={cn(
        "pointer-events-auto flex min-w-[240px] max-w-[360px] items-center gap-3 rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] shadow-[var(--lumen-shadow-md)]",
      )}
      initial={{ opacity: 0, x: 48, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 48, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {TOAST_STYLES[toast.type].icon}
      <span className="flex-1 text-sm leading-tight text-[var(--text-primary)]">
        {typeof toast.message === "string"
          ? toast.message
          : translate(toast.message.key)}
      </span>
      <button
        type="button"
        onClick={() => remove(toast.id)}
        className="rounded p-0.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        aria-label={t("actions.dismiss")}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

/** The toasts on screen, bottom right; errors sit nearest the corner. */
export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const { polite, assertive } = byAnnouncement(toasts);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col pointer-events-none">
      <div className="flex flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {polite.map((toast) => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
      <div className="flex flex-col gap-2 not-empty:mt-2" aria-live="assertive">
        <AnimatePresence>
          {assertive.map((toast) => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
