"use client";
/**
 * The turn and phase filter of the playtest action log: which turn and phase
 * the player is looking at, and the entries and turn evidence that view shows.
 *
 * Playtest context, client state. `PlaytestActionLog` owns it and hands the
 * model to `ActionLogFilters` (the buttons), the rows and the evidence box.
 * The filter narrows what is shown only: the copy and the exports keep the
 * whole log.
 *
 * @module hooks/useActionLogFilter
 */
import { useMemo, useState } from "react";
import type { PlaytestActionLogEntry } from "@/lib/playtest/engine";
import {
  summarizeActionLog,
  type PlaytestTurnSummary,
} from "@/lib/playtest/action-log-export";

/** One of the game's phases, as the log records it. */
export type ActionLogPhase = PlaytestActionLogEntry["phase"];

/** The filter's state and the view it selects. */
export interface ActionLogFilterModel {
  /** The turns the log covers, ascending. */
  readonly turns: readonly number[];
  /** The selected turn, or null for the whole log. */
  readonly activeTurn: number | null;
  /** The phases of the selected turn (or of the whole log), in log order. */
  readonly phases: readonly ActionLogPhase[];
  /** The selected phase, or null for every phase of the selected turn. */
  readonly activePhase: ActionLogPhase | null;
  /** The entries of the selected turn and phase, in log order. */
  readonly visibleEntries: readonly PlaytestActionLogEntry[];
  /**
   * The turn summaries of the selected turn (or of every turn) that hold
   * structured evidence: at least one draw, mana produced or card seen.
   */
  readonly visibleSummaries: readonly PlaytestTurnSummary[];
  /** Selects a turn, or the whole log with null. Either way the phase is forgotten. */
  readonly selectTurn: (turn: number | null) => void;
  /** Selects a phase of the selected turn, or every phase with null. */
  readonly selectPhase: (phase: ActionLogPhase | null) => void;
}

/**
 * Keeps the selected turn and phase and derives the view from `entries`.
 *
 * A selection the log no longer contains (an undone turn, a phase without
 * entries after a turn change) counts as no selection, without being cleared:
 * it applies again if its entries come back. The derivation is memoised on the
 * entries and the selection because the log re-renders on every game action.
 */
export function useActionLogFilter(
  entries: readonly PlaytestActionLogEntry[]
): ActionLogFilterModel {
  const [selectedTurn, setSelectedTurn] = useState<number | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<ActionLogPhase | null>(
    null
  );

  const view = useMemo(() => {
    const turns = [...new Set(entries.map((entry) => entry.turn))].sort(
      (first, second) => first - second
    );
    const activeTurn =
      selectedTurn !== null && turns.includes(selectedTurn)
        ? selectedTurn
        : null;
    const turnEntries =
      activeTurn === null
        ? entries
        : entries.filter((entry) => entry.turn === activeTurn);
    const phases = [...new Set(turnEntries.map((entry) => entry.phase))];
    const activePhase =
      selectedPhase !== null && phases.includes(selectedPhase)
        ? selectedPhase
        : null;
    const visibleEntries =
      activePhase === null
        ? turnEntries
        : turnEntries.filter((entry) => entry.phase === activePhase);
    const visibleSummaries = summarizeActionLog(entries).filter(
      (summary) =>
        (activeTurn === null || summary.turn === activeTurn) &&
        summary.draws + summary.manaProduced + summary.cardsSeen > 0
    );
    return {
      turns,
      activeTurn,
      phases,
      activePhase,
      visibleEntries,
      visibleSummaries,
    };
  }, [entries, selectedTurn, selectedPhase]);

  return {
    ...view,
    selectTurn: (turn) => {
      setSelectedTurn(turn);
      setSelectedPhase(null);
    },
    selectPhase: setSelectedPhase,
  };
}
