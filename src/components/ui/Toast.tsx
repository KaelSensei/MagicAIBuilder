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
  { bg: string; border: string; icon: React.ReactNode }
> = {
  success: {
    bg: "bg-green-950",
    border: "border-green-700",
    icon: <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />,
  },
  error: {
    bg: "bg-red-950",
    border: "border-red-700",
    icon: <XCircle className="w-4 h-4 text-red-400 shrink-0" />,
  },
  warning: {
    bg: "bg-amber-950",
    border: "border-amber-700",
    icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
  },
  info: {
    bg: "bg-blue-950",
    border: "border-blue-700",
    icon: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
  },
};

export function ToastContainer() {
  const t = useTranslations("common");
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
                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[240px] max-w-[360px]",
                style.bg,
                style.border
              )}
              initial={{ opacity: 0, x: 48, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {style.icon}
              <span className="flex-1 text-sm text-white leading-tight">
                {toast.message}
              </span>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                className="p-0.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
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
