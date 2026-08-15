import createIntlMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { edgeAuthConfig } from "@/lib/auth/edge-config";
import { routing, SUPPORTED_LOCALES } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const { auth } = NextAuth(edgeAuthConfig);

const LOCALE_PREFIX_PATTERN = new RegExp(
  `^/(${SUPPORTED_LOCALES.join("|")})(?:/|$)`
);

const PUBLIC_PATH_PREFIXES: readonly string[] = [
  "/auth/signin",
  "/auth/signup",
  "/share",
  "/deck", // public deck pages — /api/deck/[id] still 404s private decks
  "/u", // public profile pages
  "/commanders", // public deck discovery by commander
];

/**
 * Removes a supported locale prefix from a pathname.
 *
 * @param pathname URL pathname to normalize.
 * @returns Pathname without a locale prefix.
 */
function stripLocalePrefix(pathname: string): string {
  return pathname.replace(LOCALE_PREFIX_PATTERN, "/");
}

/**
 * Checks whether a pathname matches a route prefix exactly or as a child path.
 *
 * @param pathname Normalized pathname to test.
 * @param prefix Public route prefix.
 * @returns True when the pathname is equal to or nested under the prefix.
 */
function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Determines whether a page can be accessed without an authenticated session.
 *
 * @param pathname Incoming request pathname.
 * @returns True when the page is public.
 */
function isPublicPage(pathname: string): boolean {
  const normalizedPathname = stripLocalePrefix(pathname);

  return (
    normalizedPathname === "/" ||
    PUBLIC_PATH_PREFIXES.some((prefix) =>
      matchesPathPrefix(normalizedPathname, prefix)
    )
  );
}

/**
 * Finds the locale prefix already present in a pathname.
 *
 * @param pathname Incoming request pathname.
 * @returns The explicit locale prefix, or the default locale when absent.
 */
function getRequestLocale(pathname: string) {
  return (
    SUPPORTED_LOCALES.find(
      (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
    ) ?? routing.defaultLocale
  );
}

/**
 * Builds the sign-in redirect expected for protected pages.
 *
 * @param req Incoming protected request.
 * @returns Redirect response to the localized sign-in page.
 */
function redirectToSignIn(req: NextRequest) {
  const signInUrl = req.nextUrl.clone();
  signInUrl.pathname = `/${getRequestLocale(req.nextUrl.pathname)}/auth/signin`;
  signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);

  return NextResponse.redirect(signInUrl);
}

/**
 * Applies the project NextAuth authorization callback and converts denial to a
 * localized sign-in redirect.
 *
 * @param req Incoming request augmented by NextAuth.
 * @returns A response when access is denied or handled, otherwise undefined.
 */
function getAuthorizationResponse(req: NextAuthRequest) {
  const authorization = edgeAuthConfig.callbacks.authorized({
    auth: req.auth,
    request: req,
  });

  if (authorization instanceof Response) return authorization;
  if (authorization === false) return redirectToSignIn(req);

  return undefined;
}

/**
 * Composed middleware: public pages use next-intl directly, while protected
 * pages run through NextAuth before locale detection.
 *
 * @param req Incoming Next.js request.
 * @returns Middleware response for auth and locale handling.
 */
export default auth(async (req) => {
  if (isPublicPage(req.nextUrl.pathname)) return intlMiddleware(req);

  const authorizationResponse = getAuthorizationResponse(req);
  if (authorizationResponse) return authorizationResponse;

  return intlMiddleware(req);
});

export const config = {
  // Next.js statically parses matcher — rejects String.raw (TaggedTemplateExpression)
  matcher: ["/((?!_next/static|_next/image|api|favicon|og-image|.*\\..*).*)"], // NOSONAR
};
