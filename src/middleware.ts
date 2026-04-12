import createIntlMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { edgeAuthConfig } from "@/lib/auth/edge-config";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const { auth } = NextAuth(edgeAuthConfig);

/**
 * Composed middleware: NextAuth runs first (attaches session), then
 * next-intl handles locale detection and pathname rewriting.
 */
export default auth((req) => {
  return intlMiddleware(req);
});

export const config = {
  // Next.js statically parses matcher — rejects String.raw (TaggedTemplateExpression)
  matcher: ["/((?!_next/static|_next/image|api|favicon|og-image|.*\\..*).*)"], // NOSONAR
};
