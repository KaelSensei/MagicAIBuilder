"use client";
/**
 * One action of the playtest log: its turn and phase, its description or the
 * field that edits it, and the edit and remove buttons.
 *
 * Playtest context, UI. Presentational: `PlaytestActionLog` decides which row
 * is being edited (at most one at a time) and applies the save; this file owns
 * the text being typed. Enter and blur save a non-blank description, Escape
 * cancels without saving (#1340), and the field takes focus without scrolling
 * the board.
 *
 * @module playtest/ActionLogEntryRow
 */
import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PlaytestActionLogEntry } from "@/lib/playtest/engine";

/** The action shown and what its buttons and its edit field do. */
export interface ActionLogEntryRowProps {
  readonly entry: PlaytestActionLogEntry;
  /** True while this row shows the edit field instead of the description. */
  readonly editing: boolean;
  readonly onStartEdit: () => void;
  /** Called with the new description, never blank. */
  readonly onSave: (description: string) => void;
  /** Called on Escape; the description stays as it was. */
  readonly onCancelEdit: () => void;
  readonly onRemove: () => void;
}

/** The row, with its buttons named "Edit" and "Remove action" for assistive technology. */
export function ActionLogEntryRow({
  entry,
  editing,
  onStartEdit,
  onSave,
  onCancelEdit,
  onRemove,
}: ActionLogEntryRowProps) {
  const t = useTranslations("playtest.log");
  const phaseLabel = useTranslations("playtest.phases");

  return (
    <li className="flex items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-[var(--surface-hover)]">
      <span className="shrink-0 text-[10px] text-[var(--text-secondary)]">
        {t("turn", { turn: entry.turn })} · {phaseLabel(entry.phase)}
      </span>
      {editing ? (
        <EntryEditor
          initialDescription={entry.description}
          onSave={onSave}
          onCancel={onCancelEdit}
        />
      ) : (
        <span className="min-w-0 flex-1 text-[var(--text-secondary)]">
          {entry.description}
        </span>
      )}
      <button
        type="button"
        onClick={onStartEdit}
        aria-label={t("edit")}
        className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <Pencil className="h-3 w-3" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("remove")}
        className="p-1 text-[var(--text-secondary)] hover:text-red-300"
      >
        <Trash2 className="h-3 w-3" aria-hidden="true" />
      </button>
    </li>
  );
}

interface EntryEditorProps {
  readonly initialDescription: string;
  readonly onSave: (description: string) => void;
  readonly onCancel: () => void;
}

/**
 * The edit field. It mounts when the edit starts, so its text starts from the
 * description of that moment and it takes focus once, with `preventScroll`:
 * the log sits below the board and a scroll would hide the hand (#1340).
 */
function EntryEditor({
  initialDescription,
  onSave,
  onCancel,
}: EntryEditorProps) {
  const t = useTranslations("playtest.log");
  const [description, setDescription] = useState(initialDescription);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const save = () => {
    if (description.trim() === "") return;
    onSave(description);
  };

  return (
    <input
      ref={inputRef}
      value={description}
      onChange={(event) => setDescription(event.target.value)}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === "Enter") save();
        if (event.key === "Escape") onCancel();
      }}
      aria-label={t("editEntry")}
      className="min-w-0 flex-1 rounded border border-purple-400/50 bg-[var(--background)] px-2 py-1 text-[var(--text-primary)] outline-none"
    />
  );
}
