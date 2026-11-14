/**
 * Ends the browser's Auth.js session from a route response, for routes that
 * must sign the caller out without going through Auth.js's own sign-out form.
 *
 * Shared kernel, called by `DELETE /api/user/profile`. It mirrors Auth.js's
 * default cookie names: if `config.ts` or `edge-config.ts` ever sets
 * `cookies`, change the names here too.
 * Not responsible for other devices: they keep their token, which
 * `requireAuth` refuses once the user row is gone (#1319); revoking it on the
 * server is I-61 slice 2.
 *
 * @module auth/session-cookies
 */
import type { NextRequest, NextResponse } from "next/server";

/**
 * The prefix Auth.js 5 adds to its cookie names over HTTPS. A browser accepts
 * a `__Secure-` cookie, and its expiry, only with `Secure`; a plain-HTTP
 * browser ignores any `Secure` cookie, so the unprefixed name goes without it.
 */
const SECURE_PREFIX = "__Secure-";

/**
 * The session cookie under both names Auth.js 5 gives it: unprefixed over
 * HTTP, prefixed over HTTPS (`defaultCookies` in @auth/core 0.41.3,
 * lib/utils/cookie.js, read 2026-11-12). The route cannot tell which one the
 * deployment uses, and expiring an absent cookie changes nothing.
 */
const SESSION_COOKIE_NAMES: readonly string[] = [
  "authjs.session-token",
  `${SECURE_PREFIX}authjs.session-token`,
];

/**
 * The suffix of one piece of a session too large for a single cookie: Auth.js
 * stores it as `<name>.0`, `<name>.1`, … (`SessionStore` in the same file).
 */
const CHUNK_SUFFIX = /^\.\d+$/;

function isSessionChunk(cookieName: string): boolean {
  return SESSION_COOKIE_NAMES.some(
    (name) =>
      cookieName.startsWith(name) &&
      CHUNK_SUFFIX.test(cookieName.slice(name.length))
  );
}

/**
 * Expires the browser's Auth.js session cookie on `response`, so the next
 * request it sends carries no session: both names, and every chunk of a split
 * session that `request` carried, as Auth.js's own sign-out does.
 *
 * The expiry repeats the attributes Auth.js set the cookie with (path `/`,
 * HttpOnly, SameSite Lax): a browser only replaces a cookie whose name and
 * path match. Other cookies, such as the locale or the CSRF token, are kept.
 */
export function expireSessionCookies(
  request: NextRequest,
  response: NextResponse
): void {
  const chunks = request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter(isSessionChunk);

  for (const name of [...SESSION_COOKIE_NAMES, ...chunks]) {
    response.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: name.startsWith(SECURE_PREFIX),
    });
  }
}
