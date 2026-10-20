"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PlaytestActionLogEntry } from "@/lib/playtest/engine";
import { exportActionLogJson, exportActionLogText, summarizeActionLog } from "@/lib/playtest/action-log-export";
import { downloadFile } from "@/lib/deck/export";

interface PlaytestActionLogProps {
  readonly entries: readonly PlaytestActionLogEntry[];
  readonly deckName: string;
  readonly onAdd: (description: string) => void;
  readonly onRecordMana?: (amount: number) => void;
  readonly onEdit: (entryId: number, description: string) => void;
  readonly onRemove: (entryId: number) => void;
}

export function PlaytestActionLog({ entries, deckName, onAdd, onRecordMana, onEdit, onRemove }: PlaytestActionLogProps) {
  const t = useTranslations("playtest.log");
  const phaseLabel = useTranslations("playtest.phases");
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus({ preventScroll: true });
  }, [editingId]);
  const [manaAmount, setManaAmount] = useState("1");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [selectedTurn, setSelectedTurn] = useState<number | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<PlaytestActionLogEntry["phase"] | null>(null);
  const turns = [...new Set(entries.map((entry) => entry.turn))].sort((first, second) => first - second);
  const activeTurn = selectedTurn !== null && turns.includes(selectedTurn) ? selectedTurn : null;
  const turnEntries = activeTurn === null ? entries : entries.filter((entry) => entry.turn === activeTurn);
  const phases = [...new Set(turnEntries.map((entry) => entry.phase))];
  const activePhase = selectedPhase !== null && phases.includes(selectedPhase) ? selectedPhase : null;
  const visibleEntries = activePhase === null ? turnEntries : turnEntries.filter((entry) => entry.phase === activePhase);
  const summaries = useMemo(() => summarizeActionLog(entries), [entries]);
  const visibleSummaries = summaries.filter((summary) =>
    (activeTurn === null || summary.turn === activeTurn) && summary.draws + summary.manaProduced + summary.cardsSeen > 0
  );
  const fileStem = deckName.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "deck";
  const textFormat = {
    title: t("title"),
    turn: (turn: number) => t("turn", { turn }),
    phase: (phase: PlaytestActionLogEntry["phase"]) => phaseLabel(phase),
    evidenceTitle: t("evidenceTitle"),
    evidence: (draws: number, mana: number, seen: number) => t("evidence", { draws, mana, seen }),
  };

  const copyLog = async () => {
    try {
      await navigator.clipboard.writeText(exportActionLogText(deckName, entries, textFormat));
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  const addEntry = () => {
    if (draft.trim() === "") return;
    onAdd(draft);
    setDraft("");
  };

  const saveEdit = (entryId: number) => {
    if (editingText.trim() === "") return;
    onEdit(entryId, editingText);
    setEditingId(null);
  };

  return (
    <section className="rounded-xl border border-white/10 bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">{t("title")}</h3>
        {entries.length > 0 && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => void copyLog()}
              className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-white/50 hover:bg-white/5 hover:text-white"
            >
              <Copy className="h-3 w-3" aria-hidden="true" /> {t("copy")}
            </button>
            <button
              type="button"
              onClick={() => downloadFile(exportActionLogText(deckName, entries, textFormat), `${fileStem}-playtest.txt`)}
              className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-white/50 hover:bg-white/5 hover:text-white"
            >
              <Download className="h-3 w-3" aria-hidden="true" /> {t("exportText")}
            </button>
            <button
              type="button"
              onClick={() => downloadFile(exportActionLogJson(deckName, entries), `${fileStem}-playtest.json`, "application/json")}
              className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-white/50 hover:bg-white/5 hover:text-white"
            >
              <Download className="h-3 w-3" aria-hidden="true" /> {t("exportJson")}
            </button>
          </div>
        )}
      </div>
      {copyStatus === "copied" && <p role="status" className="mb-2 text-xs text-emerald-300">{t("copied")}</p>}
      {copyStatus === "error" && <p role="alert" className="mb-2 text-xs text-amber-300">{t("copyFailed")}</p>}
      <div className="mb-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && addEntry()}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="min-w-0 flex-1 rounded-md border border-white/15 bg-black/20 px-3 py-1.5 text-xs text-white outline-none focus:border-purple-400/60"
        />
        <button
          type="button"
          onClick={addEntry}
          aria-label={t("add")}
          className="rounded-md bg-purple-500/15 p-2 text-purple-200 hover:bg-purple-500/25"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      {onRecordMana && (
        <div className="mb-3 flex items-center gap-2">
          <label htmlFor="playtest-mana-amount" className="text-xs text-white/60">{t("manaAmount")}</label>
          <input id="playtest-mana-amount" type="number" min="1" max="100" step="1" value={manaAmount} onChange={(event) => setManaAmount(event.target.value)} className="w-16 rounded-md border border-white/15 bg-black/20 px-2 py-1 text-xs text-white" />
          <button type="button" disabled={!Number.isInteger(Number(manaAmount)) || Number(manaAmount) < 1 || Number(manaAmount) > 100} onClick={() => onRecordMana(Number(manaAmount))} className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 disabled:opacity-40">{t("recordMana")}</button>
        </div>
      )}
      {visibleSummaries.length > 0 && (
        <div className="mb-3 space-y-1 rounded-md border border-white/10 bg-black/10 p-2" aria-label={t("evidenceTitle")}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">{t("evidenceTitle")}</p>
          {visibleSummaries.map((summary) => (
            <p key={summary.turn} className="text-xs text-white/70">
              <span className="font-semibold text-white/85">{t("turn", { turn: summary.turn })}</span> · {t("evidence", { draws: summary.draws, mana: summary.manaProduced, seen: summary.cardsSeen })}
            </p>
          ))}
          <p className="text-[10px] text-white/40">{t("evidenceLimit")}</p>
        </div>
      )}
      {turns.length > 1 && (
        <div role="group" aria-label={t("title")} className="mb-3 flex flex-wrap gap-1">
          <button type="button" aria-pressed={activeTurn === null} onClick={() => { setSelectedTurn(null); setSelectedPhase(null); }} className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 aria-pressed:border-purple-400/60 aria-pressed:text-white">
            {t("title")}
          </button>
          {turns.map((turn) => (
            <button key={turn} type="button" aria-pressed={activeTurn === turn} onClick={() => { setSelectedTurn(turn); setSelectedPhase(null); }} className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 aria-pressed:border-purple-400/60 aria-pressed:text-white">
              {t("turn", { turn })}
            </button>
          ))}
        </div>
      )}
      {phases.length > 1 && (
        <div role="group" aria-label={t("allPhases")} className="mb-3 flex flex-wrap gap-1">
          <button type="button" aria-pressed={activePhase === null} onClick={() => setSelectedPhase(null)} className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 aria-pressed:border-purple-400/60 aria-pressed:text-white">
            {t("allPhases")}
          </button>
          {phases.map((phase) => (
            <button key={phase} type="button" aria-pressed={activePhase === phase} onClick={() => setSelectedPhase(phase)} className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 aria-pressed:border-purple-400/60 aria-pressed:text-white">
              {phaseLabel(phase)}
            </button>
          ))}
        </div>
      )}
      {entries.length === 0 ? (
        <p className="text-xs text-white/35">{t("empty")}</p>
      ) : (
        <ol className="max-h-48 space-y-1 overflow-y-auto">
          {[...visibleEntries].reverse().map((entry) => (
            <li key={entry.id} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-white/5">
              <span className="shrink-0 text-[10px] text-white/35">{t("turn", { turn: entry.turn })} · {phaseLabel(entry.phase)}</span>
              {editingId === entry.id ? (
                <input
                  ref={editInputRef}
                  value={editingText}
                  onChange={(event) => setEditingText(event.target.value)}
                  onBlur={() => saveEdit(entry.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveEdit(entry.id);
                    if (event.key === "Escape") setEditingId(null);
                  }}
                  aria-label={t("editEntry")}
                  className="min-w-0 flex-1 rounded border border-purple-400/50 bg-black/30 px-2 py-1 text-white outline-none"
                />
              ) : (
                <span className="min-w-0 flex-1 text-white/70">{entry.description}</span>
              )}
              <button
                type="button"
                onClick={() => { setEditingId(entry.id); setEditingText(entry.description); }}
                aria-label={t("edit")}
                className="p-1 text-white/35 hover:text-white"
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(entry.id)}
                aria-label={t("remove")}
                className="p-1 text-white/35 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
