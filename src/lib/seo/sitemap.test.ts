import { describe, it, expect } from "vitest";
import {
  buildSitemap,
  collapseToCommanders,
  type SitemapSources,
} from "./sitemap";

/**
 * The sitemap's two failures were opposites of each other: it published
 * something it should never have, and omitted almost everything it should.
 *
 * The first is the one worth a permanent guard. `/share/<token>` is a
 * capability URL — the sharing dialog promises "anyone with this link can view
 * your deck", and the route serving it checks `shareEnabled`, never
 * `isPublic`. Listing those tokens handed every privately-shared deck to a
 * crawler. Nothing about that is visible from the sitemap itself, which is why
 * it stood since #153.
 */

const AUGUST = new Date("2026-08-01T00:00:00Z");
const SEPTEMBER = new Date("2026-09-01T00:00:00Z");

function sources(overrides: Partial<SitemapSources> = {}): SitemapSources {
  return {
    decks: [],
    profiles: [],
    commanders: [],
    now: AUGUST,
    ...overrides,
  };
}

describe("buildSitemap", () => {
  it("never emits a share token, whatever it is given", () => {
    const entries = buildSitemap(
      sources({
        decks: [{ id: "deck-1", updatedAt: AUGUST }],
        profiles: [{ username: "kael", updatedAt: AUGUST }],
        commanders: [{ slug: "atraxa", updatedAt: AUGUST }],
      })
    );

    const everyUrl = entries.flatMap((entry) => [
      entry.url,
      ...Object.values(entry.alternates?.languages ?? {}),
    ]);

    expect(everyUrl.some((url) => String(url).includes("/share/"))).toBe(false);
  });

  it("lists the home page first", () => {
    const [first] = buildSitemap(sources());

    expect(first?.url).toMatch(/\/$/);
    expect(first?.priority).toBe(1);
  });

  it("includes public decks, profiles and commander pages", () => {
    const entries = buildSitemap(
      sources({
        decks: [{ id: "deck-1", updatedAt: AUGUST }],
        profiles: [{ username: "kael", updatedAt: AUGUST }],
        commanders: [{ slug: "atraxa", updatedAt: SEPTEMBER }],
      })
    );
    const urls = entries.map((entry) => entry.url);

    expect(urls.some((url) => url.endsWith("/deck/deck-1"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/u/kael"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/commanders/atraxa/decks"))).toBe(
      true
    );
  });

  it("carries an hreflang alternate per served locale, matching the page tags", () => {
    const [home] = buildSitemap(sources());
    const languages = home?.alternates?.languages ?? {};

    expect(Object.keys(languages).sort()).toEqual(["en", "fr"]);
    expect(String(languages.fr)).toMatch(/\/fr$/);
  });

  it("uses the unprefixed URL for the default locale", () => {
    const entries = buildSitemap(
      sources({ decks: [{ id: "d", updatedAt: AUGUST }] })
    );
    const deck = entries.find((entry) => entry.url.includes("/deck/"));

    expect(deck?.url).not.toContain("/en/");
    expect(String(deck?.alternates?.languages?.fr)).toContain("/fr/deck/d");
  });

  it("carries each record's own lastModified, not the build time", () => {
    const entries = buildSitemap(
      sources({ decks: [{ id: "d", updatedAt: SEPTEMBER }], now: AUGUST })
    );
    const deck = entries.find((entry) => entry.url.includes("/deck/"));

    expect(deck?.lastModified).toBe(SEPTEMBER);
  });
});

describe("collapseToCommanders", () => {
  it("emits one entry per commander", () => {
    const collapsed = collapseToCommanders([
      { slug: "atraxa", updatedAt: AUGUST },
      { slug: "atraxa", updatedAt: SEPTEMBER },
      { slug: "krenko", updatedAt: AUGUST },
    ]);

    expect(collapsed).toHaveLength(2);
  });

  it("keeps the freshest deck as the page's date", () => {
    const [atraxa] = collapseToCommanders([
      { slug: "atraxa", updatedAt: AUGUST },
      { slug: "atraxa", updatedAt: SEPTEMBER },
    ]);

    expect(atraxa?.updatedAt).toBe(SEPTEMBER);
  });

  it("returns nothing for no decks", () => {
    expect(collapseToCommanders([])).toEqual([]);
  });
});
