"use client";
// Inline card note editor — small textarea that opens on 📝 icon click
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { useDeckStore } from "@/lib/deck/store";

interface CardNoteInlineProps {
  readonly cardId: string;
  readonly notes?: string | null;
}

export function CardNoteInline({ cardId, notes }: CardNoteInlineProps) {
  const t = useTranslations("card.note");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(notes ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateCardNotes = useDeckStore((s) => s.updateCardNotes);

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

  const noteText = notes?.trim() ?? "";
  const hasNote = noteText.length > 0;

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        title={hasNote ? noteText : t("add")}
        className={`p-0.5 rounded transition-opacity hover:text-amber-400 ${
          hasNote
            ? "text-amber-400"
            : "opacity-0 group-hover:opacity-60 text-[var(--text-secondary)]"
        }`}
        aria-label={hasNote ? t("edit") : t("add")}
      >
        <FileText className="w-3 h-3" />
      </button>
    );
  }

  return (
    <dialog
      aria-label={t("editor")}
      open
      className="absolute left-0 right-0 top-full z-30 m-0 p-0 bg-transparent border-none shadow-none w-full"
    >
      {/* Form stops clicks/keys inside the editor from reaching the parent card row */}
      <form
        className="p-2 bg-(--surface-elevated,var(--surface)) border border-(--border) rounded-lg shadow-lg w-full"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            handleKeyDown(e);
          }}
          onBlur={handleSave}
          placeholder={t("placeholder")}
          rows={3}
          maxLength={1000}
          className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 resize-none outline-none"
        />
        <div className="pointer-events-none text-[10px] text-(--text-secondary)/50 mt-1">
          Ctrl+Enter to save · Esc to cancel
        </div>
      </form>
    </dialog>
  );
}
