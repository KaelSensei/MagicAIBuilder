/**
 * Validation and aggregation for recorded playtest sessions.
 *
 * `analytics.ts` has held the pure statistics since US-AG Phase 1, but nothing
 * ever fed it: there was no way to record a session. This module is the layer
 * between an HTTP payload and those functions.
 *
 * The `result` and `difficulty` columns are plain strings in Postgres, so this
 * validation is the only thing standing between a typo and a row that quietly
 * breaks every aggregate that reads it.
 *
 * @module playtest/session-input
 */

import { OPENING_HAND_SIZE } from "./engine";
import {
  buildTrendData,
  calculateAverageTurns,
  calculateWinRate,
  getMatchupStats,
  getMulliganDistribution,
  type MatchupStat,
  type MulliganBucket,
  type PlaytestSession,
  type TrendPoint,
} from "./analytics";

/** The three outcomes the schema stores. */
export const SESSION_RESULTS = ["win", "loss", "draw"] as const;
export type SessionResult = (typeof SESSION_RESULTS)[number];

/** Opponent strength, when the player chooses to say. */
export const SESSION_DIFFICULTIES = ["budget", "mid-range", "cedh"] as const;
export type SessionDifficulty = (typeof SESSION_DIFFICULTIES)[number];

/** Maximum persisted length for a player-authored playtest evidence note. */
export const MAX_SESSION_NOTES_LENGTH = 500;

/** Maximum persisted length for a concrete deck change to test next. */
export const MAX_PROPOSED_CHANGE_LENGTH = 500;

/** A validated session, ready to persist. */
export interface SessionInput {
  readonly result: SessionResult;
  readonly turns: number;
  readonly mulliganCount: number;
  readonly difficulty?: SessionDifficulty;
  readonly notes?: string;
  readonly proposedChange?: string;
  readonly snapshotId?: string;
  readonly cardsSeen?: number;
  readonly additionalCardsSeen?: number;
}

/** Either a validated value or the reason it was refused. */
export type ParseResult =
  | { readonly ok: true; readonly value: SessionInput }
  | { readonly ok: false; readonly error: string };

/** Everything the stats panel needs, in one read. */
export interface SessionSummary {
  readonly total: number;
  /** Percentage of runs won, draws included in the denominator (0–100) */
  readonly winRate: number;
  /** Average turn count across **wins only** */
  readonly averageWinTurns: number;
  readonly mulligans: Record<number, MulliganBucket>;
  readonly matchups: Record<string, MatchupStat>;
  readonly trend: readonly TrendPoint[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function fail(error: string): ParseResult {
  return { ok: false, error };
}

/**
 * Validates an incoming session payload.
 *
 * @param payload - the parsed request body, of unknown shape
 * @returns the validated session, or the name of the field that failed
 */
export function parseSessionInput(payload: unknown): ParseResult {
  if (!isRecord(payload)) return fail("body must be an object");

  const {
    result,
    turns,
    mulliganCount,
    difficulty,
    notes,
    proposedChange,
    snapshotId,
    cardsSeen,
    additionalCardsSeen,
  } = payload;

  if (!SESSION_RESULTS.includes(result as SessionResult)) {
    return fail(`result must be one of ${SESSION_RESULTS.join(", ")}`);
  }

  // A game always has a first turn, so zero is not a legitimate short game.
  if (typeof turns !== "number" || !Number.isInteger(turns) || turns < 1) {
    return fail("turns must be a whole number of at least 1");
  }

  const mulligans = mulliganCount ?? 0;
  // The London mulligan bottoms one card per mulligan; past a full hand there
  // is nothing left to keep, so a larger count cannot have happened.
  if (
    typeof mulligans !== "number" ||
    !Number.isInteger(mulligans) ||
    mulligans < 0 ||
    mulligans > OPENING_HAND_SIZE
  ) {
    return fail(`mulliganCount must be a whole number between 0 and ${OPENING_HAND_SIZE}`);
  }

  if (difficulty !== undefined && !SESSION_DIFFICULTIES.includes(difficulty as SessionDifficulty)) {
    return fail(`difficulty must be one of ${SESSION_DIFFICULTIES.join(", ")}`);
  }

  if (notes !== undefined && typeof notes !== "string") {
    return fail("notes must be text");
  }

  if (proposedChange !== undefined && typeof proposedChange !== "string") {
    return fail("proposedChange must be text");
  }

  if (
    snapshotId !== undefined &&
    (typeof snapshotId !== "string" || snapshotId.trim().length === 0)
  ) {
    return fail("snapshotId must be non-empty text");
  }

  const hasDrawEvidence = cardsSeen !== undefined || additionalCardsSeen !== undefined;
  if (
    hasDrawEvidence &&
    (typeof cardsSeen !== "number" || !Number.isInteger(cardsSeen) || cardsSeen < 0)
  ) {
    return fail("cardsSeen must be a non-negative whole number");
  }
  if (
    hasDrawEvidence &&
    (typeof additionalCardsSeen !== "number" ||
      !Number.isInteger(additionalCardsSeen) ||
      additionalCardsSeen < 0 ||
      additionalCardsSeen > (cardsSeen as number))
  ) {
    return fail("additionalCardsSeen must be a whole number between 0 and cardsSeen");
  }

  const drawEvidence =
    typeof cardsSeen === "number" && typeof additionalCardsSeen === "number"
      ? { cardsSeen, additionalCardsSeen }
      : {};

  // Whitespace-only notes are the same as none; storing them would put an empty
  // row in the UI that the player cannot tell apart from a real note.
  const trimmed = notes?.trim() ?? "";
  if (trimmed.length > MAX_SESSION_NOTES_LENGTH) {
    return fail(`notes must be at most ${MAX_SESSION_NOTES_LENGTH} characters`);
  }
  const trimmedProposedChange = proposedChange?.trim() ?? "";
  if (trimmedProposedChange.length > MAX_PROPOSED_CHANGE_LENGTH) {
    return fail(`proposedChange must be at most ${MAX_PROPOSED_CHANGE_LENGTH} characters`);
  }

  return {
    ok: true,
    value: {
      result: result as SessionResult,
      turns,
      mulliganCount: mulligans,
      difficulty: difficulty as SessionDifficulty | undefined,
      notes: trimmed === "" ? undefined : trimmed,
      proposedChange: trimmedProposedChange === "" ? undefined : trimmedProposedChange,
      snapshotId: typeof snapshotId === "string" ? snapshotId.trim() : undefined,
      ...drawEvidence,
    },
  };
}

/**
 * Rolls a deck's sessions into the figures the stats panel shows.
 *
 * Turn count is averaged over **wins only**: a twenty-turn loss says nothing
 * about how fast the deck closes a game, and folding it in would answer a
 * different question than the one the panel asks.
 *
 * @param sessions - every recorded session for the deck
 * @returns the aggregate figures
 */
export function summarizeSessions(sessions: readonly PlaytestSession[]): SessionSummary {
  return {
    total: sessions.length,
    winRate: calculateWinRate(sessions),
    averageWinTurns: calculateAverageTurns(sessions, "win"),
    mulligans: getMulliganDistribution(sessions),
    matchups: getMatchupStats(sessions),
    trend: buildTrendData(sessions),
  };
}
