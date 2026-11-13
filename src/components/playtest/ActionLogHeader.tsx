"use client";
/**
 * The title line of the playtest action log and its export actions: copy to
 * the clipboard, save as text, save as JSON, with the copy's outcome below.
 *
 * Playtest context, UI. Owns the copy status only. The exports always cover
 * the whole log, whatever the filter shows, and are named after the deck
 * through `fileStem`. The text export is translated; the JSON export is the
 * version-3 document of `action-log-export.ts`.
 *
 * @module playtest/ActionLogHeader
 */
import { useState } from "react";
import { Copy, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PlaytestActionLogEntry } from "@/lib/playtest/engine";
import {
  exportActionLogJson,
  exportActionLogText,
  type ActionLogTextFormat,
} from "@/lib/playtest/action-log-export";
import { downloadTextFile } from "@/lib/download-text-file";
import { fileStem } from "@/lib/text/slug";

/** The log the actions export. */
export interface ActionLogHeaderProps {
  readonly deckName: string;
  /** The whole log; the actions are hidden while it is empty. */
  readonly entries: readonly PlaytestActionLogEntry[];
}

const ACTION_CLASS =
  "flex items-center gap-1 rounded px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]";

type CopyStatus = "idle" | "copied" | "error";

/**
 * The copy's outcome: a status line once copied, an alert that points to the
 * text file when the browser refused the clipboard, nothing before a copy.
 */
function CopyOutcome({ status }: { readonly status: CopyStatus }) {
  const t = useTranslations("playtest.log");
  if (status === "copied") {
    return (
      <output className="mb-2 block text-xs text-emerald-300">
        {t("copied")}
      </output>
    );
  }
  if (status === "error") {
    return (
      <p role="alert" className="mb-2 text-xs text-amber-300">
        {t("copyFailed")}
      </p>
    );
  }
  return null;
}

/** The header: the title, and the three export actions while the log has entries. */
export function ActionLogHeader({ deckName, entries }: ActionLogHeaderProps) {
  const t = useTranslations("playtest.log");
  const phaseLabel = useTranslations("playtest.phases");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const textFormat: ActionLogTextFormat = {
    title: t("title"),
    turn: (turn) => t("turn", { turn }),
    phase: (phase) => phaseLabel(phase),
    evidenceTitle: t("evidenceTitle"),
    evidence: (draws, mana, seen) => t("evidence", { draws, mana, seen }),
  };
  const stem = fileStem(deckName);

  const copyLog = async () => {
    try {
      await navigator.clipboard.writeText(
        exportActionLogText(deckName, entries, textFormat)
      );
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {t("title")}
        </h3>
        {entries.length > 0 && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => void copyLog()}
              className={ACTION_CLASS}
            >
              <Copy className="h-3 w-3" aria-hidden="true" /> {t("copy")}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadTextFile(
                  exportActionLogText(deckName, entries, textFormat),
                  `${stem}-playtest.txt`
                )
              }
              className={ACTION_CLASS}
            >
              <Download className="h-3 w-3" aria-hidden="true" />{" "}
              {t("exportText")}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadTextFile(
                  exportActionLogJson(deckName, entries),
                  `${stem}-playtest.json`,
                  "application/json"
                )
              }
              className={ACTION_CLASS}
            >
              <Download className="h-3 w-3" aria-hidden="true" />{" "}
              {t("exportJson")}
            </button>
          </div>
        )}
      </div>
      <CopyOutcome status={copyStatus} />
    </>
  );
}
