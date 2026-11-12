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

import { isRecordOrArray } from "@/lib/guards";
import { maxMulligans } from "./engine";
import {
  SESSION_DIFFICULTIES,
  SESSION_RESULTS,
  isSessionDifficulty,
  isSessionResult,
  type SessionDifficulty,
  type SessionResult,
} from "./session-enums";
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

/**
 * Most mulligans any playtest can record: down to a zero-card hand (CR 103.5),
 * plus the free first mulligan of a multiplayer game (CR 103.5c).
 */
const MAX_RECORDED_MULLIGANS = maxMulligans({ firstMulliganFree: true });

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

function isOptionalText(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalSnapshotId(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === "string" && value.trim().length > 0);
}

function isWholeNumberInRange(value: unknown, minimum: number, maximum = Number.POSITIVE_INFINITY): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum && value <= maximum;
}

function parseDrawEvidence(cardsSeen: unknown, additionalCardsSeen: unknown):
  | { readonly ok: true; readonly value: { readonly cardsSeen?: number; readonly additionalCardsSeen?: number } }
  | { readonly ok: false; readonly error: string } {
  if (cardsSeen === undefined && additionalCardsSeen === undefined) {
    return { ok: true, value: {} };
  }
  if (typeof cardsSeen !== "number" || !Number.isInteger(cardsSeen) || cardsSeen < 0) {
    return { ok: false, error: "cardsSeen must be a non-negative whole number" };
  }
  if (typeof additionalCardsSeen !== "number" || !Number.isInteger(additionalCardsSeen) || additionalCardsSeen < 0 || additionalCardsSeen > cardsSeen) {
    return { ok: false, error: "additionalCardsSeen must be a whole number between 0 and cardsSeen" };
  }
  return { ok: true, value: { cardsSeen, additionalCardsSeen } };
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
  if (!isRecordOrArray(payload)) return fail("body must be an object");

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

  if (!isSessionResult(result)) {
    return fail(`result must be one of ${SESSION_RESULTS.join(", ")}`);
  }

  // A game always has a first turn, so zero is not a legitimate short game.
  if (!isWholeNumberInRange(turns, 1)) {
    return fail("turns must be a whole number of at least 1");
  }

  const mulligans = mulliganCount ?? 0;
  // The playtest stops mulligans at a zero-card hand (CR 103.5), so a larger
  // count cannot have come from it.
  if (!isWholeNumberInRange(mulligans, 0, MAX_RECORDED_MULLIGANS)) {
    return fail(`mulliganCount must be a whole number between 0 and ${MAX_RECORDED_MULLIGANS}`);
  }

  if (difficulty !== undefined && !isSessionDifficulty(difficulty)) {
    return fail(`difficulty must be one of ${SESSION_DIFFICULTIES.join(", ")}`);
  }

  if (!isOptionalText(notes)) {
    return fail("notes must be text");
  }

  if (!isOptionalText(proposedChange)) {
    return fail("proposedChange must be text");
  }

  if (!isOptionalSnapshotId(snapshotId)) {
    return fail("snapshotId must be non-empty text");
  }

  const drawEvidence = parseDrawEvidence(cardsSeen, additionalCardsSeen);
  if (!drawEvidence.ok) return fail(drawEvidence.error);

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
      result,
      turns,
      mulliganCount: mulligans,
      difficulty,
      notes: trimmed === "" ? undefined : trimmed,
      proposedChange: trimmedProposedChange === "" ? undefined : trimmedProposedChange,
      snapshotId: typeof snapshotId === "string" ? snapshotId.trim() : undefined,
      ...drawEvidence.value,
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
