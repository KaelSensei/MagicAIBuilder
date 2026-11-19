"use client";
/**
 * The deck's description: one collapsed line that expands into the saved text,
 * and opens the primer editor (Markdown source beside its rendered preview).
 *
 * Context: deck building (ui). It owns the draft and saves through the deck
 * store's `updateDeckDescription`, which sends `PATCH /api/decks/[id]` and
 * restores the previous text on a failed save. `DeckPrimerEditorDialog` draws
 * the editing surface, with the server's 2,000-character cap.
 *
 * @module deck/DeckDescriptionEditor
 */
import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Edit3 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useDeckStore } from "@/lib/deck/store";
import { DeckPrimerEditorDialog } from "./DeckPrimerEditorDialog";

interface DeckDescriptionEditorProps {
  readonly deckId: string;
  readonly description: string | null | undefined;
}

/**
 * Edits the description of one deck.
 *
 * Saves on a press outside the editor (its form of blur), on Save and on
 * Ctrl+Enter (Cmd+Enter on macOS); Escape drops the draft. The editor stays
 * open until the save settles.
 */
export function DeckDescriptionEditor({
  deckId,
  description,
}: DeckDescriptionEditorProps) {
  const t = useTranslations("deck");
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // The action only: subscribing to the whole store re-rendered the editor on
  // every store change, such as each save's isSyncing toggle.
  const { updateDeckDescription } = useDeckStore(
    useShallow((state) => ({
      updateDeckDescription: state.updateDeckDescription,
    }))
  );

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

  const handleSave = async () => {
    await updateDeckDescription(deckId, draft.trim());
    setEditing(false);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(description ?? "");
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
              <span className="text-[var(--text-primary)]">{hasContent}</span>
            ) : (
              <span className="italic opacity-50">
                {t("description.empty")}
              </span>
            )}
          </button>
        </div>
      )}

      <DeckPrimerEditorDialog
        open={editing}
        draft={draft}
        textareaRef={textareaRef}
        onDraftChange={setDraft}
        onSave={() => void handleSave()}
        onCancel={cancelEditing}
      />
    </div>
  );
}
