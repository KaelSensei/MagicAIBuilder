"use client";
/**
 * The primer editing surface: the Markdown source beside its rendered preview, in a dialog.
 *
 * Context: deck building (ui), opened by `DeckDescriptionEditor`. The builder's details panel is
 * 280 px wide at `lg`, too narrow for two panes, so editing opens in the shared `Modal`: the panes
 * sit side by side from `lg` and stack below it, each at a working height with its own scroll.
 * The save contract is the editor's: blur, Save and Ctrl/Cmd+Enter save; Escape drops the draft.
 * Not responsible for: saving or the draft state, which the editor owns.
 *
 * @module deck/DeckPrimerEditorDialog
 */
import { useTranslations } from "next-intl";
import { useId, type KeyboardEvent, type RefObject } from "react";
import { ListPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DeckPrimerPreview } from "./DeckPrimerPreview";

/** The server's cap on a description: `patchDeckSchema` in `src/lib/validation/deck.ts`. */
const DESCRIPTION_MAX_LENGTH = 2000;

/** One working height for both panes: tall enough for several sections, each scrolling alone. */
const PANE_BODY_CLASS = "h-[30vh] overflow-y-auto lg:h-[60vh]";

interface DeckPrimerEditorDialogProps {
  readonly open: boolean;
  readonly draft: string;
  /** The source textarea, which the editor focuses when editing starts. */
  readonly textareaRef: RefObject<HTMLTextAreaElement | null>;
  readonly onDraftChange: (draft: string) => void;
  /** Saves the draft and closes the dialog once the save settles. */
  readonly onSave: () => void;
  /** Drops the draft and closes the dialog. */
  readonly onCancel: () => void;
}

/**
 * Keeps the dialog open when Radix asks to close it.
 *
 * Radix closes on Escape and on a press outside the panel, before the textarea sees either. The
 * textarea's own handlers keep the editor's contract: its Escape drops the draft, and the outside
 * press blurs it, which saves. Closing here first would drop a draft the player meant to save.
 */
function deferCloseToTheTextarea(): void {
  // Intentionally empty: see the TSDoc above.
}

/** The labelled source pane: Escape cancels, Ctrl+Enter or Cmd+Enter saves, blur saves. */
function PrimerSourcePane({
  draft,
  textareaRef,
  onDraftChange,
  onSave,
  onCancel,
}: Omit<DeckPrimerEditorDialogProps, "open">) {
  const t = useTranslations("deck");
  const sourceId = useId();

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") onCancel();
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") onSave();
  };

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label
        htmlFor={sourceId}
        className="text-xs font-medium text-[var(--text-secondary)]"
      >
        {t("description.source")}
      </label>
      <textarea
        id={sourceId}
        ref={textareaRef}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onSave}
        placeholder={t("description.placeholder")}
        maxLength={DESCRIPTION_MAX_LENGTH}
        className={`w-full resize-none rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 font-mono text-xs text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--accent)] ${PANE_BODY_CLASS}`}
      />
    </div>
  );
}

/**
 * Edits a deck primer with a live preview.
 *
 * Shows the primer template insert while the draft is empty, the character counter and Save.
 */
export function DeckPrimerEditorDialog(props: DeckPrimerEditorDialogProps) {
  const { open, draft, textareaRef, onDraftChange, onSave } = props;
  const t = useTranslations("deck");

  const insertPrimerTemplate = () => {
    onDraftChange(t("description.primerTemplateContent"));
    textareaRef.current?.focus();
  };

  return (
    <Modal
      open={open}
      onClose={deferCloseToTheTextarea}
      title={t("description.edit")}
      maxWidth="max-w-5xl"
      showClose={false}
    >
      <div className="flex flex-col gap-3 px-5 py-4">
        {draft.trim() === "" && (
          <button
            type="button"
            // Keep focus in the textarea: its blur saves and closes the dialog.
            onMouseDown={(event) => event.preventDefault()}
            onClick={insertPrimerTemplate}
            className="flex w-fit items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
          >
            <ListPlus className="h-3.5 w-3.5" />
            {t("description.usePrimerTemplate")}
          </button>
        )}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <PrimerSourcePane {...props} />
          <DeckPrimerPreview
            markdown={draft}
            label={t("description.preview")}
            emptyText={t("description.previewEmpty")}
            bodyClassName={PANE_BODY_CLASS}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-secondary)]/50">
            {t("description.editorHelp", {
              count: draft.length,
              max: DESCRIPTION_MAX_LENGTH,
            })}
          </span>
          <button
            type="button"
            // Keep focus in the textarea: its blur also saves, so a press
            // that moved focus here sent the description twice.
            onMouseDown={(event) => event.preventDefault()}
            onClick={onSave}
            className="text-xs px-2 py-0.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors"
          >
            {t("description.save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
