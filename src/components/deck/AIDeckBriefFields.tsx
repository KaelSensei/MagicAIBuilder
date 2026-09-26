"use client";

import { useTranslations } from "next-intl";

import type { DeckBrief } from "@/lib/ai/deck-brief";
import { MAX_DECK_BRIEF_FIELD_LENGTH } from "@/lib/ai/deck-brief";

interface AIDeckBriefFieldsProps {
  readonly value: DeckBrief;
  readonly onChange: (brief: DeckBrief) => void;
}

const FIELDS: readonly (keyof DeckBrief)[] = ["theme", "playPattern", "dislikes"];

/** Player-authored intent used to ground deck-specific AI suggestions. */
export function AIDeckBriefFields({ value, onChange }: AIDeckBriefFieldsProps) {
  const t = useTranslations("deck.ai.brief");

  return (
    <fieldset className="space-y-2 rounded-md border border-[var(--border)] p-2">
      <legend className="px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        {t("title")}
      </legend>
      <p className="text-[10px] leading-relaxed text-[var(--text-secondary)]">
        {t("description")}
      </p>
      {FIELDS.map((field) => (
        <label key={field} className="block space-y-1">
          <span className="text-[10px] font-medium text-[var(--text-secondary)]">
            {t(`${field}Label`)}
          </span>
          <input
            type="text"
            value={value[field]}
            maxLength={MAX_DECK_BRIEF_FIELD_LENGTH}
            placeholder={t(`${field}Placeholder`)}
            onChange={(event) => onChange({ ...value, [field]: event.target.value })}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--accent)]"
          />
        </label>
      ))}
    </fieldset>
  );
}
