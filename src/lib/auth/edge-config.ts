import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-compatible auth config — used by middleware only.
 * Does NOT import Prisma or bcryptjs (both are Node.js-only).
 * Credentials provider is omitted here; it runs server-side in config.ts.
 */
export const edgeAuthConfig = {
  session: { strategy: "jwt" },
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
      if (process.env.PLAYWRIGHT_TEST === "1") return true;
      const isLoggedIn = !!session?.user;
      const { pathname } = nextUrl;

      // Public paths — always allow
      const publicPaths = [
        "/auth/signin",
        "/auth/signup",
        "/api/auth",
        "/api/health",
        "/api/import",
        "/api/share",
        "/share",
      ];
      const isPublic =
        pathname === "/" || publicPaths.some((p) => pathname.startsWith(p));
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
