"use client";
// Bulk Edit modal — edit the entire deck as plain text, Moxfield-style
import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { exportToText, parseTextDecklist } from "@/lib/deck/import";
import { getCardCollection } from "@/lib/scryfall/client";
import { useDeckStore } from "@/lib/deck/store";
import * as deckApi from "@/lib/db/deck-api";
import type { Deck } from "@/lib/deck/types";
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

interface BulkEditModalProps {
  readonly deck: Deck;
  readonly children: React.ReactNode;
}

type SaveStatus = "idle" | "saving" | "reloading" | "done" | "error";

function getStatusTextClass(status: SaveStatus): string {
  if (status === "error") return "text-red-400";
  if (status === "done") return "text-green-400";
  return "text-[var(--text-secondary)]";
}

export function BulkEditModal({ deck, children }: BulkEditModalProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");

  const activeDeckId = useDeckStore((s) => s.activeDeckId);
  const addCard = useDeckStore((s) => s.addCard);
  const setCommander = useDeckStore((s) => s.setCommander);
  const setPartner = useDeckStore((s) => s.setPartner);
  const loadDecks = useDeckStore((s) => s.loadDecks);

  // Pre-fill textarea with current deck content whenever the modal opens
  useEffect(() => {
    if (open) {
      setText(exportToText(deck.commander, deck.partner, deck.cards));
    }
  }, [open, deck]);

  /** Add all found cards to the active deck; returns count of added cards */
  async function addParsedCards(
    parsed: ReturnType<typeof parseTextDecklist>,
    foundCards: ScryfallCard[],
  ): Promise<number> {
    const byName = new Map(foundCards.map((c) => [c.name.toLowerCase(), c]));
    let added = 0;

    // Set commander first and await — it updates pairingType which partner needs
    if (parsed.commander) {
      const cmd = byName.get(parsed.commander.toLowerCase());
      if (cmd) { await setCommander(cmd); added++; }
    }

    // Set partner after commander is persisted
    if (parsed.partner) {
      const prt = byName.get(parsed.partner.toLowerCase());
      if (prt) { await setPartner(prt); added++; }
    }

    for (const { name, quantity } of parsed.cards) {
      const card = byName.get(name.toLowerCase());
      if (!card) continue;
      // Pass quantity directly — addCard handles basics with quantity > 1 in a single call
      await addCard(card, quantity);
      added++;
    }
    return added;
  }

  const handleSave = async () => {
    if (!text.trim()) return;
    if (!activeDeckId) {
      setStatus("error");
      setMessage("No deck selected. Please open a deck first.");
      return;
    }

    setStatus("saving");
    setMessage("Saving...");

    try {
      const parsed = parseTextDecklist(text);

      // Deduplicate card names before sending to Scryfall batch
      const allCardNames = [
        ...(parsed.commander ? [{ name: parsed.commander }] : []),
        ...(parsed.partner ? [{ name: parsed.partner }] : []),
        ...Array.from(new Set(parsed.cards.map((c) => c.name))).map((name) => ({ name })),
      ];

      if (allCardNames.length === 0) {
        setStatus("error");
        setMessage("No cards found in the decklist.");
        return;
      }

      setMessage(`Validating ${allCardNames.length} cards with Scryfall...`);
      const foundCards = await fetchInBatches(allCardNames);

      // Step 1: Remove all existing cards from DB
      setMessage("Clearing existing deck...");
      await deckApi.removeAllCards(activeDeckId);

      // Step 2: Reset commander / partner / companion
      await deckApi.updateDeck(activeDeckId, {
        commanderId: null,
        partnerId: null,
        companionId: null,
      });

      // Step 3: Re-add commander and all cards
      setMessage("Rebuilding deck...");
      const added = await addParsedCards(parsed, foundCards);

      // Step 4: Reload deck state from DB
      setStatus("reloading");
      setMessage(`Saved! Reloading deck...`);
      await loadDecks();

      setStatus("done");
      setMessage(`Saved ${added} cards successfully.`);

      // Auto-close after a short delay
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to save changes.");
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
    <Dialog.Root open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[580px] max-w-[95vw] max-h-[90vh] bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-2xl p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--accent)]" />
              <Dialog.Title className="text-base font-semibold text-[var(--text-primary)]">
                Bulk Edit — {deck.name}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-[var(--text-secondary)] shrink-0">
            Edit your decklist directly. One card per line:{" "}
            <code className="text-xs bg-[var(--surface-hover)] px-1 rounded">1 Card Name</code>.
            Add a{" "}
            <code className="text-xs bg-[var(--surface-hover)] px-1 rounded">Commander</code>{" "}
            section header to set your commander.
          </Dialog.Description>

          {/* Textarea */}
          <div className="flex flex-col gap-1 flex-1 min-h-0">
            <textarea
              className="w-full flex-1 min-h-[55vh] bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none focus:outline-none focus:border-[var(--accent)] font-mono leading-relaxed"
              placeholder={`Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n1 Sol Ring\n1 Arcane Signet\n4 Forest\n...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={status === "saving" || status === "reloading"}
              spellCheck={false}
            />
            {/* Line counter */}
            <p className="text-xs text-[var(--text-secondary)] text-right">
              {lineCount} {lineCount === 1 ? "line" : "lines"}
            </p>
          </div>

          {/* Status message */}
          {message && (
            <div className={`flex items-center gap-2 text-sm shrink-0 ${getStatusTextClass(status)}`}>
              {(status === "saving" || status === "reloading") && (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              )}
              {status === "done" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {status === "error" && <AlertCircle className="w-4 h-4 shrink-0" />}
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              onClick={handleClose}
              disabled={status === "saving" || status === "reloading"}
              className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded hover:border-[var(--text-secondary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!text.trim() || status === "saving" || status === "reloading" || status === "done"}
              className="px-4 py-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(status === "saving" || status === "reloading") && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {status === "done" ? "Saved!" : "Save"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
