/**
 * Centralised logger.
 *
 * Two output modes behind one call-site API:
 *
 * - **Production server**: one JSON line per event via Pino — `level`, `time`
 *   (ISO), `msg`, `context` (route or function), `meta`, and `err` with a
 *   serialised stack. This is what makes Vercel logs searchable after the
 *   fact; a console `printf` line is not. The Pino sink lives in
 *   `logger-json-sink.ts` and is loaded only on the Node runtime (see
 *   `jsonSink`), so this module can be imported from a `"use client"`
 *   component without shipping pino to the browser.
 * - **Development, the browser and the edge runtime**: the readable
 *   `[context] message` console form. JSON lines in a devtools console or a
 *   dev terminal are noise.
 *
 * `logger.error` additionally forwards to Sentry in both modes. Routing every
 * error through this one function is what makes server-side failures visible:
 * API routes catch their errors and return a JSON 500, so nothing would
 * otherwise reach Sentry's automatic instrumentation.
 *
 * @module logger
 */

import { captureException } from "@sentry/nextjs";
import { toLogPayload, type LogSink } from "./logger-sink";

export { toLogPayload, type LogPayload } from "./logger-sink";

/* eslint-disable no-console -- logger is the ONE place allowed to touch console */

/** The JSON sink, created on the first structured line and kept for the process. */
let cachedJsonSink: LogSink | undefined;

/**
 * The structured sink of this runtime, or `undefined` where console lines are
 * wanted.
 *
 * Only the Node runtime of a production build gets a sink. The condition is
 * written on `process.env.NEXT_RUNTIME`, which Next.js inlines per compile
 * target (`"nodejs"`, `"edge"`, or `""` for the browser; next 15.5.29
 * `dist/build/define-env.js:78`, read 2026-11-13), so in the client and edge
 * bundles the whole `if` body is a constant-false branch that webpack drops
 * before it records dependencies. That is what keeps pino out of the client
 * chunks: a static import, or a check on `typeof window`, which Next does not
 * inline, would pull it back in.
 *
 * @returns the JSON sink on the production Node server; `undefined` elsewhere
 */
function jsonSink(): LogSink | undefined {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production"
  ) {
    if (cachedJsonSink === undefined) {
      // A synchronous `require` is the only way to load the sink lazily while
      // keeping every `logger.*` call synchronous: an `import()` would make
      // the first lines of a cold start race the module load.
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- see above
      const sinkModule: typeof import("./logger-json-sink") = require("./logger-json-sink");
      cachedJsonSink = sinkModule.createJsonSink();
    }
    return cachedJsonSink;
  }
  return undefined;
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
    const sink = jsonSink();
    if (sink) {
      sink.info(toLogPayload(context, meta), message);
    } else {
      console.info(fmtCtx(context), message, ...meta);
    }
  },

  /** Non-critical warnings. */
  warn(message: string, context?: string, ...meta: unknown[]): void {
    const sink = jsonSink();
    if (sink) {
      sink.warn(toLogPayload(context, meta), message);
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

    const sink = jsonSink();
    if (sink) {
      sink.error(toLogPayload(context, meta, cause), message);
    } else {
      console.error(fmtCtx(context), message, ...meta);
    }

    reportToSentry(cause, context, meta);
  },
} as const;

/* eslint-enable no-console */
