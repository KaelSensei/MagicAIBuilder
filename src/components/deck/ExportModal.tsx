"use client";
// Export modal with multiple format support
import { useState } from "react";
import { X, Copy, Download, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Deck } from "@/lib/deck/types";
import {
  exportPlainText,
  exportMoxfield,
  exportArena,
  exportMTGO,
  exportTappedOut,
  exportArchidekt,
  copyToClipboard,
  downloadFile,
} from "@/lib/deck/export";

interface ExportModalProps {
  readonly deck: Deck;
  readonly onClose: () => void;
}

type ExportFormat = "moxfield" | "arena" | "mtgo" | "tappedout" | "archidekt" | "plaintext";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  moxfield: "Moxfield",
  arena: "MTG Arena",
  mtgo: "MTGO",
  tappedout: "TappedOut",
  archidekt: "Archidekt",
  plaintext: "Plain Text",
};

function getExportText(deck: Deck, format: ExportFormat): string {
  switch (format) {
    case "moxfield": return exportMoxfield(deck);
    case "arena": return exportArena(deck);
    case "mtgo": return exportMTGO(deck);
    case "tappedout": return exportTappedOut(deck);
    case "archidekt": return exportArchidekt(deck);
    case "plaintext": return exportPlainText(deck);
  }
}

export function ExportModal({ deck, onClose }: ExportModalProps) {
  const [copied, setCopied] = useState<ExportFormat | null>(null);

  const handleCopy = async (format: ExportFormat) => {
    const text = getExportText(deck, format);
    await copyToClipboard(text);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (format: ExportFormat) => {
    const text = getExportText(deck, format);
    const deckName = deck.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    if (format === "mtgo") {
      downloadFile(text, `${deckName}.dek`, "application/xml");
    } else {
      downloadFile(text, `${deckName}_${format}.txt`);
    }
  };

  const previewText = exportPlainText(deck);
  const totalCards = deck.cards.reduce((s, c) => s + c.quantity, 0)
    + (deck.commander ? 1 : 0)
    + (deck.partner ? 1 : 0);

  const copyFormats: ExportFormat[] = ["moxfield", "arena", "mtgo", "tappedout", "archidekt", "plaintext"];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-lg mx-4"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Export Options</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Preview */}
          <div className="px-5 pt-4">
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">
              Deck List — {totalCards} cards
            </p>
            <textarea
              readOnly
              value={previewText}
              className="w-full h-36 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-secondary)] font-mono resize-none focus:outline-none"
            />
          </div>

          {/* Export buttons */}
          <div className="px-5 py-4 space-y-2">
            {copyFormats.map((format) => (
              <div key={format} className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(format)}
                  className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] transition-all text-sm text-[var(--text-primary)]"
                >
                  {copied === format ? (
                    <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                  )}
                  {copied === format ? "Copied!" : `Copy for ${FORMAT_LABELS[format]}`}
                </button>
                {(format === "mtgo" || format === "plaintext") && (
                  <button
                    onClick={() => handleDownload(format)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors"
                    title={`Download ${FORMAT_LABELS[format]} file`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    {format === "mtgo" ? ".dek" : ".txt"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
