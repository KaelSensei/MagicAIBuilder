import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES, routing } from "@/i18n/routing";
import { localePath, siteUrl } from "./alternates";

/**
 * Sitemap construction, kept separate from the route so it can be tested
 * without a database.
 *
 * **Share tokens are never emitted.** `/share/<token>` is a capability URL: the
 * token is unguessable and the sharing dialog promises "anyone with this link
 * can view your deck", which is a promise about who receives the link. The
 * route that serves it checks `shareEnabled` and never `isPublic`, so a deck
 * the owner has kept private is fully readable at its token — by design, for
 * whoever they sent it to. Publishing those tokens to search engines turned
 * "anyone with this link" into "anyone at all", for decks that were never
 * marked public. `isPublic` exists precisely to mark the ones that were.
 *
 * What belongs here instead is the surfaces the middleware already treats as
 * public and #517 gave a canonical: public decks, public profiles and commander
 * discovery. Those were all missing.
 */

/** A deck the owner marked `isPublic`. */
export interface PublicDeck {
  readonly id: string;
  readonly updatedAt: Date;
}

/** A user who has claimed a profile slug. */
export interface PublicProfile {
  readonly username: string;
  readonly updatedAt: Date;
}

/** A commander with at least one public deck. */
export interface CommanderPage {
  readonly slug: string;
  readonly updatedAt: Date;
}

export interface SitemapSources {
  readonly decks: readonly PublicDeck[];
  readonly profiles: readonly PublicProfile[];
  readonly commanders: readonly CommanderPage[];
  /** Passed in rather than read, so the output is reproducible in tests. */
  readonly now: Date;
}

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;

/**
 * One entry, with an hreflang alternate per served locale.
 *
 * The alternates mirror the `<link rel="alternate">` tags #517 puts on the
 * pages themselves. A sitemap that disagreed with the page would give a
 * crawler two answers.
 *
 * @param path Locale-free path, starting with a slash.
 */
function entryFor(
  path: string,
  lastModified: Date,
  changeFrequency: ChangeFrequency,
  priority: number
): SitemapEntry {
  const base = siteUrl();
  const languages: Record<string, string> = {};

  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = `${base}${localePath(locale, path)}`;
  }

  return {
    url: `${base}${localePath(routing.defaultLocale, path)}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  };
}

/**
 * Every URL this site wants indexed.
 *
 * @param sources Public records already read from the database.
 * @returns Sitemap entries, home page first.
 */
export function buildSitemap(sources: SitemapSources): MetadataRoute.Sitemap {
  return [
    entryFor("/", sources.now, "weekly", 1),
    ...sources.decks.map((deck) =>
      entryFor(`/deck/${deck.id}`, deck.updatedAt, "weekly", 0.7)
    ),
    ...sources.profiles.map((profile) =>
      entryFor(`/u/${profile.username}`, profile.updatedAt, "weekly", 0.6)
    ),
    ...sources.commanders.map((commander) =>
      entryFor(
        `/commanders/${commander.slug}/decks`,
        commander.updatedAt,
        "daily",
        0.8
      )
    ),
  ];
}

/**
 * Collapses decks to one entry per commander, keeping the most recent change.
 *
 * A commander page lists every public deck led by that commander, so its
 * freshness is the freshest deck on it.
 *
 * @param decks Public decks carrying a commander slug.
 */
export function collapseToCommanders(
  decks: readonly { readonly slug: string; readonly updatedAt: Date }[]
): readonly CommanderPage[] {
  const newest = new Map<string, Date>();

  for (const deck of decks) {
    const seen = newest.get(deck.slug);
    if (seen === undefined || deck.updatedAt > seen)
      newest.set(deck.slug, deck.updatedAt);
  }

  return [...newest].map(([slug, updatedAt]) => ({ slug, updatedAt }));
}
