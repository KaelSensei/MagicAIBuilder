/**
 * The player statistics report: one calendar year of a player's statistics,
 * the years the page offers, and the names that label each deck link (I-60
 * slice 2, requirements 2.1 to 2.3).
 *
 * Deck analysis, pure: the shape `GET /api/user/stats` answers and `/stats`
 * renders, and the calendar rules behind it. Years are UTC calendar years.
 * Not responsible for: reading the database (`player-stats-read.ts`) or the
 * counting rules (`player-stats.ts`).
 *
 * @module deck/player-stats-report
 */
import {
  countPlayerStats,
  type PlayerStats,
  type PlayerStatsDeck,
  type StatsWindow,
} from "./player-stats";

/** A deck of the player, by id and name, so a figure can link to it. */
export interface StatsDeckName {
  readonly id: string;
  readonly name: string;
}

/** One year of a player's statistics, as the page shows it. */
export interface PlayerStatsReport {
  readonly year: number;
  /** The years the picker offers, newest first, back to the account's first year */
  readonly years: readonly number[];
  /** Every deck of the player, so each figure links to the decks behind it */
  readonly decks: readonly StatsDeckName[];
  readonly stats: PlayerStats;
  /**
   * Always false: no Commander Spellbook request is made per deck, so each
   * bracket estimate leaves the two-card-combo floor unchecked (I-77 4.3).
   */
  readonly comboFloorChecked: false;
}

/** What one report is built from. */
export interface PlayerStatsReportInput {
  readonly year: number;
  readonly years: readonly number[];
  readonly decks: readonly StatsDeckName[];
  readonly rows: readonly PlayerStatsDeck[];
}

/** A whole year, digits only, as a query string carries it. */
const YEAR_PATTERN = /^\d{4}$/;

/**
 * The years the page offers, newest first.
 *
 * @param accountCreatedAt - when the account was created: its first year
 * @param now - the request time: its year is the current one
 * @returns every year from the current one back to the account's first; the
 *   current year alone when the account's date lies ahead of the clock
 */
export function statsYears(
  accountCreatedAt: Date,
  now: Date
): readonly number[] {
  const current = now.getUTCFullYear();
  const first = Math.min(accountCreatedAt.getUTCFullYear(), current);
  return Array.from(
    { length: current - first + 1 },
    (_, index) => current - index
  );
}

/**
 * Reads the year a request asks for (requirement 2.1).
 *
 * @param requested - the `year` query value, or null when none was sent
 * @param years - the years on offer, newest first, as `statsYears` gives them
 * @returns the year asked for, the newest year when none was asked for, or
 *   null when the value is not one of the years on offer
 */
export function parseStatsYear(
  requested: string | null,
  years: readonly number[]
): number | null {
  if (requested === null) return years[0] ?? null;
  if (!YEAR_PATTERN.test(requested)) return null;
  const year = Number(requested);
  return years.includes(year) ? year : null;
}

/**
 * The calendar year counted, in UTC.
 *
 * @param year - the year
 * @returns from 1 January of the year included to 1 January of the next excluded
 */
export function statsWindowOf(year: number): StatsWindow {
  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year + 1, 0, 1)),
  };
}

/**
 * Counts one year of a player's statistics.
 *
 * @param input - the year, the years on offer, the player's deck names and
 *   the rows the counting reads
 * @returns the report the page and the route serve
 */
export function buildPlayerStatsReport(
  input: PlayerStatsReportInput
): PlayerStatsReport {
  return {
    year: input.year,
    years: input.years,
    decks: input.decks,
    stats: countPlayerStats(input.rows, statsWindowOf(input.year)),
    comboFloorChecked: false,
  };
}
