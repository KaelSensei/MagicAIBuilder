"use client";
/**
 * The private note on one deck card: a note button on the row that opens a
 * small editor below it.
 *
 * Deck-building context, mounted by `CardRowActions`. Saving goes through the
 * store's `updateCardNotes`, which shows the note at once and restores the last
 * saved one if the server refuses it.
 *
 * @module card/CardNoteInline
 */
import { useState, useRef, useEffect, useId } from "react";
import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { useDeckStore } from "@/lib/deck/store";

interface CardNoteInlineProps {
  readonly cardId: string;
  /** Names the controls for assistive technology, as the row's other buttons do. */
  readonly cardName: string;
  readonly notes?: string | null;
}

/**
 * Shows the note button and, once opened, the note editor.
 *
 * Ctrl+Enter (⌘+Enter) or leaving the field saves; Escape drops the draft.
 * Both keys give focus back to the note button, so a keyboard user does not
 * restart from the top of the page.
 */
export function CardNoteInline({
  cardId,
  cardName,
  notes,
}: CardNoteInlineProps) {
  const t = useTranslations("card.note");
  const hintId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(notes ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);
  const updateCardNotes = useDeckStore((s) => s.updateCardNotes);

  // Sync draft when notes prop changes (e.g. store reload)
  useEffect(() => {
    if (!open) setDraft(notes ?? "");
  }, [notes, open]);

  useEffect(() => {
    if (open || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    buttonRef.current?.focus();
  }, [open]);

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
    // An emptied note is deleted (`null`), not stored as an empty string.
    void updateCardNotes(cardId, draft.trim() || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      restoreFocusRef.current = true;
      setOpen(false);
      setDraft(notes ?? "");
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      restoreFocusRef.current = true;
      handleSave();
    }
  };

  const noteText = notes?.trim() ?? "";
  const hasNote = noteText.length > 0;

  if (!open) {
    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        title={hasNote ? noteText : t("add")}
        className={`p-0.5 rounded transition-opacity hover:text-amber-400 focus-visible:opacity-100 ${
          hasNote
            ? "text-amber-400"
            : "opacity-0 group-hover:opacity-60 text-[var(--text-secondary)]"
        }`}
        aria-label={
          hasNote
            ? t("editNamed", { name: cardName })
            : t("addNamed", { name: cardName })
        }
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
          aria-label={t("fieldNamed", { name: cardName })}
          aria-describedby={hintId}
          placeholder={t("placeholder")}
          rows={3}
          maxLength={1000}
          className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 resize-none outline-none"
        />
        <div
          id={hintId}
          className="pointer-events-none text-[10px] text-(--text-secondary)/50 mt-1"
        >
          {t("hint")}
        </div>
      </form>
    </dialog>
  );
}
