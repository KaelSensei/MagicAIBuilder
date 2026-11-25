"use client";
/**
 * The bracket badge's note on the deck's combo lookup (I-77 4.3, issue
 * #1840): a sentence while the lookup has not answered or once it failed,
 * nothing once it answered.
 *
 * Context: deck building (ui), inside `BracketIndicator`. It reads the
 * sentences of the "To reach Bracket N" list (`builder.details.bracketPath`),
 * so the badge and the list word the same state the same way.
 *
 * @module deck/ComboLookupNote
 */
import { useTranslations } from "next-intl";
import type { ComboData } from "@/lib/deck/explain-bracket";

/** The catalogue key of each combo data kind that needs a note. */
const NOTE_KEY = {
  pending: "comboFloorPending",
  unavailable: "comboFloorNotChecked",
} as const satisfies Readonly<
  Record<Exclude<ComboData["kind"], "found">, string>
>;

interface ComboLookupNoteProps {
  /** The deck's combo data from `comboDataOf`; absent when the caller has none. */
  readonly comboData: ComboData | undefined;
}

/** Says the badge's estimate does not count combos yet, or was made without them. */
export function ComboLookupNote({ comboData }: ComboLookupNoteProps) {
  const t = useTranslations("builder.details.bracketPath");
  if (comboData === undefined || comboData.kind === "found") return null;
  return (
    <p className="text-xs text-[var(--text-secondary)]">
      {t(NOTE_KEY[comboData.kind])}
    </p>
  );
}
