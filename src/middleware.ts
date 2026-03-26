import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

/** Routes that don't require authentication */
const PUBLIC_PATHS = [
  "/auth/signin",
  "/auth/signup",
  "/api/auth",
  "/api/health",
  "/api/share",
  "/share",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Unauthenticated handling
  if (!req.auth?.user) {
    // API routes: return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Page routes: redirect to sign-in
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
