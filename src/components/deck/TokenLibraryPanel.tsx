"use client";

import { Check, Copy, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import {
  buildTokenLibrary,
  formatTokenLibrary,
} from "@/lib/deck/token-library";
import type { DeckCard } from "@/lib/deck/types";

interface TokenLibraryPanelProps {
  readonly cards: readonly DeckCard[];
}

function downloadTokenLibrary(content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "deck-tokens.txt";
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Display and export the physical game pieces required by a deck. */
export function TokenLibraryPanel({ cards }: TokenLibraryPanelProps) {
  const t = useTranslations("deck");
  const [copied, copy] = useCopyToClipboard();
  const entries = buildTokenLibrary(cards);
  if (entries.length === 0) return null;

  const exportText = formatTokenLibrary(entries);

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
          {t("stats.tokenLibrary")}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void copy(exportText)}
            className="rounded p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            aria-label={
              copied
                ? t("stats.tokenLibraryCopied")
                : t("stats.copyTokenLibrary")
            }
            title={
              copied
                ? t("stats.tokenLibraryCopied")
                : t("stats.copyTokenLibrary")
            }
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => downloadTokenLibrary(exportText)}
            className="rounded p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            aria-label={t("stats.downloadTokenLibrary")}
            title={t("stats.downloadTokenLibrary")}
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {entries.map((entry) => (
          <div
            key={`${entry.kind}:${entry.name}:${entry.power ?? ""}`}
            className="flex justify-between text-xs"
          >
            <span className="text-[var(--text-primary)]">
              {entry.name}
              {entry.power ? ` · ${entry.power}` : ""}
              <span className="text-[var(--text-secondary)]">
                {" "}
                · {t(`stats.${entry.kind}Kind`)}
              </span>
            </span>
            <span className="text-[var(--text-secondary)]">×{entry.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
