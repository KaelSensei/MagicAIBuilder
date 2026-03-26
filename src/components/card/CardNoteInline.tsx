"use client";
// Inline card note editor — small textarea that opens on 📝 icon click
import { useState, useRef, useEffect } from "react";
import { FileText } from "lucide-react";
import { useDeckStore } from "@/lib/deck/store";

interface CardNoteInlineProps {
  readonly cardId: string;
  readonly notes?: string | null;
}

export function CardNoteInline({ cardId, notes }: CardNoteInlineProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(notes ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { updateCardNotes } = useDeckStore();

  // Sync draft when notes prop changes (e.g. store reload)
  useEffect(() => {
    if (!open) setDraft(notes ?? "");
  }, [notes, open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(notes ?? "");
    setOpen(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 0);
  };

  const handleSave = () => {
    setOpen(false);
    const trimmed = draft.trim() || null;
    updateCardNotes(cardId, trimmed ?? "");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setDraft(notes ?? "");
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSave();
    }
  };

  const hasNote = notes?.trim();

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        title={hasNote ? notes! : "Add note"}
        className={`p-0.5 rounded transition-opacity hover:text-amber-400 ${
          hasNote ? "text-amber-400" : "opacity-0 group-hover:opacity-60 text-[var(--text-secondary)]"
        }`}
        aria-label={hasNote ? "Edit note" : "Add note"}
      >
        <FileText className="w-3 h-3" />
      </button>
    );
  }

  return (
    <dialog
      aria-label="Card note editor"
      open
      className="absolute left-0 right-0 top-full z-30 m-0 p-0 bg-transparent border-none shadow-none w-full"
    >
      <div
        className="p-2 bg-(--surface-elevated,var(--surface)) border border-(--border) rounded-lg shadow-lg w-full"
        role="group"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        placeholder="Add a private note for this card…"
        rows={3}
        maxLength={1000}
        className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 resize-none outline-none"
      />
      <div className="text-[10px] text-(--text-secondary)/50 mt-1">
        Ctrl+Enter to save · Esc to cancel
      </div>
      </div>
    </dialog>
  );
}
