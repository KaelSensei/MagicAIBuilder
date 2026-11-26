/**
 * One log line for a Scryfall lookup that failed, at the level it deserves.
 *
 * A lookup the request queue refused during a 429 block was never sent: the
 * queue already logged that block once at `warn`. Logging each refusal as an
 * error, which also reaches Sentry, would repeat the same event once per
 * request for the whole block. Any other failure is unexpected and stays an
 * error.
 *
 * @module scryfall/log-lookup-failure
 */
import { logger } from "@/lib/logger";
import { ScryfallBlockedError } from "@/lib/scryfall/request-queue";

/** The two messages of a lookup: one for a refusal during a block, one for a failure. */
export interface LookupFailureMessages {
  /** Logged at `info` when the queue refused the request during a 429 block. */
  readonly blocked: string;
  /** Logged at `error`, with the error, for any other failure. */
  readonly failed: string;
}

/**
 * Logs a failed Scryfall lookup: at `info` when the queue refused it during a
 * 429 block (a `ScryfallBlockedError`), else at `error` with what was thrown.
 *
 * @param error - what the lookup threw
 * @param context - the caller, as `logger` takes it (for example a route)
 * @param messages - the line for each case
 */
export function logScryfallLookupFailure(
  error: unknown,
  context: string,
  messages: LookupFailureMessages
): void {
  if (error instanceof ScryfallBlockedError) {
    logger.info(messages.blocked, context);
    return;
  }
  logger.error(messages.failed, context, error);
}
