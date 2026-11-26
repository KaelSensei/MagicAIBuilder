"use client";
/**
 * The quick-add palette's reading switch: read the line as a card name or as
 * rules text.
 *
 * Card catalog, quick add (I-37 slice 22). Two toggle buttons in a fieldset;
 * Alt+R does the same from the combobox (`useQuickAddPalette`).
 *
 * @module search/QuickAddReadingSwitch
 */
import { useTranslations } from "next-intl";
import type { QuickAddReading } from "@/lib/search/quick-add-query";

interface QuickAddReadingSwitchProps {
  readonly reading: QuickAddReading;
  readonly onChange: (reading: QuickAddReading) => void;
}

/**
 * The Name / Rules text toggle.
 *
 * @param props - The reading in force and where to send a new one
 * @returns The fieldset with its two pressed-state buttons
 */
export function QuickAddReadingSwitch(props: QuickAddReadingSwitchProps) {
  const t = useTranslations("search");
  return (
    <fieldset className="m-0 flex min-w-0 gap-1 border-0 p-0">
      <legend className="sr-only">{t("quickAdd.readingGroup")}</legend>
      <ReadingButton
        pressed={props.reading === "name"}
        label={t("quickAdd.nameReading")}
        onClick={() => props.onChange("name")}
      />
      <ReadingButton
        pressed={props.reading === "oracle"}
        label={t("quickAdd.oracleReading")}
        onClick={() => props.onChange("oracle")}
      />
    </fieldset>
  );
}

function ReadingButton(props: {
  readonly pressed: boolean;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.pressed}
      onClick={props.onClick}
      className={
        props.pressed
          ? "rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-3 py-1 text-xs text-white"
          : "rounded-[var(--lumen-radius-pill)] border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]"
      }
    >
      {props.label}
    </button>
  );
}
