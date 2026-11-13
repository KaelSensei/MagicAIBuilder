"use client";
/**
 * The meta panel's state and derivations: whether it is open, when each source
 * is read, which popular cards to list, which movements to show, and the
 * evidence window of the tournament decks.
 *
 * Meta-insights context, `client/`: browser state over `useMetaAnalysis` and
 * `useMetaShifts`, no JSX. `ui/MetaPanel.tsx` composes its sections from the
 * three models this returns; the rows and sections stay presentational.
 *
 * What it owns, as `MetaPanel` held it before MI-05:
 * - the open state, and the first read of both sources for each commander the
 *   panel is open on (keyed by commander, so a change while open reads again);
 * - the history read, which waits for the EDHREC answer (see the effect);
 * - the "not in deck" filter over the popular cards;
 * - the movements shown: `steady` dropped, at most {@link MAX_SHIFTS_SHOWN};
 * - the tournament evidence window, from the ISO-dated events.
 *
 * @module meta-insights/client/useMetaPanel
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useMetaAnalysis,
  type MetaSourceHealth,
} from "@/modules/meta-insights/client/useMetaAnalysis";
import {
  useMetaShifts,
  type MetaShiftReportJson,
} from "@/modules/meta-insights/client/useMetaShifts";
import type { MetaShift } from "@/modules/meta-insights/domain/history";
import type {
  MetaCard,
  TournamentDeck,
} from "@/modules/meta-insights/domain/types";

/** Movements shown in the panel; the report itself is not truncated. */
export const MAX_SHIFTS_SHOWN = 8;

/** First and last event dates among the tournament decks, as ISO `yyyy-mm-dd`. */
export interface EvidenceWindow {
  readonly start: string;
  readonly end: string;
}

/** The popular-cards section: EDHREC's list, the in-deck filter, and the source's state. */
export interface EdhrecSectionModel {
  readonly cards: readonly MetaCard[];
  /** `cards` without the deck's own while the filter is on; `cards` otherwise. */
  readonly visibleCards: readonly MetaCard[];
  readonly showOnlyMissing: boolean;
  readonly setShowOnlyMissing: (showOnlyMissing: boolean) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
  /** When EDHREC was last observed; absent until the first answer, so no attribution shows before it. */
  readonly observedAt: string | undefined;
  readonly stale: boolean | undefined;
  readonly health: MetaSourceHealth;
  /** Reads EDHREC again, alone; the retry of its error line. */
  readonly retry: () => void;
}

/** The meta-shifts section: the report and the movements worth a line. */
export interface MetaShiftsSectionModel {
  readonly report: MetaShiftReportJson | null;
  /** The report's non-steady shifts, in its order, at most {@link MAX_SHIFTS_SHOWN}. */
  readonly movements: readonly MetaShift[];
  /** Days recorded in the window; tells "no history yet" from "recorded once" when `report` is null. */
  readonly snapshotCount: number;
  readonly isLoading: boolean;
  readonly error: string | null;
}

/** The competitive-decks section: MTGTop8's list, its evidence window, and the source's state. */
export interface TournamentSectionModel {
  readonly decks: readonly TournamentDeck[];
  /** Null when no deck carries an ISO date. */
  readonly evidenceWindow: EvidenceWindow | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly observedAt: string | undefined;
  readonly stale: boolean | undefined;
  readonly health: MetaSourceHealth;
  /** Reads the tournament source again, alone; the retry of its error line. */
  readonly retry: () => void;
}

/** Everything the meta panel renders from. */
export interface MetaPanelState {
  readonly expanded: boolean;
  readonly toggleExpanded: () => void;
  /** Either source still loading: the header spinner, and Refresh is disabled. */
  readonly isFetching: boolean;
  /** Reads both sources again past the server cache. */
  readonly refresh: () => void;
  readonly edhrec: EdhrecSectionModel;
  readonly shifts: MetaShiftsSectionModel;
  readonly tournament: TournamentSectionModel;
}

type MetaAnalysis = ReturnType<typeof useMetaAnalysis>;
type MetaShifts = ReturnType<typeof useMetaShifts>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The span of the dated events, as the disclosure line shows it. A deck whose
 * date is absent or not `yyyy-mm-dd` is left out rather than guessed at.
 */
function tournamentEvidenceWindow(
  decks: readonly TournamentDeck[]
): EvidenceWindow | null {
  const datedEvents = decks
    .flatMap((deck) =>
      deck.date && ISO_DATE.test(deck.date) ? [deck.date] : []
    )
    .sort((left, right) => left.localeCompare(right));
  const start = datedEvents[0];
  const end = datedEvents.at(-1);
  return start && end ? { start, end } : null;
}

interface EdhrecFilter {
  readonly deckCardNames: ReadonlySet<string>;
  readonly showOnlyMissing: boolean;
  readonly setShowOnlyMissing: (showOnlyMissing: boolean) => void;
}

function edhrecSection(
  analysis: MetaAnalysis,
  filter: EdhrecFilter
): EdhrecSectionModel {
  const cards = analysis.edhrec?.cards ?? [];
  return {
    cards,
    visibleCards: filter.showOnlyMissing
      ? cards.filter((card) => !filter.deckCardNames.has(card.name))
      : cards,
    showOnlyMissing: filter.showOnlyMissing,
    setShowOnlyMissing: filter.setShowOnlyMissing,
    isLoading: analysis.isLoadingEdhrec,
    error: analysis.errorEdhrec,
    observedAt: analysis.edhrec?._meta?.observedAt,
    stale: analysis.edhrec?._meta?.stale,
    health: analysis.sourceHealth.edhrec,
    retry: () => void analysis.fetchSource("edhrec"),
  };
}

function shiftsSection(shifts: MetaShifts): MetaShiftsSectionModel {
  // `steady` is dropped: a card holding its inclusion within a point is the
  // normal state of most of the list, and printing twenty of them would bury
  // the handful that actually moved. The report still carries them for any
  // caller that wants the full picture.
  const movements = (shifts.report?.shifts ?? [])
    .filter((shift) => shift.kind !== "steady")
    .slice(0, MAX_SHIFTS_SHOWN);
  return {
    report: shifts.report,
    movements,
    snapshotCount: shifts.snapshotCount,
    isLoading: shifts.isLoading,
    error: shifts.error,
  };
}

function tournamentSection(analysis: MetaAnalysis): TournamentSectionModel {
  const decks = analysis.tournament?.decks ?? [];
  return {
    decks,
    evidenceWindow: tournamentEvidenceWindow(decks),
    isLoading: analysis.isLoadingTournament,
    error: analysis.errorTournament,
    observedAt: analysis.tournament?._meta?.observedAt,
    stale: analysis.tournament?._meta?.stale,
    health: analysis.sourceHealth.tournament,
    retry: () => void analysis.fetchSource("tournament"),
  };
}

/**
 * State of the meta panel for one commander.
 *
 * Nothing is read until the panel is opened; then both sources are read once
 * per commander, and again only through `refresh`, a section's `retry`, or a
 * commander the open panel has not read yet. A commander change while the
 * panel is closed reads nothing until the next opening. `commanderName` null
 * leaves every source empty.
 *
 * @param deckCardNames - the deck's card names, for the in-deck check and the "not in deck" filter
 */
export function useMetaPanel(
  commanderName: string | null,
  deckCardNames: ReadonlySet<string>
): MetaPanelState {
  const [expanded, setExpanded] = useState(false);
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  // The commander both sources were last read for. Keyed by name rather than
  // a once-only flag, so a commander change is an ordinary dependency change
  // and no reset effect has to run before this one (B2 fix, 2026-11-13).
  const fetchedFor = useRef<string | null>(null);
  const analysis = useMetaAnalysis(commanderName);
  const shifts = useMetaShifts(commanderName);
  const { fetchAll } = analysis;
  const { fetchShifts } = shifts;

  // Read both sources when the panel is open on a commander it has not read.
  useEffect(() => {
    if (!expanded || !commanderName) return;
    if (fetchedFor.current === commanderName) return;
    fetchedFor.current = commanderName;
    fetchAll();
  }, [expanded, commanderName, fetchAll]);

  // Read the history only once the EDHREC call has returned. That call is what
  // *writes* today's snapshot, so firing both together would race: on a
  // commander recorded once before, the read could land first and report no
  // history on the very visit that completed it. `analysis.edhrec` is the new
  // commander's answer or null: `useMetaAnalysis` reads another commander's
  // payload as absent, and `useMetaShifts` resets itself on a commander change.
  useEffect(() => {
    if (analysis.edhrec) void fetchShifts();
  }, [analysis.edhrec, fetchShifts]);

  const toggleExpanded = useCallback(() => setExpanded((open) => !open), []);
  const refresh = useCallback(() => {
    fetchedFor.current = commanderName;
    fetchAll(true);
  }, [commanderName, fetchAll]);

  return {
    expanded,
    toggleExpanded,
    isFetching: analysis.isLoadingEdhrec || analysis.isLoadingTournament,
    refresh,
    edhrec: edhrecSection(analysis, {
      deckCardNames,
      showOnlyMissing,
      setShowOnlyMissing,
    }),
    shifts: shiftsSection(shifts),
    tournament: tournamentSection(analysis),
  };
}
