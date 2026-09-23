"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PlaytestActionLogEntry } from "@/lib/playtest/engine";

interface PlaytestActionLogProps {
  readonly entries: readonly PlaytestActionLogEntry[];
  readonly onAdd: (description: string) => void;
  readonly onEdit: (entryId: number, description: string) => void;
  readonly onRemove: (entryId: number) => void;
}

export function PlaytestActionLog({ entries, onAdd, onEdit, onRemove }: PlaytestActionLogProps) {
  const t = useTranslations("playtest.log");
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

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
      <h3 className="mb-3 text-sm font-semibold text-white">{t("title")}</h3>
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
      {entries.length === 0 ? (
        <p className="text-xs text-white/35">{t("empty")}</p>
      ) : (
        <ol className="max-h-48 space-y-1 overflow-y-auto">
          {[...entries].reverse().map((entry) => (
            <li key={entry.id} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-white/5">
              <span className="shrink-0 text-[10px] text-white/35">T{entry.turn} · {entry.phase}</span>
              {editingId === entry.id ? (
                <input
                  value={editingText}
                  onChange={(event) => setEditingText(event.target.value)}
                  onBlur={() => saveEdit(entry.id)}
                  onKeyDown={(event) => event.key === "Enter" && saveEdit(entry.id)}
                  aria-label={t("editEntry")}
                  autoFocus
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
