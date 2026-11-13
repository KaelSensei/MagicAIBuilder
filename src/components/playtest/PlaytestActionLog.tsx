"use client";
/**
 * The action log of a playtest game: what happened, turn by turn, with the
 * player's own notes, a turn and phase filter, the turn evidence and the
 * exports.
 *
 * Playtest context, UI. A container: `useActionLogFilter` owns the filter,
 * `ActionLogHeader` the exports, `ActionLogComposer` the drafts and
 * `ActionLogEntryRow` the text being edited. This file keeps one thing, which
 * row is being edited, so that at most one is, and composes the rest. The
 * engine owns the entries; adding, editing and removing go back to it through
 * the callbacks.
 *
 * @module playtest/PlaytestActionLog
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PlaytestActionLogEntry } from "@/lib/playtest/engine";
import { useActionLogFilter } from "@/hooks/useActionLogFilter";
import { ActionLogComposer } from "./ActionLogComposer";
import { ActionLogEntryRow } from "./ActionLogEntryRow";
import { ActionLogFilters } from "./ActionLogFilters";
import { ActionLogHeader } from "./ActionLogHeader";
import { ActionLogTurnEvidence } from "./ActionLogTurnEvidence";

/** The log to show and the engine commands the player's edits become. */
export interface PlaytestActionLogProps {
  readonly entries: readonly PlaytestActionLogEntry[];
  /** Names the exports and heads the text export. */
  readonly deckName: string;
  readonly onAdd: (description: string) => void;
  /** When absent the player cannot record a mana amount. */
  readonly onRecordMana?: (amount: number) => void;
  readonly onEdit: (entryId: number, description: string) => void;
  readonly onRemove: (entryId: number) => void;
}

/** The log section, newest action first; the filter narrows the rows and the evidence only. */
export function PlaytestActionLog({
  entries,
  deckName,
  onAdd,
  onRecordMana,
  onEdit,
  onRemove,
}: PlaytestActionLogProps) {
  const t = useTranslations("playtest.log");
  const [editingId, setEditingId] = useState<number | null>(null);
  const filter = useActionLogFilter(entries);

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <ActionLogHeader deckName={deckName} entries={entries} />
      <ActionLogComposer onAdd={onAdd} onRecordMana={onRecordMana} />
      <ActionLogTurnEvidence summaries={filter.visibleSummaries} />
      <ActionLogFilters
        turns={filter.turns}
        activeTurn={filter.activeTurn}
        phases={filter.phases}
        activePhase={filter.activePhase}
        onSelectTurn={filter.selectTurn}
        onSelectPhase={filter.selectPhase}
      />
      {entries.length === 0 ? (
        <p className="text-xs text-[var(--text-secondary)]">{t("empty")}</p>
      ) : (
        <ol className="max-h-48 space-y-1 overflow-y-auto">
          {[...filter.visibleEntries].reverse().map((entry) => (
            <ActionLogEntryRow
              key={entry.id}
              entry={entry}
              editing={editingId === entry.id}
              onStartEdit={() => setEditingId(entry.id)}
              onSave={(description) => {
                onEdit(entry.id, description);
                setEditingId(null);
              }}
              onCancelEdit={() => setEditingId(null)}
              onRemove={() => onRemove(entry.id)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
