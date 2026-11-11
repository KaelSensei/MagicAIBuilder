"use client";
// Export modal with multiple format support
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Download, Check, Printer } from "lucide-react";
import { ProxyExportModal } from "./ProxyExportModal";
import type { Deck } from "@/lib/deck/types";
import {
  exportPlainText,
  exportMoxfield,
  exportArena,
  exportMTGO,
  exportTappedOut,
  exportArchidekt,
  exportGoldfish,
  exportEdhrec,
  copyToClipboard,
} from "@/lib/deck/export";
import { downloadTextFile } from "@/lib/download-text-file";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { textAreaShellClassName } from "@/components/ui/Input";
import { cn } from "@/components/ui/utils";

interface ExportModalProps {
  readonly deck: Deck;
  readonly onClose: () => void;
}

type ExportFormat =
  | "moxfield"
  | "arena"
  | "mtgo"
  | "tappedout"
  | "archidekt"
  | "goldfish"
  | "edhrec"
  | "plaintext";

// Brand names, deliberately not translated. Plain text is not a brand: its
// label comes from the catalog, shared with the import dialog's tab.
const BRAND_LABELS: Record<Exclude<ExportFormat, "plaintext">, string> = {
  moxfield: "Moxfield",
  arena: "MTG Arena",
  mtgo: "MTGO",
  tappedout: "TappedOut",
  archidekt: "Archidekt",
  goldfish: "MTGGoldfish",
  edhrec: "EDHRec",
};

function getExportText(deck: Deck, format: ExportFormat): string {
  switch (format) {
    case "moxfield":
      return exportMoxfield(deck);
    case "arena":
      return exportArena(deck);
    case "mtgo":
      return exportMTGO(deck);
    case "tappedout":
      return exportTappedOut(deck);
    case "archidekt":
      return exportArchidekt(deck);
    case "goldfish":
      return exportGoldfish(deck);
    case "edhrec":
      return exportEdhrec(deck);
    case "plaintext":
      return exportPlainText(deck);
  }
}

export function ExportModal({ deck, onClose }: ExportModalProps) {
  const t = useTranslations("deck");
  const [copied, setCopied] = useState<ExportFormat | null>(null);
  const [showProxy, setShowProxy] = useState(false);
  const formatLabel = (format: ExportFormat): string =>
    format === "plaintext" ? t("import.tabText") : BRAND_LABELS[format];

  const handleCopy = async (format: ExportFormat) => {
    const text = getExportText(deck, format);
    await copyToClipboard(text);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (format: ExportFormat) => {
    const text = getExportText(deck, format);
    const deckName = deck.name.replaceAll(/[^a-z0-9]/gi, "_").toLowerCase();
    if (format === "mtgo") {
      downloadTextFile(text, `${deckName}.dek`, "application/xml");
    } else {
      downloadTextFile(text, `${deckName}_${format}.txt`);
    }
  };

  const totalDeckCards =
    deck.cards
      .filter((c) => c.zone === "main")
      .reduce((s, c) => s + c.quantity, 0) +
    (deck.commander ? 1 : 0) +
    (deck.partner ? 1 : 0);

  const previewText = exportPlainText(deck);
  const totalCards =
    deck.cards.reduce((s, c) => s + c.quantity, 0) +
    (deck.commander ? 1 : 0) +
    (deck.partner ? 1 : 0);

  const copyFormats: ExportFormat[] = [
    "moxfield",
    "arena",
    "mtgo",
    "tappedout",
    "archidekt",
    "goldfish",
    "edhrec",
    "plaintext",
  ];

  return (
    <>
      {showProxy && (
        <ProxyExportModal deck={deck} onClose={() => setShowProxy(false)} />
      )}
      <Modal open onClose={onClose} title={t("export.title")}>
        {/* Preview */}
        <div className="px-5 pt-4">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            {t("export.deckList", { count: totalCards })}
          </p>
          <textarea
            readOnly
            value={previewText}
            className={cn(textAreaShellClassName, "h-36 resize-none font-mono text-xs text-[var(--text-secondary)]")}
          />
        </div>

        {/* Export buttons */}
        <div className="px-5 py-4 space-y-2">
          {copyFormats.map((format) => (
            <div key={format} className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleCopy(format)}
                className="flex-1 justify-start"
              >
                {copied === format ? (
                  <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                )}
                {copied === format
                  ? t("export.copied")
                  : t("export.copyFor", { format: formatLabel(format) })}
              </Button>
              {/* Every format downloads — MTGO as .dek XML, the rest as .txt */}
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleDownload(format)}
                title={t("export.downloadFormat", {
                  format: formatLabel(format),
                })}
              >
                <Download className="w-3.5 h-3.5" />
                {format === "mtgo" ? ".dek" : ".txt"}
              </Button>
            </div>
          ))}
          {/* Proxy export */}
          <div className="pt-2 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowProxy(true)}
              disabled={totalDeckCards === 0}
              className="w-full justify-start"
              title={
                totalDeckCards === 0
                  ? t("export.addCardsForProxy")
                  : t("export.proxyTooltip")
              }
            >
              <Printer className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
              {t("export.proxySheets")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
