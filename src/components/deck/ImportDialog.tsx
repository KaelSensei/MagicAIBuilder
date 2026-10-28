"use client";
import { forEachSequential } from "@/lib/async/sequential";
// Import deck from plain text or URL — Radix Dialog
// Supports both trigger-based (children) and controlled (open/onOpenChange) usage
import { useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { parseTextDecklist } from "@/lib/deck/import";
import { fetchInBatches } from "@/lib/deck/batch-fetch";
import { useDeckStore } from "@/lib/deck/store";
import { ImportFromUrlTab } from "@/components/deck/ImportFromUrlTab";
import { getDuplicateImportedNames } from "@/lib/import/import-preview";
import type { ScryfallCard } from "@/lib/scryfall/types";
import {
  buildScryfallNameIndex,
  getUnmatchedImportedNames,
  normalizeImportedName,
} from "@/lib/scryfall/name-index";

type ImportTab = "text" | "url";

type ImportDialogProps =
  | { children: React.ReactNode; open?: never; onOpenChange?: never }
  | {
      children?: React.ReactNode;
      open: boolean;
      onOpenChange: (v: boolean) => void;
    };

type ImportStatus = "idle" | "validating" | "done" | "warning" | "error";

const DESCRIPTION_RICH_TAGS = {
  code: (chunks: ReactNode) => (
    <code className="text-xs bg-[var(--surface-hover)] px-1 rounded">
      {chunks}
    </code>
  ),
};

function getStatusTextClass(status: ImportStatus): string {
  if (status === "error") return "text-red-400";
  if (status === "warning") return "text-amber-400";
  if (status === "done") return "text-green-400";
  return "text-[var(--text-secondary)]";
}

function countPreviewZones(cards: ReturnType<typeof parseTextDecklist>["cards"]) {
  const counts = { main: 0, sideboard: 0, maybeboard: 0 };
  for (const card of cards) {
    counts[card.zone ?? "main"] += card.quantity;
  }
  return counts;
}

type ParsedImport = ReturnType<typeof parseTextDecklist>;
type ImportActions = Pick<ReturnType<typeof useDeckStore.getState>,
  "addCard" | "setCommander" | "setPartner" | "setCompanion">;

function importedCardNames(parsed: ParsedImport): { name: string }[] {
  return [
    ...(parsed.commander ? [{ name: parsed.commander }] : []),
    ...(parsed.partner ? [{ name: parsed.partner }] : []),
    ...(parsed.companion ? [{ name: parsed.companion }] : []),
    ...Array.from(new Set(parsed.cards.map((card) => card.name))).map((name) => ({ name })),
  ];
}

async function addParsedCards(
  parsed: ParsedImport,
  foundCards: ScryfallCard[],
  actions: ImportActions
): Promise<number> {
  const byName = buildScryfallNameIndex(foundCards);
  let added = 0;

  if (parsed.commander) {
    const commander = byName.get(normalizeImportedName(parsed.commander));
    if (commander) {
      await actions.setCommander(commander);
      added++;
    }
  }
  if (parsed.partner) {
    const partner = byName.get(normalizeImportedName(parsed.partner));
    if (partner) {
      await actions.setPartner(partner);
      added++;
    }
  }
  if (parsed.companion) {
    const companion = byName.get(normalizeImportedName(parsed.companion));
    if (companion) {
      await actions.setCompanion(companion);
      added++;
    }
  }
  await forEachSequential(parsed.cards, async ({ name, quantity, zone }) => {
    const card = byName.get(normalizeImportedName(name));
    if (!card) return;
    await actions.addCard(card, quantity, zone ?? "main");
    added++;
  });
  return added;
}

export function ImportDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ImportDialogProps) {
  const t = useTranslations("deck");
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ImportTab>("text");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [message, setMessage] = useState("");
  const [missingNames, setMissingNames] = useState<string[]>([]);
  const [preview, setPreview] = useState<ReturnType<typeof parseTextDecklist> | null>(null);
  const [previewCards, setPreviewCards] = useState<ScryfallCard[] | null>(null);
  const previewRequest = useRef(0);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;

  const addCard = useDeckStore((s) => s.addCard);
  const setCommander = useDeckStore((s) => s.setCommander);
  const setPartner = useDeckStore((s) => s.setPartner);
  const setCompanion = useDeckStore((s) => s.setCompanion);
  const activeDeckId = useDeckStore((s) => s.activeDeckId);
  const duplicateNames = preview && previewCards
    ? getDuplicateImportedNames([
        ...(preview.commander ? [{ name: preview.commander }] : []),
        ...(preview.partner ? [{ name: preview.partner }] : []),
        ...(preview.companion ? [{ name: preview.companion }] : []),
        ...preview.cards,
      ], buildScryfallNameIndex(previewCards))
    : [];

  const handleImport = async () => {
    if (!preview || !previewCards?.length) return;
    if (!activeDeckId) {
      setStatus("error");
      setMessage(t("import.noDeckSelected"));
      return;
    }

    setStatus("validating");
    setMessage(t("import.parsing"));
    try {
      const added = await addParsedCards(preview, previewCards, { addCard, setCommander, setPartner, setCompanion });
      setStatus(missingNames.length > 0 ? "warning" : "done");
      setMessage(t("import.importSuccess", { count: added }));
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("import.importFailed"));
    }
  };

  const handlePreview = async () => {
    const parsed = parseTextDecklist(text);
    if (!parsed.commander && !parsed.partner && !parsed.companion && parsed.cards.length === 0) {
      setStatus("error");
      setMessage(t("import.noCardsFound"));
      return;
    }
    const allCardNames = importedCardNames(parsed);
    setStatus("validating");
    setMessage(t("import.validating", { count: allCardNames.length }));
    setMissingNames([]);
    const requestId = ++previewRequest.current;
    try {
      const foundCards = await fetchInBatches(allCardNames);
      if (requestId !== previewRequest.current) return;
      setMissingNames(getUnmatchedImportedNames(
        allCardNames.map(({ name }) => name),
        buildScryfallNameIndex(foundCards)
      ));
      setPreviewCards(foundCards);
      setPreview(parsed);
      setStatus("idle");
      setMessage("");
    } catch (err) {
      if (requestId !== previewRequest.current) return;
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("import.importFailed"));
    }
  };

  const handleClose = () => {
    previewRequest.current++;
    setOpen(false);
    setTimeout(() => {
      setText("");
      setStatus("idle");
      setMessage("");
      setMissingNames([]);
      setPreview(null);
      setPreviewCards(null);
      setActiveTab("text");
    }, 200);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => (v ? setOpen(true) : handleClose())}
    >
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
              <button
                type="button"
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-lg bg-[var(--background)] border border-[var(--border)] w-fit">
            <button
              type="button"
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
              type="button"
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
                  type="button"
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
                {t.rich("import.description", DESCRIPTION_RICH_TAGS)}
              </Dialog.Description>

              {/* Textarea. The placeholder stays English on purpose:
                  parsePlainTextDecklist matches the English section headers,
                  so a localised example would show input the parser rejects. */}
              <textarea
                className="w-full h-48 bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none focus:outline-none focus:border-[var(--accent)] font-mono"
                placeholder={`Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n1 Sol Ring\n1 Arcane Signet\n...`}
                value={text}
                onChange={(e) => {
                  previewRequest.current++;
                  setText(e.target.value);
                  setPreview(null);
                  setPreviewCards(null);
                  setMissingNames([]);
                  setStatus("idle");
                  setMessage("");
                }}
                disabled={status === "validating"}
              />

              {preview && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--text-primary)]">
                  <p className="font-semibold">{t("import.url.previewReady")}</p>
                  {(preview.commander || preview.partner) && (
                    <p>{t("import.url.commanders", {
                      names: [preview.commander, preview.partner].filter(Boolean).join(", "),
                    })}</p>
                  )}
                  <p>{t("import.url.zones", countPreviewZones(preview.cards))}</p>
                  {duplicateNames.length > 0 && (
                    <p className="text-amber-300">{t("import.url.duplicates", { names: duplicateNames.join(", ") })}</p>
                  )}
                  <ul className="mt-2 max-h-32 overflow-y-auto text-[var(--text-secondary)]">
                    {preview.cards.map((card, index) => (
                      <li key={`${index}-${card.name}`} className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate" title={card.name}>{card.quantity} × {card.name}</span>
                        <span className="shrink-0 text-xs text-[var(--text-secondary)]">
                          {t(`import.previewZone.${card.zone ?? "main"}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
                  {(status === "error" || status === "warning") && (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  {message}
                </div>
              )}
              {missingNames.length > 0 && (
                <div role="alert" className="text-sm text-amber-400">
                  <p>{t("import.url.notFound", { count: missingNames.length })}</p>
                  <ul className="max-h-24 overflow-y-auto list-disc list-inside break-words">
                    {missingNames.map((name) => <li key={name}>{name}</li>)}
                  </ul>
                </div>
              )}

              {/* Actions — plain text only */}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded hover:border-[var(--text-secondary)] transition-colors"
                >
                  {status === "done" || status === "warning" ? t("import.close") : t("import.cancel")}
                </button>
                {status !== "done" && status !== "warning" && (
                  <button
                    type="button"
                    onClick={preview ? handleImport : () => void handlePreview()}
                    disabled={!text.trim() || status === "validating" || (preview !== null && previewCards?.length === 0)}
                    className="px-4 py-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {status === "validating" && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    {preview ? t("import.url.confirmImport") : t("import.previewDecklist")}
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
