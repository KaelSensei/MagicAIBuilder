/** Where a sign-in or sign-up lands when no usable `callbackUrl` was given. */
export const DEFAULT_CALLBACK_URL = "/decks";

/**
 * A base no real page can have. Parsing against it tells a path on this site
 * (same origin as the base) from anything that names another host.
 *
 * It is only a parse base and is never fetched. `https` and `http` are both
 * special schemes, so the URL parser reads a path the same way against either
 * (both read `\` as `/`); `https` keeps an insecure URL out of the code.
 */
const PROBE_ORIGIN = "https://callback.invalid";

/**
 * Reduces a `callbackUrl` to a path on this site, or the deck list.
 *
 * The auth forms navigate to the result with `location.href` once the session
 * exists, so a foreign URL here is an open redirect and a `javascript:` URL is
 * script execution. Only a path that starts with one `/` is kept, and only
 * after the URL parser agrees: browsers read `/\evil.com` and `/<tab>/evil.com`
 * as `//evil.com`, and dot segments can collapse into `//` (`/.//evil.com`),
 * so the raw text alone cannot be trusted. Absolute URLs are refused even when
 * they name this site; the middleware sends a path.
 *
 * @param raw - the `callbackUrl` query parameter, or null when absent
 * @returns a normalised same-origin path, or {@link DEFAULT_CALLBACK_URL}
 */
export function sanitizeCallbackUrl(raw: string | null): string {
  if (!raw?.startsWith("/")) return DEFAULT_CALLBACK_URL;

  let parsed: URL;
  try {
    parsed = new URL(raw, PROBE_ORIGIN);
  } catch {
    return DEFAULT_CALLBACK_URL;
  }

  if (parsed.origin !== PROBE_ORIGIN) return DEFAULT_CALLBACK_URL;
  if (parsed.pathname.startsWith("//")) return DEFAULT_CALLBACK_URL;

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

/**
 * Links one auth page to the other without losing where the visitor was going.
 *
 * @param page - the auth page to link to, such as `/auth/signin`
 * @param callbackUrl - an already sanitised callback path
 * @returns the page, carrying the callback unless it is the default
 */
export function authPageHref(page: string, callbackUrl: string): string {
  if (callbackUrl === DEFAULT_CALLBACK_URL) return page;
  return `${page}?${new URLSearchParams({ callbackUrl })}`;
}
