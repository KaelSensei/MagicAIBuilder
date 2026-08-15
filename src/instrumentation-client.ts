/**
 * Client-side Sentry initialisation.
 *
 * Replaces the deprecated root `sentry.client.config.ts`: Next.js 15 loads this
 * file automatically, which also lets Sentry instrument client-side navigation.
 *
 * @module instrumentation-client
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
});

/** Reports App Router client-side navigations as Sentry transactions. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
