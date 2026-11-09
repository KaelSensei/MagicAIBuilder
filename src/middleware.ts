import createIntlMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { edgeAuthConfig } from "@/lib/auth/edge-config";
import { isPublicPagePath, stripLocalePrefix } from "@/lib/auth/public-paths";
import { routing, SUPPORTED_LOCALES } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const { auth } = NextAuth(edgeAuthConfig);

/**
 * Determines whether a page can be accessed without an authenticated session.
 *
 * @param pathname Incoming request pathname.
 * @returns True when the page is public.
 */
function isPublicPage(pathname: string): boolean {
  return isPublicPagePath(stripLocalePrefix(pathname));
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
      (locale) =>
        pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
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
export default auth((req) => {
  if (isPublicPage(req.nextUrl.pathname)) return intlMiddleware(req);

  const authorizationResponse = getAuthorizationResponse(req);
  if (authorizationResponse) return authorizationResponse;

  return intlMiddleware(req);
});

export const config = {
  // Next.js statically parses matcher — rejects String.raw (TaggedTemplateExpression)
  matcher: ["/((?!_next/static|_next/image|api|favicon|og-image|.*\\..*).*)"], // NOSONAR
};
