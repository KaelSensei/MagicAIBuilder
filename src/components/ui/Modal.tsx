"use client";
// Generic modal wrapper — shared overlay + container, eliminates duplication across modals
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui/utils";

interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  /** Max width class, defaults to "max-w-lg" */
  readonly maxWidth?: string;
  readonly className?: string;
  readonly children: ReactNode;
  /** Show X close button in top-right corner (default true) */
  readonly showClose?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  maxWidth = "max-w-lg",
  className,
  children,
  showClose = true,
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    globalThis.window.addEventListener("keydown", handler);
    return () => globalThis.window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={cn(
              "bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl w-full mx-4",
              maxWidth,
              className
            )}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            {(title || showClose) && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                {title && (
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    {title}
                  </h2>
                )}
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="ml-auto text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
