"use client";
// Expandable deck description editor — collapsed by default, supports basic markdown preview
import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Edit3, ListPlus } from "lucide-react";
import { useDeckStore } from "@/lib/deck/store";

interface DeckDescriptionEditorProps {
  readonly deckId: string;
  readonly description: string | null | undefined;
}

export function DeckDescriptionEditor({
  deckId,
  description,
}: DeckDescriptionEditorProps) {
  const t = useTranslations("deck");
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

  const insertPrimerTemplate = () => {
    setDraft(t("description.primerTemplateContent"));
    textareaRef.current?.focus();
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
      <div className="group flex items-center hover:bg-[var(--surface-hover)] transition-colors">
        <button
          type="button"
          onClick={handleToggle}
          className="flex min-w-0 flex-1 items-center gap-1.5 px-3 py-1.5 text-left"
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-[var(--text-secondary)] shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-[var(--text-secondary)] shrink-0" />
          )}
          <span className="text-xs text-[var(--text-secondary)] truncate flex-1">
            {hasContent ? (
              <span className="text-[var(--text-primary)] italic line-clamp-1">
                {description?.trim().split("\n")[0]}
              </span>
            ) : (
              <span className="opacity-50">{t("description.add")}</span>
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={handleEdit}
          className="mr-3 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-60 focus-visible:opacity-100 hover:!opacity-100"
          aria-label={t("description.edit")}
        >
          <Edit3 className="w-3 h-3 text-[var(--text-secondary)]" />
        </button>
      </div>

      {/* Expanded area */}
      {expanded && (
        <div className="px-3 pb-3">
          {editing ? (
            <div className="flex flex-col gap-1.5">
              {draft.trim() === "" && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={insertPrimerTemplate}
                  className="flex w-fit items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                >
                  <ListPlus className="h-3.5 w-3.5" />
                  {t("description.usePrimerTemplate")}
                </button>
              )}
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                placeholder={t("description.placeholder")}
                rows={4}
                maxLength={2000}
                className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] rounded-md px-2.5 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 resize-y outline-none transition-colors"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]/50">
                  {t("description.editorHelp", {
                    count: draft.length,
                    max: 2000,
                  })}
                </span>
                <button
                  type="button"
                  onClick={handleSave}
                  className="text-xs px-2 py-0.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors"
                >
                  {t("description.save")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap cursor-text min-h-[24px] text-left w-full bg-transparent border-none p-0"
              onClick={handleEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") startEditing();
              }}
              title={t("description.clickToEdit")}
            >
              {hasContent ? (
                <span className="text-[var(--text-primary)]">
                  {description!.trim()}
                </span>
              ) : (
                <span className="italic opacity-50">
                  {t("description.empty")}
                </span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
