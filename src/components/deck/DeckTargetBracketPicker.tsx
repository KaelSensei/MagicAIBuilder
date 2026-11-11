"use client";
/**
 * Picks the bracket a Commander deck aims for, among the five official
 * Commander Brackets.
 *
 * Context: deck building (ui), inside `DeckDetailsPanel`. The target is the
 * player's intent; the bracket estimate (`scoreBracket`) is the product's
 * reading of the list. The builder measures the deck against the target:
 * `GameChangersBadge` flags more Game Changers than the target allows, and
 * `DeckStats` compares ramp, draw and removal with the target's benchmarks.
 * Levels and colours come from `BRACKET_DEFINITIONS` (Wizards' bracket text of
 * 2025-10-21); names are localized under `deck.bracket.name.<level>`.
 *
 * Not responsible for: saving. The caller passes the store action.
 *
 * @module deck/DeckTargetBracketPicker
 */
import { useId } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";
import {
  BRACKET_DEFINITIONS,
  BRACKET_LEVELS,
  type BracketLevel,
} from "@/lib/constants/brackets";

interface DeckTargetBracketPickerProps {
  /** The deck's saved target. */
  readonly value: BracketLevel;
  /** Called with the bracket the player picks. */
  readonly onChange: (bracket: BracketLevel) => void;
}

/**
 * One toggle button per official bracket, with the target pressed.
 *
 * Each button shows its number and is named "Bracket <n>: <name>", so the
 * visible number stays part of the accessible name (WCAG 2.5.3, label in name).
 */
export function DeckTargetBracketPicker({
  value,
  onChange,
}: DeckTargetBracketPickerProps) {
  const t = useTranslations("builder.details");
  const tDeck = useTranslations("deck");
  const labelId = useId();
  const bracketName = (level: BracketLevel) => tDeck(`bracket.name.${level}`);

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="space-y-1.5 border-b border-[var(--border)] px-3 py-2"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span id={labelId} className="text-xs text-[var(--text-secondary)]">
          {t("targetBracket")}
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: BRACKET_DEFINITIONS[value].color }}
        >
          {bracketName(value)}
        </span>
      </div>
      <div className="flex gap-1.5">
        {BRACKET_LEVELS.map((level) => {
          const pressed = level === value;
          return (
            <button
              key={level}
              type="button"
              aria-pressed={pressed}
              aria-label={t("targetBracketOption", {
                level,
                name: bracketName(level),
              })}
              title={bracketName(level)}
              onClick={() => onChange(level)}
              style={
                pressed
                  ? { color: BRACKET_DEFINITIONS[level].color }
                  : undefined
              }
              className={cn(
                "h-7 flex-1 rounded border text-xs font-bold transition-colors",
                pressed
                  ? "border-current bg-current/10"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
              )}
            >
              {level}
            </button>
          );
        })}
      </div>
    </div>
  );
}
