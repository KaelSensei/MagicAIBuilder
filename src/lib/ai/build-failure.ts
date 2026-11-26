/**
 * Why an AI deck build failed, sorted by what the player can do about it.
 *
 * AI copilot context, client side. The build hook (`hooks/useAIDeckBuild.ts`)
 * used to keep the thrown message ("Failed to fetch", "Build request failed
 * (500)", "The AI build ended early"), and the wizard answered every failure
 * with "Build was cancelled or failed.", the words of a cancelled build. A
 * failed build is now one of four kinds, read from the status the build route
 * answered or from where the build stopped, never from a message (I-02):
 * - `unreachable`: `fetch` rejected, so the request got no answer at all and
 *   checking the connection helps. The hook marks that one step with
 *   {@link DeckBuildUnreachableError}; a `TypeError` once a response arrived (a
 *   stream dropped mid-read, or a bug in the code that reads it) is `failed`,
 *   because the server did answer.
 * - `rate-limited`: a 429 from the route's per-player rate limit, five builds
 *   a minute (`RATE_LIMIT`, `RATE_WINDOW` in `app/api/ai/build/route.ts`), so
 *   waiting a minute helps. The monthly allowance's 429 also carries a denial
 *   code, and the wizard words that one with `useAiDenialMessage`.
 * - `signed-out`: a 401 from `requireAuth`. The wizard lives on `/decks`, a
 *   page that needs a session, so the session has ended: signing in again helps.
 * - `failed`: anything else, where trying again may help. That covers a 5xx,
 *   a 400 (a malformed request is a client bug), the stream's `error` event
 *   (the route sends one fixed line for every server failure, so the event's
 *   type is its code), and a stream cut short, dropped or unreadable.
 *
 * The hook logs the raw error once; it never reaches the player. Only a
 * failure someone must look at is an `error`, which also reports it to Sentry
 * (`lib/logger.ts`); see {@link deckBuildFailureLogLevel}.
 *
 * @module ai/build-failure
 */

import type { AiCallDenial } from "@/lib/ai/usage/denial";

/** Why a build failed, as the player can act on it; see the module header. */
export type DeckBuildFailure =
  "unreachable" | "rate-limited" | "signed-out" | "failed";

/** A `deck` catalog key that tells the player why the build failed. */
export type DeckBuildFailureMessageKey =
  | "wizard.buildUnreachable"
  | "wizard.buildRateLimited"
  | "wizard.buildSignedOut"
  | "wizard.buildFailed";

/** How a failed build is logged: `error` also reports it to Sentry, `warn` does not. */
export type DeckBuildLogLevel = "warn" | "error";

/** The build route answered with an error status instead of a build stream. */
export class DeckBuildRefusedError extends Error {
  /** The HTTP status the build route answered with. */
  readonly status: number;
  /** Why the route refused the call before a model ran, when its body says so. */
  readonly denial: AiCallDenial | null;

  /**
   * @param status - the HTTP status of the refusal; the message carries it
   *   for the log only
   * @param denial - the denial the refusal's body carries, if any
   */
  constructor(status: number, denial: AiCallDenial | null = null) {
    super(`Build request failed (${status})`);
    this.name = "DeckBuildRefusedError";
    this.status = status;
    this.denial = denial;
  }
}

/**
 * The build route's stream said the build failed: its `error` event. The
 * route logged the cause with `logger.error` before sending the event
 * (`app/api/ai/build/route.ts`), so the message is only its fixed line.
 */
export class DeckBuildServerError extends Error {
  override readonly name = "DeckBuildServerError";
}

/**
 * The build request got no answer: `fetch` itself rejected, before any
 * response. The browser's error, a `TypeError` for a network error (Fetch
 * Standard, https://fetch.spec.whatwg.org/#concept-network-error, read
 * 2026-11-26), is kept in `cause` for the log; the message is a fixed line for
 * the log too.
 */
export class DeckBuildUnreachableError extends Error {
  override readonly name = "DeckBuildUnreachableError";

  /** @param cause - what `fetch` rejected with */
  constructor(cause: unknown) {
    super("The build request got no answer", { cause });
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
 * The kind follows where the build stopped, not the error's own type: a
 * `TypeError` can come from `fetch`, from a body reader whose connection
 * dropped after the server answered, or from a bug, and only the first means
 * the server could not be reached.
 *
 * @param error - what the build threw: a {@link DeckBuildRefusedError}, a
 *   {@link DeckBuildUnreachableError}, or anything else
 * @returns `signed-out` for a 401 refusal, `rate-limited` for a 429 refusal,
 *   `unreachable` for a request that got no answer, `failed` otherwise
 */
export function deckBuildFailureOf(error: unknown): DeckBuildFailure {
  if (error instanceof DeckBuildRefusedError) {
    return FAILURE_BY_STATUS.get(error.status) ?? "failed";
  }
  if (error instanceof DeckBuildUnreachableError) return "unreachable";
  return "failed";
}

/**
 * How loudly a failed build is logged, so Sentry gets each failure someone
 * must look at, once.
 *
 * - A refusal the product expects is a warning: a denial (the monthly
 *   allowance, or the spend ceiling, which `lib/ai/usage/meter.ts` reports
 *   once when it is crossed), the rate limit, an ended session.
 * - A request that got no answer is a warning: the player is offline.
 * - The stream's `error` event is a warning: the route has already reported
 *   its cause, and a second report would count one failure twice, without it.
 * - Any other failure is an error: a 5xx or 400 refusal, a stream cut short or
 *   dropped, or a bug.
 *
 * @param error - what the build threw
 * @returns the `logger` method to log it with
 */
export function deckBuildFailureLogLevel(error: unknown): DeckBuildLogLevel {
  if (error instanceof DeckBuildRefusedError && error.denial !== null) {
    return "warn";
  }
  if (error instanceof DeckBuildServerError) return "warn";
  return logLevelOf(deckBuildFailureOf(error));
}

/** A failure the player can act on is expected; only `failed` needs someone to look. */
function logLevelOf(failure: DeckBuildFailure): DeckBuildLogLevel {
  switch (failure) {
    case "unreachable":
    case "rate-limited":
    case "signed-out":
      return "warn";
    case "failed":
      return "error";
    default: {
      const unhandled: never = failure;
      return unhandled;
    }
  }
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
