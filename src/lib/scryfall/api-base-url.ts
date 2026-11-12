/**
 * Where the server's Scryfall API requests go: `https://api.scryfall.com`, or
 * the origin `SCRYFALL_API_BASE_URL` names.
 *
 * Card catalog context. The variable exists for the E2E stack
 * (`docker-compose.e2e.yml`), which points the server at a stand-in that
 * answers from recorded fixtures (`e2e/scryfall-stand-in.ts`); nothing else
 * sets it. It is read from the process environment only, never from a
 * request, so no client can redirect the server's Scryfall traffic. The
 * browser never reads it: on-page code always addresses Scryfall itself.
 *
 * @module scryfall/api-base-url
 */

/** Scryfall's REST API origin, used whenever `SCRYFALL_API_BASE_URL` is unset. */
export const DEFAULT_SCRYFALL_API = "https://api.scryfall.com";

/** The environment variable that overrides the origin. */
export const SCRYFALL_API_BASE_URL_VARIABLE = "SCRYFALL_API_BASE_URL";

/** Parses `value` as an absolute http(s) URL with no query or fragment; null otherwise. */
function parseHttpUrl(value: string): URL | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const isHttp = url.protocol === "http:" || url.protocol === "https:";
  return isHttp && url.search === "" && url.hash === "" ? url : null;
}

/**
 * Drops every trailing slash of `href` in one pass over its tail.
 *
 * A `/\/+$/` replace backtracks from every slash of a long run that ends in
 * another character, which is quadratic (SonarCloud S8786); this scan is linear.
 */
function withoutTrailingSlashes(href: string): string {
  let end = href.length;
  while (end > 0 && href[end - 1] === "/") end -= 1;
  return href.slice(0, end);
}

/**
 * Resolves the Scryfall API origin from the variable's raw value.
 *
 * @param raw - the value of `SCRYFALL_API_BASE_URL`; undefined or blank means unset
 * @returns the origin without a trailing slash, ready for `${origin}/cards/…`
 * @throws Error when the value is not an absolute http(s) URL, so a
 *   misconfigured server fails at startup rather than at its first card lookup
 */
export function resolveScryfallApiBaseUrl(raw: string | undefined): string {
  const value = raw?.trim() ?? "";
  if (value === "") return DEFAULT_SCRYFALL_API;
  const url = parseHttpUrl(value);
  if (url === null) {
    throw new Error(
      `${SCRYFALL_API_BASE_URL_VARIABLE} must be an absolute http(s) URL without query or fragment, got "${raw}"`
    );
  }
  return withoutTrailingSlashes(url.href);
}

/**
 * The origin this runtime sends Scryfall API requests to.
 *
 * A server or Edge runtime reads `SCRYFALL_API_BASE_URL`; a browser always
 * gets {@link DEFAULT_SCRYFALL_API}, because the variable is server-side and
 * the page talks to Scryfall directly.
 *
 * @throws Error on a server whose variable is not an absolute http(s) URL
 */
export function scryfallApiBaseUrl(): string {
  if (typeof window !== "undefined") return DEFAULT_SCRYFALL_API;
  return resolveScryfallApiBaseUrl(process.env[SCRYFALL_API_BASE_URL_VARIABLE]);
}
