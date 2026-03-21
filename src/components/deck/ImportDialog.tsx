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

/** Fetch Scryfall cards in batches of 75 */
async function fetchInBatches(names: Array<{ name: string }>): Promise<ScryfallCard[]> {
  const BATCH_SIZE = 75;
  const found: ScryfallCard[] = [];
  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const result = await getCardCollection(names.slice(i, i + BATCH_SIZE));
    found.push(...result.data);
  }
  return found;
}

type ImportDialogProps =
  | { children: React.ReactNode; open?: never; onOpenChange?: never }
  | { children?: never; open: boolean; onOpenChange: (v: boolean) => void };

type ImportStatus = "idle" | "validating" | "done" | "error";

function getStatusTextClass(status: ImportStatus): string {
  if (status === "error") return "text-red-400";
  if (status === "done") return "text-green-400";
  return "text-[var(--text-secondary)]";
}

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

  /** Add all found cards to the active deck; returns count of added cards */
  function addParsedCards(
    parsed: ReturnType<typeof parseTextDecklist>,
    foundCards: ScryfallCard[],
  ): number {
    const byName = new Map(foundCards.map((c) => [c.name.toLowerCase(), c]));
    let added = 0;

    if (parsed.commander) {
      const cmd = byName.get(parsed.commander.toLowerCase());
      if (cmd) { setCommander(cmd); added++; }
    }

    for (const { name, quantity } of parsed.cards) {
      const card = byName.get(name.toLowerCase());
      if (!card) continue;
      for (let q = 0; q < quantity; q++) { addCard(card); }
      added++;
    }
    return added;
  }

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
      const foundCards = await fetchInBatches(allCardNames);
      const added = addParsedCards(parsed, foundCards);

      setStatus("done");
      setMessage(`Successfully imported ${added} cards.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to import cards.");
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

  return (
    <Dialog.Root open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
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
              className={`flex items-center gap-2 text-sm ${getStatusTextClass(status)}`}
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
