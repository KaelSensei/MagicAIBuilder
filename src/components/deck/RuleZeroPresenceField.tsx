"use client";

/**
 * One declared yes/no on a Rule 0 sheet, with the words the player wrote.
 *
 * Deck building, ui. The checkbox is the player's statement. Nothing here
 * is read from the deck.
 *
 * @module deck/RuleZeroPresenceField
 */
import { useId } from "react";
import { useTranslations } from "next-intl";
import type { DeclaredPresence } from "@/lib/rule-zero/sheet";

interface RuleZeroPresenceFieldProps {
  /** Catalogue key under `ruleZero`: combos, extra turns or resource denial. */
  readonly labelKey: "combos" | "extraTurns" | "resourceDenial";
  readonly value: DeclaredPresence;
  readonly onChange: (value: DeclaredPresence) => void;
}

/** A presence checkbox and its note. */
export function RuleZeroPresenceField({
  labelKey,
  value,
  onChange,
}: RuleZeroPresenceFieldProps) {
  const t = useTranslations("ruleZero");
  const noteId = useId();

  return (
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium text-[var(--text-primary)]">
        {t(labelKey)}
      </legend>
      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={value.present}
          onChange={(event) =>
            onChange({ ...value, present: event.target.checked })
          }
        />
        {t(labelKey)}: {t("present")}
      </label>
      <label
        className="block text-sm text-[var(--text-secondary)]"
        htmlFor={noteId}
      >
        {t(labelKey)} — {t("note")}
        <input
          id={noteId}
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[var(--text-primary)]"
          value={value.note}
          onChange={(event) => onChange({ ...value, note: event.target.value })}
        />
      </label>
    </fieldset>
  );
}
