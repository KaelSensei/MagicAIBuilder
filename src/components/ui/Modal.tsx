"use client";
// Generic modal wrapper — shared overlay + container, eliminates duplication across modals.
// Built on Radix Dialog for the dialog role, focus trap, focus return and an
// Escape that closes only the topmost dialog.
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { cardSurfaceClassName } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils";
import { useDialogFocusReturn } from "@/hooks/useDialogFocusReturn";

interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /**
   * Heading drawn in the modal's own header, which also names the dialog.
   * Leave it out only when the children render a `ModalTitle`.
   */
  readonly title?: string;
  /** Max width class, defaults to "max-w-lg" */
  readonly maxWidth?: string;
  readonly className?: string;
  readonly children: ReactNode;
  /** Show X close button in top-right corner (default true) */
  readonly showClose?: boolean;
}

/**
 * Heading for a modal that draws its own header instead of passing `title`.
 * It renders an `<h2>` and gives the dialog its accessible name.
 */
export const ModalTitle = Dialog.Title;

/**
 * Centered modal dialog on the app's card surface.
 *
 * Focus moves to the first control on open, stays inside while open, and goes
 * back to the element that opened it on close. Escape and a press outside the
 * panel close it; with dialogs stacked, only the top one closes.
 */
export function Modal({
  open,
  onClose,
  title,
  maxWidth = "max-w-lg",
  className,
  children,
  showClose = true,
}: ModalProps) {
  const t = useTranslations("common");
  const focusReturn = useDialogFocusReturn();

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Dialog.Content asChild {...focusReturn}>
              <motion.div
                className={cn(
                  cardSurfaceClassName,
                  "mx-4 w-full shadow-[var(--lumen-shadow-lg)]",
                  maxWidth,
                  className
                )}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
              >
                {(title || showClose) && (
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                    {title && (
                      <Dialog.Title className="text-base font-semibold text-[var(--text-primary)]">
                        {title}
                      </Dialog.Title>
                    )}
                    {showClose && (
                      <Dialog.Close
                        className="ml-auto text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label={t("actions.close")}
                      >
                        <X className="w-4 h-4" />
                      </Dialog.Close>
                    )}
                  </div>
                )}
                {children}
              </motion.div>
            </Dialog.Content>
          </motion.div>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
