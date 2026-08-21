import type { Metadata } from "next";
import {
  SUPPORTED_LOCALES,
  routing,
  type SupportedLocale,
} from "@/i18n/routing";

/**
 * Canonical and hreflang URLs for the two served locales.
 *
 * English is served from the root and French behind a `/fr` prefix, so the same
 * page exists at two addresses. Nothing in the app told a search engine they
 * were the same page in two languages, which leaves it free to treat one as
 * duplicate content.
 *
 * These are deliberately **not** set on the locale layout. Metadata declared on
 * a layout is inherited by every page beneath it that does not override it, so
 * a canonical there would tell Google that every deck, profile and commander
 * page is really the homepage — a worse state than declaring nothing at all.
 * Each page supplies its own path instead.
 */

/** The same fallback `robots.ts` and `sitemap.ts` use, so all three agree. */
const FALLBACK_SITE_URL = "https://magicaibuilder.com";

/**
 * Absolute origin for this deployment, without a trailing slash.
 *
 * Reads `NEXT_PUBLIC_BASE_URL` rather than `NEXT_PUBLIC_APP_URL`: the sitemap
 * and robots directives are built from the former, and a canonical that
 * disagreed with the sitemap would hand a crawler two different answers for the
 * same page.
 *
 * **Not the same thing as `resolveAppBaseUrl()` in `@/lib/api/viewer-request`,
 * and they must not be merged.** That one resolves the instance that is
 * running and falls back to `VERCEL_URL`, so on a preview deployment it is the
 * preview host — correct for fetching this app's own API, and wrong here.
 * This is the site's public identity: a canonical, an hreflang or a sitemap
 * entry pointing at a preview would advertise URLs that disappear. On a preview
 * the two are *supposed* to disagree.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  const base =
    configured === undefined || configured === ""
      ? FALLBACK_SITE_URL
      : configured;

  return base.replace(/\/+$/, "");
}

/**
 * The path a page lives at in a given locale.
 *
 * @param locale Served locale the URL is for.
 * @param path Locale-free path, starting with a slash (`/` for the home page).
 * @returns Root-relative path, prefixed for every locale except the default.
 */
export function localePath(locale: SupportedLocale, path: string): string {
  if (locale === routing.defaultLocale) return path;

  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * Canonical plus one hreflang entry per served locale, for a single page.
 *
 * @param locale Locale the page is being rendered in.
 * @param path Locale-free path, starting with a slash.
 * @returns A `Metadata["alternates"]` value; resolved against `metadataBase`.
 */
export function buildAlternates(
  locale: SupportedLocale,
  path: string
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};

  for (const served of SUPPORTED_LOCALES) {
    languages[served] = localePath(served, path);
  }

  // Dormant locales are absent on purpose: advertising a language that is not
  // routed sends a crawler to a redirect or a 404.
  languages["x-default"] = localePath(routing.defaultLocale, path);

  return {
    canonical: localePath(locale, path),
    languages,
  };
}

/** Narrows a raw route param to a served locale. */
export function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.some((supported) => supported === value);
}

/**
 * `buildAlternates` for a raw `[locale]` route param.
 *
 * Pages receive the segment as a plain string. An unrecognised value falls back
 * to the default locale rather than throwing: the middleware has already
 * rejected anything unroutable, and a metadata helper is the wrong place to
 * turn a stray param into a 500.
 *
 * @param localeParam The `[locale]` segment as the route supplies it.
 * @param path Locale-free path, starting with a slash.
 */
export function alternatesFor(
  localeParam: string,
  path: string
): NonNullable<Metadata["alternates"]> {
  return buildAlternates(
    isSupportedLocale(localeParam) ? localeParam : routing.defaultLocale,
    path
  );
}
