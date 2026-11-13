"use client";
/**
 * The turn and phase buttons of the playtest action log.
 *
 * Playtest context, UI. Presentational: `useActionLogFilter` decides which
 * turns and phases exist and which are selected; this file renders them as
 * toggle buttons. A row of buttons appears only when there is a choice to
 * make: two turns or more, two phases or more.
 *
 * @module playtest/ActionLogFilters
 */
import { useTranslations } from "next-intl";
import type { ActionLogPhase } from "@/hooks/useActionLogFilter";

/** The turns and phases offered, the selected ones, and what selecting does. */
export interface ActionLogFiltersProps {
  readonly turns: readonly number[];
  readonly activeTurn: number | null;
  readonly phases: readonly ActionLogPhase[];
  readonly activePhase: ActionLogPhase | null;
  /** Called with null for the whole log. */
  readonly onSelectTurn: (turn: number | null) => void;
  /** Called with null for every phase of the selected turn. */
  readonly onSelectPhase: (phase: ActionLogPhase | null) => void;
}

const TOGGLE_CLASS =
  "rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] aria-pressed:border-purple-400/60 aria-pressed:text-[var(--text-primary)]";

/**
 * Two fieldsets of toggle buttons, turns then phases, each with a first
 * button for "everything". The whole-log button carries the log's title as
 * its name, so the test and the screen reader find it as "Action log".
 */
export function ActionLogFilters({
  turns,
  activeTurn,
  phases,
  activePhase,
  onSelectTurn,
  onSelectPhase,
}: ActionLogFiltersProps) {
  const t = useTranslations("playtest.log");
  const phaseLabel = useTranslations("playtest.phases");

  return (
    <>
      {turns.length > 1 && (
        <fieldset className="mb-3 flex min-w-0 flex-wrap gap-1 border-0 p-0">
          <legend className="sr-only">{t("title")}</legend>
          <button
            type="button"
            aria-pressed={activeTurn === null}
            onClick={() => onSelectTurn(null)}
            className={TOGGLE_CLASS}
          >
            {t("title")}
          </button>
          {turns.map((turn) => (
            <button
              key={turn}
              type="button"
              aria-pressed={activeTurn === turn}
              onClick={() => onSelectTurn(turn)}
              className={TOGGLE_CLASS}
            >
              {t("turn", { turn })}
            </button>
          ))}
        </fieldset>
      )}
      {phases.length > 1 && (
        <fieldset className="mb-3 flex min-w-0 flex-wrap gap-1 border-0 p-0">
          <legend className="sr-only">{t("allPhases")}</legend>
          <button
            type="button"
            aria-pressed={activePhase === null}
            onClick={() => onSelectPhase(null)}
            className={TOGGLE_CLASS}
          >
            {t("allPhases")}
          </button>
          {phases.map((phase) => (
            <button
              key={phase}
              type="button"
              aria-pressed={activePhase === phase}
              onClick={() => onSelectPhase(phase)}
              className={TOGGLE_CLASS}
            >
              {phaseLabel(phase)}
            </button>
          ))}
        </fieldset>
      )}
    </>
  );
}
