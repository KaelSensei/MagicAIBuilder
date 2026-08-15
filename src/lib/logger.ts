/**
 * Centralised logger — thin wrapper around console that satisfies
 * SonarCloud rule S106 ("Standard outputs should not be used directly
 * to log anything") while keeping zero-dep simplicity.
 *
 * `logger.error` additionally forwards to Sentry. Routing every error
 * through this one function is what makes server-side failures visible:
 * API routes catch their errors and return a JSON 500, so nothing would
 * otherwise reach Sentry's automatic instrumentation.
 *
 * @module logger
 */

import { captureException } from "@sentry/nextjs";

/* eslint-disable no-console -- logger is the ONE place allowed to touch console */

/** @returns formatted prefix `[context]` or empty string */
function fmtCtx(context?: string): string {
  return context ? `[${context}]` : "";
}

/**
 * Finds the first `Error` among the supplied values.
 *
 * Call sites use two shapes interchangeably — `logger.error(err, ctx)` and
 * `logger.error("Unexpected error", ctx, err)` — and both must yield a real
 * stack trace in Sentry.
 *
 * @param candidates - values that may contain an `Error`
 * @returns the first `Error` found, or `undefined`
 */
function findError(candidates: readonly unknown[]): Error | undefined {
  return candidates.find((value): value is Error => value instanceof Error);
}

/**
 * Reports an error to Sentry without ever letting the reporting itself
 * break the caller — a logging call must not throw.
 *
 * @param error - the error to report
 * @param context - originating route or function, used as a Sentry tag
 * @param meta - additional values attached as Sentry extra context
 */
function reportToSentry(
  error: Error,
  context: string | undefined,
  meta: readonly unknown[]
): void {
  try {
    captureException(error, {
      tags: context ? { context } : undefined,
      extra: meta.length > 0 ? { meta } : undefined,
    });
  } catch {
    // Sentry unavailable (offline, misconfigured DSN) — the console line
    // written by the caller remains the record of the failure.
  }
}

/**
 * Application-wide logger.
 * Every module should import this instead of using `console` directly.
 */
export const logger = {
  /** Informational messages (maps to `console.info`). */
  info(message: string, context?: string, ...meta: unknown[]): void {
    console.info(fmtCtx(context), message, ...meta);
  },

  /** Non-critical warnings (maps to `console.warn`). */
  warn(message: string, context?: string, ...meta: unknown[]): void {
    console.warn(fmtCtx(context), message, ...meta);
  },

  /**
   * Errors — logged to the console and reported to Sentry.
   *
   * @param messageOrError - an `Error` (preferred, carries the stack) or a message
   * @param context - originating route or function, e.g. `"GET /api/decks"`
   * @param meta - extra values; an `Error` found here is used as the report
   */
  error(
    messageOrError: string | Error,
    context?: string,
    ...meta: unknown[]
  ): void {
    const isError = messageOrError instanceof Error;
    const message = isError ? messageOrError.message : messageOrError;

    console.error(fmtCtx(context), message, ...meta);

    const cause =
      (isError ? messageOrError : findError(meta)) ?? new Error(message);
    reportToSentry(cause, context, meta);
  },
} as const;

/* eslint-enable no-console */
