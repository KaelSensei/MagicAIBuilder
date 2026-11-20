/**
 * Sentry for the Node.js server runtime, loaded by `register` in
 * `src/instrumentation.ts`. Every URL an event carries is scrubbed before it
 * is sent (I-39 requirement 9.3).
 *
 * @module sentry.server.config
 */

import * as Sentry from "@sentry/nextjs";
import { SENTRY_URL_SCRUBBING } from "@/lib/telemetry/sentry-url-scrubbing";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  ...SENTRY_URL_SCRUBBING,
});
