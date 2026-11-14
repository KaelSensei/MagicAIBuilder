import { describe, it, expect } from "vitest";
import { routing } from "@/i18n/routing";
import robots from "./robots";

/**
 * Crawler directives.
 *
 * `/share/<token>` used to be an explicit `allow`, paired with a sitemap that
 * listed every token. Both were removed together: the token is a capability
 * URL, and the route serving it checks `shareEnabled` and never `isPublic`, so
 * a deck the owner kept private is readable at its token — for whoever they
 * sent it to, which is the point, and not for a crawler.
 *
 * A `Disallow` is a request rather than a control, so this is a signal and not
 * a protection. It is still the signal this site means to send.
 */

const rule = () => {
  const [first] = [robots().rules].flat();
  expect(first, "robots() emits no rules").toBeDefined();
  return first;
};

/** Every value of a directive that may be one path, several, or absent. */
const directivePaths = (directive: string | string[] | undefined) =>
  directive === undefined ? [] : [directive].flat();

/** Length of the longest directive `path` starts with, or -1 when none does. */
const longestMatch = (directives: readonly string[], path: string): number =>
  Math.max(
    -1,
    ...directives
      .filter((directive) => path.startsWith(directive))
      .map((directive) => directive.length)
  );

/**
 * Whether a crawler that honours this robots.txt may fetch `path`.
 *
 * RFC 9309 §2.2.2: the most specific rule (the longest matching path) wins,
 * and `allow` wins a tie. The directives carry no `*` or `$`, so a prefix test
 * is the whole of the matching.
 */
const isCrawlable = (path: string): boolean =>
  longestMatch(directivePaths(rule()?.allow), path) >=
  longestMatch(directivePaths(rule()?.disallow), path);

/** Locale-free URLs of pages that show one user's decks or cards. */
const PRIVATE_PAGES = [
  "/share/some-token",
  "/builder/deck-1",
  "/collection",
] as const;

/** Locale-free URLs of pages meant to be found. */
const PUBLIC_PAGES = [
  "/",
  "/deck/deck-1",
  "/u/someone",
  "/commanders/atraxa/decks",
  "/rules/game-changers",
  "/api-changelog",
] as const;

/** `path` at the root and under the prefix of every routed locale. */
const inEveryLocale = (paths: readonly string[]): readonly string[] =>
  paths.flatMap((path) => [
    path,
    ...routing.locales.map((locale) =>
      path === "/" ? `/${locale}` : `/${locale}${path}`
    ),
  ]);

describe("robots", () => {
  it("keeps crawlers away from share tokens", () => {
    expect([rule()?.disallow].flat()).toContain("/share/");
  });

  it("does not advertise share tokens as allowed", () => {
    expect([rule()?.allow].flat()).not.toContain("/share/");
  });

  it("still blocks the private routes", () => {
    const disallow = [rule()?.disallow].flat();

    expect(disallow).toContain("/api/");
    expect(disallow).toContain("/builder/");
    expect(disallow).toContain("/collection");
  });

  it("lets crawlers fetch the deck image", () => {
    // X documents skipping a card image that robots.txt blocks, which is why
    // the deck image lives at /og/deck/{id} and not under the disallowed /api/.
    const disallow = [rule()?.disallow].flat();

    expect(
      disallow.filter(
        (path) => path !== undefined && "/og/deck/deck-1".startsWith(path)
      )
    ).toEqual([]);
  });

  it("points at an absolute sitemap URL", () => {
    expect(() => new URL(String(robots().sitemap))).not.toThrow();
    expect(String(robots().sitemap)).toMatch(/\/sitemap\.xml$/);
  });
});

describe("robots in every locale", () => {
  it.each(inEveryLocale(PRIVATE_PAGES))("keeps crawlers out of %s", (path) => {
    expect(isCrawlable(path)).toBe(false);
  });

  it("keeps crawlers out of the API, which has no locale prefix", () => {
    expect(isCrawlable("/api/deck/deck-1")).toBe(false);
  });

  it.each(inEveryLocale(PUBLIC_PAGES))("lets crawlers fetch %s", (path) => {
    expect(isCrawlable(path)).toBe(true);
  });
});
