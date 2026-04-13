"use client";
// Import deck from plain text or URL — Radix Dialog
// Supports both trigger-based (children) and controlled (open/onOpenChange) usage
import { useState } from "react";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { parseTextDecklist } from "@/lib/deck/import";
import { fetchInBatches } from "@/lib/deck/batch-fetch";
import { useDeckStore } from "@/lib/deck/store";
import { ImportFromUrlTab } from "@/components/deck/ImportFromUrlTab";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { buildScryfallNameIndex, normalizeImportedName } from "@/lib/scryfall/name-index";

type ImportTab = "text" | "url";

type ImportDialogProps =
  | { children: React.ReactNode; open?: never; onOpenChange?: never }
  | { children?: React.ReactNode; open: boolean; onOpenChange: (v: boolean) => void };

type ImportStatus = "idle" | "validating" | "done" | "error";

function getStatusTextClass(status: ImportStatus): string {
  if (status === "error") return "text-red-400";
  if (status === "done") return "text-green-400";
  return "text-[var(--text-secondary)]";
}

export function ImportDialog({ children, open: controlledOpen, onOpenChange: controlledOnOpenChange }: ImportDialogProps) {
  const t = useTranslations("deck");
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ImportTab>("text");
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
  const setPartner = useDeckStore((s) => s.setPartner);
  const activeDeckId = useDeckStore((s) => s.activeDeckId);

  /** Add all found cards to the active deck; returns count of added cards */
  async function addParsedCards(
    parsed: ReturnType<typeof parseTextDecklist>,
    foundCards: ScryfallCard[],
  ): Promise<number> {
    const byName = buildScryfallNameIndex(foundCards);
    let added = 0;

    // Set commander first and await — it updates pairingType which partner needs
    if (parsed.commander) {
      const cmd = byName.get(normalizeImportedName(parsed.commander));
      if (cmd) { await setCommander(cmd); added++; }
    }

    // Set partner after commander is persisted
    if (parsed.partner) {
      const prt = byName.get(normalizeImportedName(parsed.partner));
      if (prt) { await setPartner(prt); added++; }
    }

    for (const { name, quantity } of parsed.cards) {
      const card = byName.get(normalizeImportedName(name));
      if (!card) continue;
      // Pass quantity directly — addCard handles basics with quantity > 1 in a single call
      addCard(card, quantity);
      added++;
    }
    return added;
  }

  const handleImport = async () => {
    if (!text.trim()) return;
    if (!activeDeckId) {
      setStatus("error");
      setMessage(t("import.noDeckSelected"));
      return;
    }

    setStatus("validating");
    setMessage(t("import.parsing"));

    try {
      const parsed = parseTextDecklist(text);
      // Deduplicate card names before sending to Scryfall batch (user may list same card twice)
      const allCardNames = [
        ...(parsed.commander ? [{ name: parsed.commander }] : []),
        ...(parsed.partner ? [{ name: parsed.partner }] : []),
        ...Array.from(new Set(parsed.cards.map((c) => c.name))).map((name) => ({ name })),
      ];

      if (allCardNames.length === 0) {
        setStatus("error");
        setMessage(t("import.noCardsFound"));
        return;
      }

      setMessage(t("import.validating", { count: allCardNames.length }));
      const foundCards = await fetchInBatches(allCardNames);
      const added = await addParsedCards(parsed, foundCards);

      setStatus("done");
      setMessage(t("import.importSuccess", { count: added }));
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("import.importFailed"));
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setText("");
      setStatus("idle");
      setMessage("");
      setActiveTab("text");
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
              {t("import.title")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-lg bg-[var(--background)] border border-[var(--border)] w-fit">
            <button
              onClick={() => setActiveTab("text")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === "text"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t("import.tabText")}
            </button>
            <button
              onClick={() => setActiveTab("url")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === "url"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t("import.tabUrl")}
            </button>
          </div>

          {/* URL tab */}
          {activeTab === "url" && (
            <>
              <ImportFromUrlTab onSuccess={() => setOpen(false)} />
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded hover:border-[var(--text-secondary)] transition-colors"
                >
                  {t("import.close")}
                </button>
              </div>
            </>
          )}

          {/* Plain text tab */}
          {activeTab === "text" && (
          <>
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

          {/* Actions — plain text only */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded hover:border-[var(--text-secondary)] transition-colors"
            >
              {status === "done" ? t("import.close") : t("import.cancel")}
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
                {t("import.import")}
              </button>
            )}
          </div>
          </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
