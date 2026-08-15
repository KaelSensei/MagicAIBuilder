/**
 * Next.js instrumentation hook — the supported way to initialise Sentry on the
 * server and edge runtimes since @sentry/nextjs v9.
 *
 * `onRequestError` is what actually forwards App Router server errors (route
 * handlers, server components, server actions) to Sentry. Without it, nothing
 * thrown on the server is reported.
 *
 * @module instrumentation
 */

import * as Sentry from "@sentry/nextjs";

/** Loads the runtime-specific Sentry config once, at server start. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

/** Forwards server-side request errors to Sentry with full request context. */
export const onRequestError = Sentry.captureRequestError;
