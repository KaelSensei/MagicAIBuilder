/**
 * Removes private values from the URLs that monitoring tools receive.
 *
 * Sentry and Vercel Speed Insights are third parties: the URLs they receive
 * must carry no share token, no username and no query string (I-39
 * requirement 9.3, `docs/product/specs/i39-first-run-activation-and-measurement.md`).
 * A private path segment is replaced by its route parameter name, so
 * `/share/abc123?x=1` reads `/share/[token]`.
 *
 * @module lib/telemetry/scrub-url
 */

import { DORMANT_LOCALES, SUPPORTED_LOCALES } from "@/i18n/routing";

/**
 * Routes whose dynamic segments hold a private value, written as their folder
 * path under `src/app`. A path matches a route when it starts with the route's
 * segments; deeper segments are kept.
 */
export const SCRUBBED_ROUTES = [
  "/[locale]/share/[token]",
  "/[locale]/u/[username]",
  "/api/share/[token]",
  "/api/users/[username]",
  "/api/community/users/[username]",
] as const;

/**
 * The `[locale]` folder. It is optional in a URL: English is served at the
 * root and French under `/fr` (`localePrefix: "as-needed"`, `src/i18n/routing.ts`).
 */
const LOCALE_PARAMETER = "[locale]";

/**
 * Every locale with a catalog, routed or not, so that a URL carrying a dormant
 * locale prefix is scrubbed too.
 */
const CATALOG_LOCALES: ReadonlySet<string> = new Set([
  ...SUPPORTED_LOCALES,
  ...DORMANT_LOCALES,
]);

/** Where the query string or the fragment of a URL starts. */
const QUERY_OR_FRAGMENT = /[?#]/;

/** The method a transaction or span name starts with, as in `GET /api/x`. */
const HTTP_METHOD_PREFIX = /^[A-Z]+ /;

/** A URL with a scheme and an authority, as in `https://host/path`. */
const ABSOLUTE_URL = /^[a-z][a-z\d+.-]*:\/\//i;

/**
 * Returns `url` without its query string and fragment, with every private
 * path segment replaced by its route parameter name.
 *
 * Pure and total: it reads no environment and never throws. An absolute URL
 * keeps its scheme and host; a leading HTTP method, as in a transaction name,
 * is kept. An absolute URL that cannot be parsed is returned without its query
 * string and fragment.
 *
 * @param url - A path, an absolute URL, or either one after an HTTP method,
 *   such as `/share/abc123?x=1` or `GET https://host/u/kael`.
 * @returns The scrubbed URL, such as `/share/[token]` or
 *   `GET https://host/u/[username]`.
 */
export function scrubTelemetryUrl(url: string): string {
  const method = HTTP_METHOD_PREFIX.exec(url)?.[0] ?? "";
  return method + scrubUrl(url.slice(method.length));
}

/** Scrubs a path or an absolute URL, keeping the scheme and host. */
function scrubUrl(url: string): string {
  if (!ABSOLUTE_URL.test(url)) return scrubPath(withoutQueryOrFragment(url));
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${scrubPath(parsed.pathname)}`;
  } catch {
    return withoutQueryOrFragment(url);
  }
}

/** `url` up to its query string or fragment. */
function withoutQueryOrFragment(url: string): string {
  return url.split(QUERY_OR_FRAGMENT, 1)[0] ?? "";
}

/** Replaces the private segments of `path` with their parameter names. */
function scrubPath(path: string): string {
  const segments = path.split("/");
  for (const route of SCRUBBED_ROUTES) {
    const scrubbed = matchLocalizedRoute(route.split("/"), segments);
    if (scrubbed) return scrubbed.join("/");
  }
  return path;
}

/**
 * Matches `segments` against a route whose second segment may be the optional
 * `[locale]` folder. A locale present in the path is kept as it is.
 */
function matchLocalizedRoute(
  route: readonly string[],
  segments: readonly string[]
): readonly string[] | undefined {
  if (route[1] !== LOCALE_PARAMETER) return matchRoute(route, segments);
  const unlocalizedRoute = withoutSecondSegment(route);
  const locale = segments[1] ?? "";
  if (!CATALOG_LOCALES.has(locale)) {
    return matchRoute(unlocalizedRoute, segments);
  }
  const scrubbed = matchRoute(unlocalizedRoute, withoutSecondSegment(segments));
  return scrubbed && [...scrubbed.slice(0, 1), locale, ...scrubbed.slice(1)];
}

/** `segments` without the one after the leading empty segment. */
function withoutSecondSegment(segments: readonly string[]): readonly string[] {
  return [...segments.slice(0, 1), ...segments.slice(2)];
}

/**
 * Matches `segments` against the leading segments of a route. Returns the
 * segments with each parameter replaced, or `undefined` when they differ.
 */
function matchRoute(
  route: readonly string[],
  segments: readonly string[]
): readonly string[] | undefined {
  if (segments.length < route.length) return undefined;
  const scrubbed: string[] = [];
  for (const [index, routeSegment] of route.entries()) {
    const segment = segments[index] ?? "";
    if (isParameter(routeSegment)) {
      if (segment === "") return undefined;
      scrubbed.push(routeSegment);
    } else if (segment === routeSegment) {
      scrubbed.push(segment);
    } else {
      return undefined;
    }
  }
  return [...scrubbed, ...segments.slice(route.length)];
}

/** Whether a route segment is a dynamic parameter such as `[token]`. */
function isParameter(routeSegment: string): boolean {
  return routeSegment.startsWith("[") && routeSegment.endsWith("]");
}
