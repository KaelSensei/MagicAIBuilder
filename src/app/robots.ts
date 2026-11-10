/**
 * robots.txt: the crawl directives every user agent reads.
 *
 * A `Disallow` is a request, not an access control. The pages listed here are
 * protected elsewhere (sign-in, an unguessable token); this file asks crawlers
 * that honour it not to fetch them at all.
 */
import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/seo/alternates";

/**
 * Pages that show one user's decks or cards, as locale-free path prefixes.
 * Each one is also served under a locale prefix, so robots lists it once per
 * locale (see `inEveryLocale`).
 */
const PRIVATE_PAGE_PATHS: readonly string[] = [
  // The deck editor. A signed-in user edits their own decks there; the guest
  // builder holds a draft kept in the visitor's browser.
  "/builder/",
  // The signed-in user's card collection. No trailing slash: the page itself
  // is `/collection`, which a `/collection/` rule does not match.
  "/collection",
  // `/share/<token>` is a capability URL. The sharing dialog promises
  // "anyone with this link can view your deck", and the route serving it
  // checks `shareEnabled` and never `isPublic` — so a private deck is
  // readable at its token, by design, for whoever the owner sent it to.
  // This used to be an explicit `allow`, paired with a sitemap that
  // listed every token. Both are gone.
  "/share/",
];

/**
 * Private routes outside `[locale]`, which no locale prefix reaches.
 * `/api/` answers the app's own requests with JSON, signed-in users' data
 * included; none of it is a page.
 */
const LOCALE_FREE_PRIVATE_PATHS: readonly string[] = ["/api/"];

/**
 * A path at the root and under the prefix of every routed locale.
 *
 * With `localePrefix: "as-needed"`, English answers at the root and `/en/…`
 * redirects there, while French answers only under `/fr/…`. A rule for the
 * bare path alone left `/fr/share/<token>` open to crawlers. Listing the root
 * and every prefix holds whatever the prefix mode, and a locale added to
 * `routing.locales` is covered without an edit here.
 *
 * @param path Locale-free path prefix, starting with a slash.
 * @returns The path, then the path under each locale prefix.
 */
function inEveryLocale(path: string): readonly string[] {
  return [path, ...routing.locales.map((locale) => `/${locale}${path}`)];
}

/**
 * The robots.txt Next.js serves at `/robots.txt`.
 *
 * @returns One rule group for every user agent, plus the sitemap URL.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          ...LOCALE_FREE_PRIVATE_PATHS,
          ...PRIVATE_PAGE_PATHS.flatMap(inEveryLocale),
        ],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
