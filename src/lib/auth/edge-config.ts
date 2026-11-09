import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import {
  isPublicPagePath,
  matchesPathPrefix,
  stripLocalePrefix,
} from "./public-paths";

/**
 * API routes reachable without a session: auth itself, health, import, share
 * links and the public deck / profile / community reads. Public pages are
 * listed once, in `./public-paths`, for this callback and the middleware.
 */
const PUBLIC_API_PATH_PREFIXES: readonly string[] = [
  "/api/auth",
  "/api/health",
  "/api/import",
  "/api/share",
  "/api/community",
  "/api/deck",
  "/api/users",
];

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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
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
      const pathname = stripLocalePrefix(nextUrl.pathname);

      // Public paths — always allow
      const isPublic =
        isPublicPagePath(pathname) ||
        PUBLIC_API_PATH_PREFIXES.some((p) => matchesPathPrefix(pathname, p));
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
