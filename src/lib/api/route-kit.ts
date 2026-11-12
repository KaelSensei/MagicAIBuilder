/**
 * The small pieces every API route handler under `src/app/api` repeats: the
 * 429 answer of a rate limit, the error body, the failure log line, the
 * request-completed log line, and the type of the `params` argument.
 *
 * Shared kernel, next to `json-body.ts`. Each helper reproduces what the routes
 * already wrote by hand, byte for byte; it changes no answer and no log line.
 * Not responsible for: unifying the error bodies (the routes answer 400s in
 * five shapes, pinned by `src/app/api/error-body-shapes.test.ts`; B2-56 moves
 * them to one envelope), the `/api/v1` envelope (`authenticate.ts`), or the
 * rate limit itself (`src/lib/rate-limit.ts`).
 *
 * @module api/route-kit
 */

import "server-only";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * A request refused for going over a budget: what `checkRateLimit` returns
 * when `allowed` is false, or a throttled shared-cache read.
 */
export interface RateLimitDenial {
  /** Milliseconds until the budget's window reopens; positive. */
  readonly retryAfterMs: number;
}

/**
 * The text of a 429 answer: fixed, or built from the whole seconds the caller
 * must wait, the same number the `Retry-After` header carries.
 */
export type RateLimitMessage = string | ((retryAfterSeconds: number) => string);

/**
 * The `params` argument Next.js passes to a handler of a dynamic route, keyed
 * by the segment names (`[id]` gives `RouteParams<"id">`).
 *
 * Next.js 15 hands it over as a promise
 * (https://nextjs.org/docs/app/api-reference/file-conventions/route#context-optional,
 * read 2026-11-11). Each value is the raw path segment: nothing has checked
 * its length or format yet.
 */
export type RouteParams<K extends string> = {
  readonly params: Promise<Readonly<Record<K, string>>>;
};

/**
 * The line `withRequestLog` writes when a request completes.
 */
export interface RequestLogLabel {
  /** What completed, e.g. `"Profile request completed"`. */
  readonly message: string;
  /** The verb and route, e.g. `"GET /api/user/profile"`. */
  readonly context: string;
}

/**
 * The message every route failure is logged under; the error passed with it
 * carries the detail and the stack.
 */
const ROUTE_FAILURE_MESSAGE = "Unexpected error";

/**
 * The status logged when the handler throws instead of answering: Next.js
 * then answers 500 itself.
 */
const THREW_STATUS = 500;

const RETRY_AFTER = "Retry-After";

/**
 * The `Retry-After` header for a refused request, in whole seconds rounded up,
 * so a client that waits that long finds the window open again.
 *
 * Seconds are the header's delay-seconds form (RFC 9110 §10.2.3,
 * https://www.rfc-editor.org/rfc/rfc9110#field.retry-after, read 2026-11-11).
 */
export function retryAfterHeaders(
  denial: RateLimitDenial
): Record<string, string> {
  return { [RETRY_AFTER]: String(retryAfterSeconds(denial)) };
}

/**
 * A JSON error answer `{ error: message, ...extra }` with the given status.
 *
 * `extra` sits beside `error`, never inside an envelope, so a route that
 * answered `{ error, details }` by hand answers the same body through this
 * helper. It covers the `{ error: string }` shapes only; the routes that put a
 * list or a field map under `error` keep building their body until B2-56.
 *
 * @param extra - fields beside `error`, such as `details` or `code`
 */
export function jsonError(
  status: number,
  message: string,
  extra?: Readonly<Record<string, unknown>> & { readonly error?: never }
): NextResponse {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * The 429 answer of a route whose client went over its rate limit:
 * `{ error: message }` and a `Retry-After` header.
 *
 * @param message - the route's own wording, which clients may show
 */
export function rateLimitResponse(
  denial: RateLimitDenial,
  message: RateLimitMessage
): NextResponse {
  const seconds = retryAfterSeconds(denial);
  const response = jsonError(
    429,
    typeof message === "string" ? message : message(seconds)
  );
  response.headers.set(RETRY_AFTER, String(seconds));
  return response;
}

/**
 * Logs a failure a route caught before it answered 500, and reports it to
 * Sentry through `logger.error`.
 *
 * The thrown value is handed to the logger as is, so an `Error` keeps its own
 * stack in the log line and in Sentry. A message string alone would make the
 * logger invent a new `Error` whose stack points at the logger
 * (`src/lib/logger.ts`, `logger.error`); B2-12 moves the routes that still log
 * `error.message` onto this helper.
 *
 * @param error - the caught value, `Error` or not
 * @param context - the verb and route, e.g. `"GET /api/decks/:id/playtest-sessions"`
 * @param meta - extra values for the log line, never secrets or personal data
 */
export function logRouteFailure(
  error: unknown,
  context: string,
  ...meta: readonly unknown[]
): void {
  logger.error(ROUTE_FAILURE_MESSAGE, context, error, ...meta);
}

/**
 * Runs a route handler and logs one info line when it completes, with the
 * answer's status and the duration in whole milliseconds.
 *
 * The line is written whatever happens: when the handler throws, it records
 * status 500 and the error goes on to the caller unchanged.
 *
 * @param handle - the handler's work; its response is returned as is
 */
export async function withRequestLog<R extends Response>(
  label: RequestLogLabel,
  handle: () => Promise<R>
): Promise<R> {
  const startedAt = performance.now();
  let status = THREW_STATUS;
  try {
    const response = await handle();
    status = response.status;
    return response;
  } finally {
    logger.info(label.message, label.context, {
      status,
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
}

/** Whole seconds until the window reopens, rounded up. */
function retryAfterSeconds(denial: RateLimitDenial): number {
  return Math.ceil(denial.retryAfterMs / 1000);
}
