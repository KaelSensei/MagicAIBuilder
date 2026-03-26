import NextAuth from "next-auth";
import { edgeAuthConfig } from "@/lib/auth/edge-config";

/**
 * Middleware using the lightweight edge-compatible auth config.
 * Authorization logic is in edgeAuthConfig.callbacks.authorized.
 */
export default NextAuth(edgeAuthConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
