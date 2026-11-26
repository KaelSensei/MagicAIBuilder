/**
 * Why an AI deck build failed, sorted by what the player can do about it.
 *
 * AI copilot context, client side. The build hook (`hooks/useAIDeckBuild.ts`)
 * used to keep the thrown message ("Failed to fetch", "Build request failed
 * (500)", "The AI build ended early"), and the wizard answered every failure
 * with "Build was cancelled or failed.", the words of a cancelled build. A
 * failed build is now one of four kinds, read from the status the build route
 * answered or from the type of what was thrown, never from a message (I-02):
 * - `unreachable`: the request or its stream was lost on the network, so
 *   checking the connection helps.
 * - `rate-limited`: a 429 from the route's per-player rate limit, five builds
 *   a minute (`RATE_LIMIT`, `RATE_WINDOW` in `app/api/ai/build/route.ts`), so
 *   waiting a minute helps. The monthly allowance's 429 also carries a denial
 *   code, and the wizard words that one with `useAiDenialMessage`.
 * - `signed-out`: a 401 from `requireAuth`. The wizard lives on `/decks`, a
 *   page that needs a session, so the session has ended: signing in again helps.
 * - `failed`: anything else, where trying again may help. That covers a 5xx,
 *   a 400 (a malformed request is a client bug), the stream's `error` event
 *   (the route sends one fixed line for every server failure, so the event's
 *   type is its code), and a stream cut short or unreadable.
 *
 * The hook logs the raw error; it never reaches the player.
 *
 * @module ai/build-failure
 */

/** Why a build failed, as the player can act on it; see the module header. */
export type DeckBuildFailure =
  "unreachable" | "rate-limited" | "signed-out" | "failed";

/** A `deck` catalog key that tells the player why the build failed. */
export type DeckBuildFailureMessageKey =
  | "wizard.buildUnreachable"
  | "wizard.buildRateLimited"
  | "wizard.buildSignedOut"
  | "wizard.buildFailed";

/** The build route answered with an error status instead of a build stream. */
export class DeckBuildRefusedError extends Error {
  /** The HTTP status the build route answered with. */
  readonly status: number;

  /**
   * @param status - the HTTP status of the refusal; the message carries it
   *   for the log only
   */
  constructor(status: number) {
    super(`Build request failed (${status})`);
    this.name = "DeckBuildRefusedError";
    this.status = status;
  }
}

/** The failure of each status the player can act on; any other status is `failed`. */
const FAILURE_BY_STATUS: ReadonlyMap<number, DeckBuildFailure> = new Map([
  [401, "signed-out"],
  [429, "rate-limited"],
]);

/**
 * Reads what a failed build threw.
 *
 * `fetch` and a response body's reader reject with a `TypeError` when the
 * network fails (Fetch Standard, "network error",
 * https://fetch.spec.whatwg.org/#concept-network-error, read 2026-11-26).
 *
 * @param error - what the build threw: a {@link DeckBuildRefusedError}, a
 *   network `TypeError`, or anything else
 * @returns `signed-out` for a 401 refusal, `rate-limited` for a 429 refusal,
 *   `unreachable` for a network error, `failed` otherwise
 */
export function deckBuildFailureOf(error: unknown): DeckBuildFailure {
  if (error instanceof DeckBuildRefusedError) {
    return FAILURE_BY_STATUS.get(error.status) ?? "failed";
  }
  if (error instanceof TypeError) return "unreachable";
  return "failed";
}

/**
 * The sentence a failed build shows, as a key of the `deck` catalog.
 *
 * @param failure - why the build failed
 * @returns the key of its message in every locale's `deck.json`
 */
export function deckBuildFailureMessageKey(
  failure: DeckBuildFailure
): DeckBuildFailureMessageKey {
  switch (failure) {
    case "unreachable":
      return "wizard.buildUnreachable";
    case "rate-limited":
      return "wizard.buildRateLimited";
    case "signed-out":
      return "wizard.buildSignedOut";
    case "failed":
      return "wizard.buildFailed";
    default: {
      const unhandled: never = failure;
      return unhandled;
    }
  }
}
