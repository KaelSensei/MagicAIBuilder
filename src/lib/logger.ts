/**
 * Centralised logger.
 *
 * Two output modes behind one call-site API:
 *
 * - **Production server**: one JSON line per event via Pino — `level`, `time`
 *   (ISO), `msg`, `context` (route or function), `meta`, and `err` with a
 *   serialised stack. This is what makes Vercel logs searchable after the
 *   fact; a console `printf` line is not.
 * - **Development and the browser**: the readable `[context] message` console
 *   form. JSON lines in a devtools console or a dev terminal are noise.
 *
 * `logger.error` additionally forwards to Sentry in both modes. Routing every
 * error through this one function is what makes server-side failures visible:
 * API routes catch their errors and return a JSON 500, so nothing would
 * otherwise reach Sentry's automatic instrumentation.
 *
 * @module logger
 */

import pino from "pino";
import { captureException } from "@sentry/nextjs";

/* eslint-disable no-console -- logger is the ONE place allowed to touch console */

/** Everything that rides alongside `level` / `time` / `msg` on a JSON line. */
export interface LogPayload {
  readonly context?: string;
  readonly meta?: readonly unknown[];
  readonly err?: Error;
}

/**
 * Builds the structured payload for one log event.
 *
 * Keys with nothing to say are omitted rather than emitted empty, and an
 * `Error` promoted to `err` (the key Pino's serialiser reads stacks from) is
 * removed from `meta` so it is not serialised twice.
 *
 * @param context - originating route or function, e.g. `"GET /api/decks"`
 * @param meta - extra values passed by the call site
 * @param err - the error being reported, if any
 * @returns the payload object, possibly empty
 */
export function toLogPayload(
  context: string | undefined,
  meta: readonly unknown[],
  err?: Error
): LogPayload {
  const rest = err === undefined ? meta : meta.filter((value) => value !== err);
  return {
    ...(context !== undefined && { context }),
    ...(rest.length > 0 && { meta: rest }),
    ...(err !== undefined && { err }),
  };
}

/** JSON logger for the production server — never used in the browser. */
const jsonLogger = pino({
  timestamp: pino.stdTimeFunctions.isoTime,
  // pid/hostname say nothing on serverless — every invocation differs.
  base: undefined,
  formatters: { level: (label) => ({ level: label }) },
  serializers: { err: pino.stdSerializers.err },
});

/** @returns whether events should be emitted as JSON lines */
function emitsJson(): boolean {
  return typeof window === "undefined" && process.env.NODE_ENV === "production";
}

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
    // Sentry unavailable (offline, misconfigured DSN) — the line written by
    // the caller remains the record of the failure.
  }
}

/**
 * Application-wide logger.
 * Every module should import this instead of using `console` directly.
 */
export const logger = {
  /** Informational messages. */
  info(message: string, context?: string, ...meta: unknown[]): void {
    if (emitsJson()) {
      jsonLogger.info(toLogPayload(context, meta), message);
    } else {
      console.info(fmtCtx(context), message, ...meta);
    }
  },

  /** Non-critical warnings. */
  warn(message: string, context?: string, ...meta: unknown[]): void {
    if (emitsJson()) {
      jsonLogger.warn(toLogPayload(context, meta), message);
    } else {
      console.warn(fmtCtx(context), message, ...meta);
    }
  },

  /**
   * Errors — logged and reported to Sentry.
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
    const cause =
      (isError ? messageOrError : findError(meta)) ?? new Error(message);

    if (emitsJson()) {
      jsonLogger.error(toLogPayload(context, meta, cause), message);
    } else {
      console.error(fmtCtx(context), message, ...meta);
    }

    reportToSentry(cause, context, meta);
  },
} as const;

/* eslint-enable no-console */
