import { describe, it, expect } from "vitest";
import {
  alternatesFor,
  buildAlternates,
  localePath,
  siteUrl,
} from "./alternates";

/**
 * Canonical and hreflang construction.
 *
 * Two locales are served from the same paths, English at the root and French
 * behind a prefix. Without hreflang a search engine has to guess that `/decks`
 * and `/fr/decks` are the same page in two languages; guessing wrong means one
 * of them is treated as duplicate content and dropped.
 *
 * The failure mode that matters most here is a canonical pointing somewhere
 * other than the page it sits on. A canonical is an instruction, not a hint —
 * telling Google that every deck page is really the homepage would remove the
 * whole catalogue from the index. So `localePath` is asserted path by path
 * rather than trusted to be obvious.
 */

describe("localePath", () => {
  it("serves the default locale from the root, with no prefix", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/decks")).toBe("/decks");
  });

  it("prefixes every non-default locale", () => {
    expect(localePath("fr", "/")).toBe("/fr");
    expect(localePath("fr", "/decks")).toBe("/fr/decks");
  });

  it("keeps nested paths intact", () => {
    expect(localePath("en", "/commanders/atraxa/decks")).toBe(
      "/commanders/atraxa/decks"
    );
    expect(localePath("fr", "/commanders/atraxa/decks")).toBe(
      "/fr/commanders/atraxa/decks"
    );
  });
});

describe("buildAlternates", () => {
  it("points the canonical at the page it is placed on, not at the root", () => {
    expect(buildAlternates("fr", "/decks").canonical).toBe("/fr/decks");
    expect(buildAlternates("en", "/decks").canonical).toBe("/decks");
  });

  it("lists every served locale for the same path", () => {
    const { languages } = buildAlternates("en", "/decks");

    expect(languages).toMatchObject({ en: "/decks", fr: "/fr/decks" });
  });

  it("names a default for readers whose language is neither", () => {
    const { languages } = buildAlternates("fr", "/decks");

    expect(languages?.["x-default"]).toBe("/decks");
  });

  it("does not advertise a dormant locale", () => {
    const { languages } = buildAlternates("en", "/");

    expect(Object.keys(languages ?? {}).sort()).toEqual([
      "en",
      "fr",
      "x-default",
    ]);
  });
});

describe("siteUrl", () => {
  it("returns an absolute origin usable as metadataBase", () => {
    expect(() => new URL(siteUrl())).not.toThrow();
    expect(siteUrl().startsWith("http")).toBe(true);
  });

  it("carries no trailing slash, so joined paths do not double it", () => {
    expect(siteUrl().endsWith("/")).toBe(false);
  });
});

describe("alternatesFor", () => {
  it("accepts a served locale segment", () => {
    expect(alternatesFor("fr", "/decks").canonical).toBe("/fr/decks");
  });

  it("falls back to the default rather than throwing on an unroutable segment", () => {
    // `de` has a catalog but is dormant; the middleware never routes it here.
    expect(alternatesFor("de", "/decks").canonical).toBe("/decks");
    expect(alternatesFor("nonsense", "/decks").canonical).toBe("/decks");
  });
});
