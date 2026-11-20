"use client";
// Export modal with multiple format support
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Download, Check, Printer } from "lucide-react";
import { ProxyExportModal } from "./ProxyExportModal";
import { ExportNotices } from "./ExportNotices";
import type { Deck } from "@/lib/deck/types";
import {
  EXPORT_TARGETS,
  exportDeck,
  exportPlainText,
  copyToClipboard,
  type ExportResult,
  type ExportTarget,
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

// Brand names, deliberately not translated. Plain text is not a brand: its
// label comes from the catalog, shared with the import dialog's tab.
const BRAND_LABELS: Record<Exclude<ExportTarget, "plaintext">, string> = {
  moxfield: "Moxfield",
  arena: "MTG Arena",
  mtgo: "MTGO",
  tappedout: "TappedOut",
  archidekt: "Archidekt",
  goldfish: "MTGGoldfish",
  edhrec: "EDHRec",
};

export function ExportModal({ deck, onClose }: ExportModalProps) {
  const t = useTranslations("deck");
  const [copied, setCopied] = useState<ExportTarget | null>(null);
  const [showProxy, setShowProxy] = useState(false);
  const formatLabel = (format: ExportTarget): string =>
    format === "plaintext" ? t("import.tabText") : BRAND_LABELS[format];
  // Every target's result, built once per deck: the rows show its notices
  // before the player copies or downloads (I-50 requirement 1.2).
  const exports = useMemo(
    () =>
      EXPORT_TARGETS.map((format) => ({
        format,
        result: exportDeck(deck, format),
      })),
    [deck]
  );

  const handleCopy = async (format: ExportTarget, result: ExportResult) => {
    await copyToClipboard(result.content);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (result: ExportResult) => {
    downloadTextFile(result.content, result.fileName, result.mimeType);
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
            className={cn(
              textAreaShellClassName,
              "h-36 resize-none font-mono text-xs text-[var(--text-secondary)]"
            )}
          />
        </div>

        {/* Export buttons */}
        <div className="px-5 py-4 space-y-2">
          {exports.map(({ format, result }) => (
            <div key={format}>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy(format, result)}
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
                  onClick={() => handleDownload(result)}
                  title={t("export.downloadFormat", {
                    format: formatLabel(format),
                  })}
                >
                  <Download className="w-3.5 h-3.5" />
                  {format === "mtgo" ? ".dek" : ".txt"}
                </Button>
              </div>
              <ExportNotices
                format={formatLabel(format)}
                notices={result.notices}
              />
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
