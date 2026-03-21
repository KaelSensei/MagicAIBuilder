"use client";
// Expandable deck description editor — collapsed by default, supports basic markdown preview
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Edit3 } from "lucide-react";
import { useDeckStore } from "@/lib/deck/store";

interface DeckDescriptionEditorProps {
  readonly deckId: string;
  readonly description: string | null | undefined;
}

export function DeckDescriptionEditor({ deckId, description }: DeckDescriptionEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { updateDeckDescription } = useDeckStore();

  // Sync draft when external description changes
  useEffect(() => {
    if (!editing) setDraft(description ?? "");
  }, [description, editing]);

  const handleToggle = () => {
    if (!expanded) setExpanded(true);
    else if (!editing) setExpanded(false);
  };

  const startEditing = () => {
    setExpanded(true);
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    startEditing();
  };

  const handleSave = () => {
    setEditing(false);
    updateDeckDescription(deckId, draft.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setEditing(false);
      setDraft(description ?? "");
    }
    // Ctrl+Enter or Cmd+Enter saves
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSave();
    }
  };

  const hasContent = description?.trim();

  return (
    <div className="border-b border-[var(--border)]">
      {/* Header row */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-[var(--surface-hover)] transition-colors group text-left"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-[var(--text-secondary)] shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-[var(--text-secondary)] shrink-0" />
        )}
        <span className="text-xs text-[var(--text-secondary)] truncate flex-1">
          {hasContent ? (
            <span className="text-[var(--text-primary)] italic line-clamp-1">{description!.trim().split("\n")[0]}</span>
          ) : (
            <span className="opacity-50">Add deck description…</span>
          )}
        </span>
        <button
          onClick={handleEdit}
          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded"
          aria-label="Edit description"
        >
          <Edit3 className="w-3 h-3 text-[var(--text-secondary)]" />
        </button>
      </button>

      {/* Expanded area */}
      {expanded && (
        <div className="px-3 pb-3">
          {editing ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                placeholder="Describe your deck strategy, themes, or notes… (basic markdown supported)"
                rows={4}
                maxLength={2000}
                className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] rounded-md px-2.5 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 resize-y outline-none transition-colors"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]/50">
                  {draft.length}/2000 · Ctrl+Enter to save · Esc to cancel
                </span>
                <button
                  onClick={handleSave}
                  className="text-xs px-2 py-0.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap cursor-text min-h-[24px]"
              onClick={handleEdit}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") startEditing(); }}
              title="Click to edit"
            >
              {hasContent ? (
                <span className="text-[var(--text-primary)]">{description!.trim()}</span>
              ) : (
                <span className="italic opacity-50">No description — click to add one</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
