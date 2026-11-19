/**
 * The two closed value sets a recorded playtest session carries: how the game
 * ended and how strong the opponent was.
 *
 * Playtest context, session records. Both columns are plain strings in
 * Postgres, so every other playtest module reads the sets from here: the API
 * validation (`session-input`), the aggregates (`analytics`), the history
 * panel's ordering (`summary-view`) and the result bar's options. The AI
 * copilot reads them too, for the prompt evidence (`ai/playtest-context`).
 * The tuple order is the order the UI shows.
 *
 * @module playtest/session-enums
 */

/** How a recorded game ended, in the order the result bar offers them. */
export const SESSION_RESULTS = ["win", "loss", "draw"] as const;

/** One of {@link SESSION_RESULTS}. */
export type SessionResult = (typeof SESSION_RESULTS)[number];

/**
 * Opponent strength, when the player chooses to say, from weakest to
 * strongest. The order is also the matchup table's sort order.
 */
export const SESSION_DIFFICULTIES = ["budget", "mid-range", "cedh"] as const;

/** One of {@link SESSION_DIFFICULTIES}. */
export type SessionDifficulty = (typeof SESSION_DIFFICULTIES)[number];

/*
 * The two sets widened for lookup: a tuple of literals only accepts one of
 * its own members in `.includes`, and the guards below test `unknown`.
 */
const RESULT_VALUES: readonly unknown[] = SESSION_RESULTS;
const DIFFICULTY_VALUES: readonly unknown[] = SESSION_DIFFICULTIES;

/**
 * Narrows an unknown value, from a request body or a stored row, to a
 * {@link SessionResult}. Case-sensitive: `"Win"` is refused.
 *
 * @param value - anything; non-strings are refused rather than coerced
 */
export function isSessionResult(value: unknown): value is SessionResult {
  return RESULT_VALUES.includes(value);
}

/**
 * Narrows an unknown value, from a request body or a stored row, to a
 * {@link SessionDifficulty}. `undefined` is not a difficulty: callers that
 * allow an unset value check for it first.
 *
 * @param value - anything; non-strings are refused rather than coerced
 */
export function isSessionDifficulty(
  value: unknown
): value is SessionDifficulty {
  return DIFFICULTY_VALUES.includes(value);
}
