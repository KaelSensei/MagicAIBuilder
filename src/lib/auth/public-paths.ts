import { SUPPORTED_LOCALES } from "@/i18n/routing";

/**
 * The pages a visitor can open without a session — the single list the edge
 * middleware and the NextAuth `authorized` callback both read.
 *
 * Each of them used to keep its own copy. The middleware lets a page through
 * when either copy names it, so a page missing from one list still worked and
 * nothing showed that the lists disagreed. The rules pages were missing from
 * both, and every signed-out visitor and crawler was sent to sign-in.
 *
 * API routes are not listed here. The middleware matcher excludes `/api`, so
 * only the `authorized` callback has an API allowlist, and it stays there.
 *
 * Edge runtime: this module must not import Node-only code.
 */

/** A served-locale segment (`/fr`, `/fr/…`) at the start of a pathname. */
const LOCALE_PREFIX_PATTERN = new RegExp(
  `^/(${SUPPORTED_LOCALES.join("|")})(?:/|$)`
);

/** Public pages, together with every page nested under them. */
const PUBLIC_PAGE_PREFIXES: readonly string[] = [
  "/auth/signin",
  "/auth/signup",
  "/share",
  "/deck", // public deck pages — /api/deck/[id] still 404s private decks
  "/u", // public profile pages
  "/commanders", // public deck discovery by commander
  "/rules", // Game Changers, banlist and Comprehensive Rules reference pages
];

/** Public at exactly this path and nowhere below it. */
const PUBLIC_EXACT_PAGE_PATHS: ReadonlySet<string> = new Set([
  "/",
  "/builder/guest",
]);

/**
 * Removes a served-locale prefix, so `/fr/deck/1` and `/deck/1` match the same
 * rule.
 *
 * @param pathname Request pathname, with or without a locale prefix.
 * @returns The pathname without its locale prefix.
 */
export function stripLocalePrefix(pathname: string): string {
  return pathname.replace(LOCALE_PREFIX_PATTERN, "/");
}

/**
 * Checks whether a pathname equals a prefix or is nested under it.
 * Segment-aware, so `/deck` never matches the protected `/decks` listing.
 *
 * @param pathname Locale-free request pathname.
 * @param prefix Route prefix.
 * @returns True when the pathname is the prefix or a child of it.
 */
export function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Whether a page can be opened without a session.
 *
 * @param pathname Locale-free request pathname (see `stripLocalePrefix`).
 * @returns True when the page is public.
 */
export function isPublicPagePath(pathname: string): boolean {
  return (
    PUBLIC_EXACT_PAGE_PATHS.has(pathname) ||
    PUBLIC_PAGE_PREFIXES.some((prefix) => matchesPathPrefix(pathname, prefix))
  );
}
