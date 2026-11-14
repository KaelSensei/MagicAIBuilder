/**
 * Client-side Sentry initialisation.
 *
 * Replaces the deprecated root `sentry.client.config.ts`: Next.js 15 loads this
 * file automatically, which also lets Sentry instrument client-side navigation.
 *
 * Session Replay records only sessions in which an error occurs, with page
 * text, form inputs and media hidden (I-39 requirement 9.1). Not handled here
 * yet: removing share tokens, usernames and query strings from the URLs Sentry
 * receives (I-39 requirement 9.3).
 *
 * @module instrumentation-client
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Share of ordinary sessions Session Replay records at random: none.
 *
 * Recording a visitor who hit no error is navigation tracking, not error
 * diagnosis (I-39 requirement 9.1). Whether even error replays need consent is
 * open legal question L-13 (`docs/product/legal-questions.md`).
 */
const RANDOM_SESSION_REPLAY_RATE = 0;

/**
 * What an error replay hides from Sentry.
 *
 * `@sentry/replay` 10.78.0 already defaults all three to `true`; I-39
 * requirement 9.1 asks for them to be set explicitly, so that a changed SDK
 * default cannot start sending the text, typing or images a player sees.
 */
const ERROR_REPLAY_PRIVACY = {
  maskAllText: true,
  maskAllInputs: true,
  blockAllMedia: true,
} as const;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: RANDOM_SESSION_REPLAY_RATE,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration(ERROR_REPLAY_PRIVACY)],
});

/** Reports App Router client-side navigations as Sentry transactions. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
