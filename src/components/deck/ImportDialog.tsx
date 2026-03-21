"use client";
// Import deck from plain text — Radix Dialog
// Supports both trigger-based (children) and controlled (open/onOpenChange) usage
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { parseTextDecklist } from "@/lib/deck/import";
import { getCardCollection } from "@/lib/scryfall/client";
import { useDeckStore } from "@/lib/deck/store";
import type { ScryfallCard } from "@/lib/scryfall/types";

type ImportDialogProps =
  | { children: React.ReactNode; open?: never; onOpenChange?: never }
  | { children?: never; open: boolean; onOpenChange: (v: boolean) => void };

type ImportStatus = "idle" | "validating" | "done" | "error";

export function ImportDialog({ children, open: controlledOpen, onOpenChange: controlledOnOpenChange }: ImportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [message, setMessage] = useState("");

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;

  const addCard = useDeckStore((s) => s.addCard);
  const setCommander = useDeckStore((s) => s.setCommander);
  const activeDeckId = useDeckStore((s) => s.activeDeckId);

  const handleImport = async () => {
    if (!text.trim()) return;
    if (!activeDeckId) {
      setStatus("error");
      setMessage("No deck selected. Create or open a deck first.");
      return;
    }

    setStatus("validating");
    setMessage("Parsing decklist...");

    try {
      const parsed = parseTextDecklist(text);
      const allCardNames = [
        ...(parsed.commander ? [{ name: parsed.commander }] : []),
        ...parsed.cards.map((c) => ({ name: c.name })),
      ];

      if (allCardNames.length === 0) {
        setStatus("error");
        setMessage("No cards found in the decklist.");
        return;
      }

      setMessage(`Validating ${allCardNames.length} cards with Scryfall...`);

      // Batch lookup — Scryfall allows up to 75 per request
      const BATCH_SIZE = 75;
      const batches: typeof allCardNames[] = [];
      for (let i = 0; i < allCardNames.length; i += BATCH_SIZE) {
        batches.push(allCardNames.slice(i, i + BATCH_SIZE));
      }

      const foundCards: ScryfallCard[] = [];
      for (const batch of batches) {
        const result = await getCardCollection(batch);
        foundCards.push(...result.data);
      }

      // Add commander first
      let added = 0;
      if (parsed.commander) {
        const commanderCard = foundCards.find(
          (c) => c.name.toLowerCase() === parsed.commander!.toLowerCase()
        );
        if (commanderCard) {
          setCommander(commanderCard);
          added++;
        }
      }

      // Add regular cards
      for (const { name, quantity } of parsed.cards) {
        const card = foundCards.find(
          (c) => c.name.toLowerCase() === name.toLowerCase()
        );
        if (card) {
          for (let q = 0; q < quantity; q++) {
            addCard(card);
          }
          added++;
        }
      }

      setStatus("done");
      setMessage(`Successfully imported ${added} cards.`);
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Failed to import cards."
      );
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setText("");
      setStatus("idle");
      setMessage("");
    }, 200);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) handleClose();
    else setOpen(true);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      {children && <Dialog.Trigger asChild>{children}</Dialog.Trigger>}

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] max-w-[90vw] bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-2xl p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-[var(--text-primary)]">
              Import Decklist
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-[var(--text-secondary)]">
            Paste a decklist in plain text format. Use{" "}
            <code className="text-xs bg-[var(--surface-hover)] px-1 rounded">
              1 Card Name
            </code>{" "}
            per line. Add a{" "}
            <code className="text-xs bg-[var(--surface-hover)] px-1 rounded">
              Commander
            </code>{" "}
            section header to set your commander.
          </Dialog.Description>

          {/* Textarea */}
          <textarea
            className="w-full h-48 bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none focus:outline-none focus:border-[var(--accent)] font-mono"
            placeholder={`Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n1 Sol Ring\n1 Arcane Signet\n...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={status === "validating"}
          />

          {/* Status message */}
          {message && (
            <div
              className={`flex items-center gap-2 text-sm ${
                status === "error"
                  ? "text-red-400"
                  : status === "done"
                  ? "text-green-400"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              {status === "validating" && (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              )}
              {status === "done" && (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              {status === "error" && (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded hover:border-[var(--text-secondary)] transition-colors"
            >
              {status === "done" ? "Close" : "Cancel"}
            </button>
            {status !== "done" && (
              <button
                onClick={handleImport}
                disabled={!text.trim() || status === "validating"}
                className="px-4 py-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {status === "validating" && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Import
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
