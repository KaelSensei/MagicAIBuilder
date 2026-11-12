"use client";
// Toast notification container
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { useToastStore } from "@/hooks/useToast";
import type { ToastType } from "@/hooks/useToast";
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

export function ToastContainer() {
  const t = useTranslations("common");
  // A toast raised by a catalog key (`LocalizedToastKey`) is translated here,
  // the one place with a locale; the keys span namespaces, hence no prefix.
  const translate = useTranslations();
  const { toasts, remove } = useToastStore();

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type];
          return (
            <motion.div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex min-w-[240px] max-w-[360px] items-center gap-3 rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] shadow-[var(--lumen-shadow-md)]",
              )}
              initial={{ opacity: 0, x: 48, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {style.icon}
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
        })}
      </AnimatePresence>
    </div>
  );
}
