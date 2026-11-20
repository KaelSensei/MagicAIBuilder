"use client";
// Full-screen modal frame for the playtest: dialog role, focus trap and return, Escape
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { useDialogFocusReturn } from "@/hooks/useDialogFocusReturn";
import { isTextEntryTarget } from "@/components/playtest/key-targets";

/**
 * Escape in a text field stays with the field. The action log cancels an edit
 * with it, and closing the playtest would discard the whole game.
 * @param event - The Escape keydown Radix is about to treat as a dismissal
 */
function leaveEscapeToTextFields(event: KeyboardEvent): void {
  if (isTextEntryTarget(event.target)) event.preventDefault();
}

interface PlaytestDialogProps {
  readonly onClose: () => void;
  /** The playtest, which must render a `ModalTitle` to name the dialog. */
  readonly children: ReactNode;
}

/**
 * The playtest's full-screen modal dialog.
 *
 * Focus moves to the first control on open, stays inside the playtest, and
 * goes back to the builder's Playtest button on close. Escape closes it unless
 * the focus is in a text field.
 */
export function PlaytestDialog({ onClose, children }: PlaytestDialogProps) {
  const focusReturn = useDialogFocusReturn();

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Content
          asChild
          {...focusReturn}
          onEscapeKeyDown={leaveEscapeToTextFields}
        >
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-[var(--background)] text-[var(--text-primary)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {children}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
