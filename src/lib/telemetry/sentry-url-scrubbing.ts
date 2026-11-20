/**
 * Sentry hooks that pass every URL an event carries through
 * {@link scrubTelemetryUrl} before it leaves the app (I-39 requirement 9.3).
 *
 * The client, server and edge configurations spread
 * {@link SENTRY_URL_SCRUBBING} into `Sentry.init`; the client also hands
 * {@link scrubReplayRecordingEvent} and {@link scrubReplayEvent} to Session
 * Replay. Each hook returns a scrubbed copy and drops nothing else: the same
 * events are sent, with the same sampling.
 *
 * What carries a URL, in `@sentry/nextjs` 10.78.0: the event's `request`
 * (`url`, `query_string`, the `Referer` header), its `transaction` name, the
 * `data` of its breadcrumbs, spans and trace context (`url`, `from`, `to`,
 * `http.url`, `http.query`…), and the description of request, navigation and
 * resource spans.
 *
 * @module lib/telemetry/sentry-url-scrubbing
 */

import type {
  Breadcrumb,
  BrowserOptions,
  ErrorEvent,
  Event,
  ReplayFrameEvent,
} from "@sentry/nextjs";
import { scrubTelemetryUrl } from "./scrub-url";

/**
 * The transaction event `beforeSendTransaction` receives. `@sentry/nextjs`
 * 10.78.0 does not re-export Sentry's own `TransactionEvent` type.
 */
export type TransactionEvent = Parameters<
  NonNullable<BrowserOptions["beforeSendTransaction"]>
>[0];

/** Data keys whose value is a URL or a path, in breadcrumbs and spans. */
const URL_ATTRIBUTES: ReadonlySet<string> = new Set([
  "url",
  "from",
  "to",
  "previous",
  "http.url",
  "http.target",
  "url.full",
  "url.path",
]);

/** Data keys whose value is a query string or a fragment: never sent. */
const QUERY_ATTRIBUTES: ReadonlySet<string> = new Set([
  "http.query",
  "http.fragment",
  "url.query",
  "url.fragment",
]);

/** The request header that carries the URL of the previous page. */
const REFERER_HEADER = "referer";

/**
 * Span operations whose description is a URL, possibly after an HTTP method:
 * `http.client`, `http.server`, `navigation`, `navigation.push`, `pageload`,
 * `resource.fetch`, `resource.script`… A database span's description is a
 * query and is left alone.
 */
const URL_DESCRIBED_OPERATIONS = /^(?:http\.|navigation|pageload|resource\.)/;

/** The part of a span this module reads, shared by spans and replay frames. */
interface SpanLike {
  readonly op?: string;
  readonly description?: string;
  readonly data?: object;
}

/**
 * The `beforeSend`, `beforeSendTransaction` and `beforeBreadcrumb` options
 * every runtime's `Sentry.init` spreads, so that the client, server and edge
 * scrub URLs the same way.
 */
export const SENTRY_URL_SCRUBBING = {
  beforeSend: (event: ErrorEvent): ErrorEvent => scrubEventUrls(event),
  beforeSendTransaction: (event: TransactionEvent): TransactionEvent =>
    scrubEventUrls(event),
  beforeBreadcrumb: (breadcrumb: Breadcrumb): Breadcrumb =>
    scrubBreadcrumb(breadcrumb),
} as const;

/**
 * Session Replay's `beforeAddRecordingEvent`: scrubs the URLs of the
 * breadcrumbs and spans a replay records (navigations, requests, slow clicks).
 *
 * The SDK calls it for these custom events only. The page URL that rrweb's
 * own meta event records reaches no hook in `@sentry/replay` 10.78.0.
 *
 * @param event - A recording event built by Session Replay.
 * @returns The same event with its URLs scrubbed.
 */
export function scrubReplayRecordingEvent(
  event: ReplayFrameEvent
): ReplayFrameEvent {
  const { data } = event;
  switch (data.tag) {
    case "breadcrumb":
      return {
        ...event,
        data: { ...data, payload: scrubBreadcrumb(data.payload) },
      };
    case "performanceSpan":
      return { ...event, data: { ...data, payload: scrubSpan(data.payload) } };
    case "options":
      return event;
    default:
      return assertNever(data);
  }
}

/**
 * Event processor for the `replay_event` that describes a replay: scrubs its
 * `request` and the list of pages it visited (`urls`). Other events pass
 * through unchanged; `beforeSend` and `beforeSendTransaction` handle them.
 *
 * @param event - Any event Sentry is about to send.
 * @returns The event, with its URLs scrubbed when it describes a replay.
 */
export function scrubReplayEvent(event: Event): Event {
  if (event.type !== "replay_event") return event;
  const scrubbed = scrubEventUrls(event);
  if (!("urls" in event) || !Array.isArray(event.urls)) return scrubbed;
  const withScrubbedPages = {
    ...scrubbed,
    urls: event.urls.map(scrubUnknownUrl),
  };
  return withScrubbedPages;
}

/** Scrubs the request, transaction name, breadcrumbs, spans and trace data. */
function scrubEventUrls<E extends Event>(event: E): E {
  const { request, transaction, breadcrumbs, spans, contexts } = event;
  return {
    ...event,
    request: request && {
      ...request,
      url: request.url && scrubTelemetryUrl(request.url),
      query_string: undefined,
      headers: request.headers && scrubHeaders(request.headers),
    },
    transaction: transaction && scrubTelemetryUrl(transaction),
    breadcrumbs: breadcrumbs?.map(scrubBreadcrumb),
    spans: spans?.map(scrubSpan),
    contexts: contexts && {
      ...contexts,
      trace: contexts.trace && scrubSpan(contexts.trace),
    },
  };
}

/** Scrubs the URLs in a breadcrumb's data. */
function scrubBreadcrumb<B extends { readonly data?: object }>(
  breadcrumb: B
): B {
  if (!breadcrumb.data) return breadcrumb;
  return { ...breadcrumb, data: scrubUrlAttributes(breadcrumb.data) };
}

/** Scrubs a span's data and, for a request or a page, its description. */
function scrubSpan<S extends SpanLike>(span: S): S {
  const { op, description, data } = span;
  const describesUrl = op !== undefined && URL_DESCRIBED_OPERATIONS.test(op);
  return {
    ...span,
    description:
      describesUrl && description
        ? scrubTelemetryUrl(description)
        : description,
    data: data && scrubUrlAttributes(data),
  };
}

/**
 * Copies `data`, scrubbing the values of URL keys and leaving out query
 * string and fragment keys.
 */
function scrubUrlAttributes(data: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).flatMap(([key, value]): [string, unknown][] =>
      QUERY_ATTRIBUTES.has(key) ? [] : [[key, scrubAttribute(key, value)]]
    )
  );
}

/** Scrubs `value` when `key` names a URL attribute. */
function scrubAttribute(key: string, value: unknown): unknown {
  return URL_ATTRIBUTES.has(key) ? scrubUnknownUrl(value) : value;
}

/** Scrubs `value` when it is a string; returns anything else unchanged. */
function scrubUnknownUrl(value: unknown): unknown {
  return typeof value === "string" ? scrubTelemetryUrl(value) : value;
}

/** Copies request headers, scrubbing the URL in `Referer`. */
function scrubHeaders(
  headers: Readonly<Record<string, string>>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name,
      name.toLowerCase() === REFERER_HEADER ? scrubTelemetryUrl(value) : value,
    ])
  );
}

/** Exhaustiveness guard: a new recording event tag fails to compile here. */
function assertNever(value: never): never {
  throw new Error(
    `Unexpected replay recording event: ${JSON.stringify(value)}`
  );
}
