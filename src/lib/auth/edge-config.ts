import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { SUPPORTED_LOCALES } from "@/i18n/routing";

/**
 * Routes reachable without a session: auth screens, share links, and the
 * public deck / profile / community surfaces.
 */
const PUBLIC_API_AND_PAGE_PATHS: readonly string[] = [
  "/auth/signin",
  "/auth/signup",
  "/api/auth",
  "/api/health",
  "/api/import",
  "/api/share",
  "/api/community",
  "/api/deck",
  "/api/users",
  "/share",
  "/deck",
  "/u",
  "/commanders",
];

/**
 * Checks whether a pathname equals a prefix or is nested under it.
 * Segment-aware so `/deck` never matches the protected `/decks` listing.
 *
 * @param pathname Locale-stripped request pathname.
 * @param prefix Public route prefix.
 * @returns True when the pathname is the prefix or a child of it.
 */
function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Edge-compatible auth config — used by middleware only.
 * Does NOT import Prisma or bcryptjs (both are Node.js-only).
 * Credentials provider is omitted here; it runs server-side in config.ts.
 */
export const edgeAuthConfig = {
  // Explicit expiry rather than the library default: a session lives 7 days
  // and is re-issued on use once a day, so an active user stays signed in
  // while an abandoned token dies within the week.
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      if (
        process.env.PLAYWRIGHT_TEST === "1" &&
        process.env.NODE_ENV !== "production"
      ) {
        return true;
      }
      const isLoggedIn = !!session?.user;

      // Strip locale prefix so route matching works regardless of locale
      const localePattern = new RegExp(
        `^/(${SUPPORTED_LOCALES.join("|")})(?:/|$)`
      );
      const pathname = nextUrl.pathname.replace(localePattern, "/");

      // Public paths — always allow
      const isPublic =
        pathname === "/" ||
        PUBLIC_API_AND_PAGE_PATHS.some((p) => matchesPathPrefix(pathname, p));
      if (isPublic) return true;

      // Static assets — always allow
      if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
      ) {
        return true;
      }

      // Unauthenticated → redirect to sign-in (pages) or block (API)
      if (!isLoggedIn) {
        if (pathname.startsWith("/api/")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        return false; // NextAuth redirects to pages.signIn automatically
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
