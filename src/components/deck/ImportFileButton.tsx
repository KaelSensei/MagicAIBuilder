"use client";
/**
 * The import dialog's file picker: the player chooses `.txt`, MTGO `.dek` or
 * `.csv` decklist files instead of opening them and pasting their text.
 *
 * The browser reads each file with `File.text()`; nothing is uploaded or stored
 * (I-62 requirement 1.6). The choice is checked before any file is read, then
 * the pure readers in `@/lib/import/decklist-files` turn the files into the
 * decklist text the dialog already previews.
 *
 * @module components/deck/ImportFileButton
 */
import { useId, useRef, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { checkDecklistFileChoice, readDecklistFiles } from "@/lib/import/decklist-files";
import { describeFileOutcome, describeRefusals, type ImportFileResult } from "./import-file-message";

export type { ImportFileResult } from "./import-file-message";

/** Extensions and media types the system file chooser offers. */
const ACCEPTED_FILES = ".txt,.dek,.csv,text/plain,text/csv";

interface ImportFileButtonProps {
  /** Whether the text box holds text the files would replace. */
  readonly replacing: boolean;
  readonly disabled?: boolean;
  /** Receives the text to put in the text box and the status line, or a refusal. */
  readonly onRead: (result: ImportFileResult) => void;
}

/** Every file's text, in the order chosen, or `null` when the browser could not read one. */
async function readTexts(files: readonly File[]): Promise<readonly string[] | null> {
  try {
    return await Promise.all(files.map((file) => file.text()));
  } catch {
    return null;
  }
}

/**
 * A labelled button that opens the system file chooser, reads the chosen
 * decklist files in the browser and reports the result through `onRead`.
 */
export function ImportFileButton({ replacing, disabled = false, onRead }: ImportFileButtonProps) {
  const t = useTranslations("deck.import.file");
  const inputRef = useRef<HTMLInputElement>(null);
  const latestChoice = useRef(0);
  const hintId = useId();

  async function readChoice(files: readonly File[]): Promise<ImportFileResult> {
    const refusals = checkDecklistFileChoice(files);
    if (refusals.length > 0) return describeRefusals(t, refusals);
    const texts = await readTexts(files);
    if (texts === null) return { kind: "refused", message: t("readFailed") };
    const outcome = readDecklistFiles(files.map((file, index) => ({ name: file.name, text: texts[index] ?? "" })));
    return describeFileOutcome(t, outcome, replacing);
  }

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    // Cleared so that choosing the same file again reads it again.
    input.value = "";
    if (files.length === 0) return;
    const choice = ++latestChoice.current;
    const result = await readChoice(files);
    if (choice === latestChoice.current) onRead(result);
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={ACCEPTED_FILES}
        aria-label={t("inputLabel")}
        onChange={(event) => void handleChange(event)}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        aria-describedby={hintId}
        onClick={() => inputRef.current?.click()}
      >
        <FileUp className="w-3.5 h-3.5" aria-hidden="true" />
        {t("choose")}
      </Button>
      <p id={hintId} className="text-xs text-[var(--text-secondary)]">
        {t("hint")}
      </p>
    </div>
  );
}
