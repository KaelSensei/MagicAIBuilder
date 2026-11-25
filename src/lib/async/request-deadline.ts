/**
 * A time limit on a browser request, so no screen waits forever on a server
 * that never answers (I-04 slice 1: no request appears to hang).
 *
 * Shared by the deck reads, the notification preferences panel and the player
 * statistics hook. The deadline covers the whole request, the body read
 * included: a server that sends its headers and then stalls is cut off too.
 *
 * @module lib/async/request-deadline
 */

/**
 * How long a browser read may take before it is given up: long enough for a
 * slow mobile connection, short enough that a player sees an error and a retry
 * instead of a spinner that never stops.
 */
export const REQUEST_DEADLINE_MS = 15_000;

/**
 * Runs `request` with an abort signal that fires after `deadlineMs`.
 *
 * Each call gets its own signal and its own deadline, so a retry starts a
 * fresh clock. The timer is cleared as soon as `request` settles.
 *
 * @param request - the work to bound; it must pass the signal to `fetch`
 * @param deadlineMs - the time limit, in milliseconds
 * @returns what `request` returns
 * @throws whatever `request` throws, including the fetch's `AbortError` when
 *   the deadline passes first
 */
export async function withRequestDeadline<T>(
  request: (signal: AbortSignal) => Promise<T>,
  deadlineMs: number = REQUEST_DEADLINE_MS
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deadlineMs);
  try {
    return await request(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
