"use client";
// Bulk Edit modal — edit the entire deck as plain text, Moxfield-style
import { useState, useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { exportToText, parseTextDecklist, type ImportResult } from "@/lib/deck/import";
import {
  isEmptyBulkEdit,
  namesToLookUp,
  planBulkEdit,
  resolveBulkEdit,
  type BulkEditRejection,
} from "@/lib/deck/bulk-edit";
import { fetchInBatches } from "@/lib/deck/batch-fetch";
import { useDeckStore } from "@/lib/deck/store";
import type { Deck } from "@/lib/deck/types";
import { cardsFromZoneSource } from "@/lib/deck/zone-source";
import { buildScryfallNameIndex } from "@/lib/scryfall/name-index";

interface BulkEditModalProps {
  readonly deck: Deck;
  readonly children: React.ReactNode;
}

type SaveStatus = "idle" | "saving" | "done" | "error";

const DESCRIPTION_RICH_TAGS = {
  code: (chunks: ReactNode) => (
    <code className="text-xs bg-[var(--surface-hover)] px-1 rounded">
      {chunks}
    </code>
  ),
};

function getStatusTextClass(status: SaveStatus): string {
  if (status === "error") return "text-red-400";
  if (status === "done") return "text-green-400";
  return "text-[var(--text-secondary)]";
}

interface SaveStatusMessageProps {
  readonly status: SaveStatus;
  /** The line to show; the caller renders nothing while it is empty. */
  readonly message: string;
}

/**
 * The save's progress line. A failure is an alert, so it interrupts; progress
 * and success are a polite status in a native `<output>` (Sonar S6819), which
 * states the politeness and atomicity that `role="status"` implied.
 */
function SaveStatusMessage({ status, message }: SaveStatusMessageProps) {
  const className = `flex items-center gap-2 text-sm shrink-0 ${getStatusTextClass(status)}`;
  if (status === "error") {
    return (
      <div role="alert" className={className}>
        <AlertCircle className="w-4 h-4 shrink-0" />
        {message}
      </div>
    );
  }
  return (
    <output aria-live="polite" aria-atomic="true" className={className}>
      {status === "saving" && (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      )}
      {status === "done" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
      {message}
    </output>
  );
}

export function BulkEditModal({ deck, children }: BulkEditModalProps) {
  const t = useTranslations("deck");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");

  const activeDeckId = useDeckStore((s) => s.activeDeckId);
  const applyBulkEdit = useDeckStore((s) => s.applyBulkEdit);

  // Pre-fill textarea with current deck content whenever the modal opens.
  // Every row the save compares against is listed, so none can vanish unseen.
  useEffect(() => {
    if (open) {
      setText(exportToText(deck.commander, deck.partner, cardsFromZoneSource(deck), deck.companion));
    }
  }, [open, deck]);

  /** Explains why the edited list cannot be saved as written. */
  function rejectionMessage(rejection: BulkEditRejection): string {
    switch (rejection.status) {
      case "unknownCards":
        return t("bulkEdit.unknownCards", { names: rejection.names.join(", ") });
      case "invalidPartner":
        return t("bulkEdit.invalidPartner", { name: rejection.name });
      case "invalidCompanion":
        return t("bulkEdit.invalidCompanion", { name: rejection.name });
      default: {
        const exhaustive: never = rejection;
        return exhaustive;
      }
    }
  }

  /**
   * Saves only what the edited list changes, as one atomic request. New names
   * are looked up first; the deck is untouched when the list is refused.
   *
   * @returns why the list was refused, or null once it is saved
   */
  async function saveChanges(parsed: ImportResult): Promise<BulkEditRejection | null> {
    const plan = planBulkEdit(deck, parsed);
    if (isEmptyBulkEdit(plan)) return null;
    const names = namesToLookUp(plan);
    if (names.length > 0) setMessage(t("import.validating", { count: names.length }));
    const found = names.length > 0 ? await fetchInBatches(names.map((name) => ({ name }))) : [];
    const resolution = resolveBulkEdit(plan, buildScryfallNameIndex(found));
    if (resolution.status !== "ready") return resolution;
    setMessage(t("bulkEdit.saving"));
    await applyBulkEdit(resolution.edit);
    return null;
  }

  const handleSave = async () => {
    if (!text.trim()) return;
    if (!activeDeckId) {
      setStatus("error");
      setMessage(t("import.noDeckSelected"));
      return;
    }

    setStatus("saving");
    setMessage(t("bulkEdit.saving"));

    try {
      const parsed = parseTextDecklist(text);
      const lineCount =
        parsed.cards.length +
        [parsed.commander, parsed.partner, parsed.companion].filter(Boolean).length;
      if (lineCount === 0) {
        setStatus("error");
        setMessage(t("import.noCardsFound"));
        return;
      }

      const rejection = await saveChanges(parsed);
      if (rejection) {
        setStatus("error");
        setMessage(rejectionMessage(rejection));
        return;
      }

      setStatus("done");
      setMessage(t("bulkEdit.saved", { count: lineCount }));

      // Auto-close after a short delay
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : t("bulkEdit.saveFailed")
      );
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStatus("idle");
      setMessage("");
      // Do not reset text — it will be re-populated on next open
    }, 200);
  };

  // Count non-empty lines for the line counter
  const lineCount = text.split("\n").filter((l) => l.trim()).length;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => (v ? setOpen(true) : handleClose())}
    >
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[580px] max-w-[95vw] max-h-[90vh] bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-2xl p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--accent-text)]" />
              <Dialog.Title className="text-base font-semibold text-[var(--text-primary)]">
                {t("bulkEdit.title", { name: deck.name })}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t("bulkEdit.close")}
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-[var(--text-secondary)] shrink-0">
            {t.rich("bulkEdit.description", DESCRIPTION_RICH_TAGS)}
          </Dialog.Description>

          {/* Textarea. The placeholder stays English on purpose:
              parsePlainTextDecklist matches the English section headers, so a
              localised example would show input the parser rejects. */}
          <div className="flex flex-col gap-1 flex-1 min-h-0">
            <textarea
              className="w-full flex-1 min-h-[55vh] bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none focus:outline-none focus:border-[var(--accent)] font-mono leading-relaxed"
              placeholder={`Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n1 Sol Ring\n1 Arcane Signet\n4 Forest\n...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={status === "saving"}
              spellCheck={false}
            />
            {/* Line counter */}
            <p className="text-xs text-[var(--text-secondary)] text-right">
              {t("bulkEdit.lineCount", { count: lineCount })}
            </p>
          </div>

          {/* Status message */}
          {message && <SaveStatusMessage status={status} message={message} />}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={status === "saving"}
              className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded hover:border-[var(--text-secondary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("import.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={
                !text.trim() ||
                status === "saving" ||
                status === "done"
              }
              className="px-4 py-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {status === "saving" && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {status === "done" ? t("bulkEdit.savedButton") : t("bulkEdit.save")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
