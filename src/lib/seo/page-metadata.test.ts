import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => import("@/test/server-intl"));

import { FIXED_PAGE_NAMESPACES, fixedPageMetadata } from "./page-metadata";

/**
 * Pages whose title and description are fixed text — the rules references,
 * the collection and the settings screens — used to export one English
 * `metadata` object, so `/fr/...` carried an English title and description.
 */

function paramsFor(locale: string) {
  return { params: Promise.resolve({ locale }) };
}

describe("fixedPageMetadata", () => {
  it("titles and describes a page in English at the root", async () => {
    const generateMetadata = fixedPageMetadata("rules.comprehensive");

    expect(await generateMetadata(paramsFor("en"))).toEqual({
      title: "Comprehensive Rules — MagicAIBuilder",
      description:
        "Browse the official Magic: The Gathering Comprehensive Rules, chapter by chapter, including the full glossary.",
    });
  });

  it("titles and describes a page in French under /fr", async () => {
    const generateMetadata = fixedPageMetadata("rules.comprehensive");

    expect(await generateMetadata(paramsFor("fr"))).toEqual({
      title: "Règles complètes — MagicAIBuilder",
      description:
        "Parcourez les règles complètes officielles de Magic: The Gathering, chapitre par chapitre, glossaire compris.",
    });
  });

  it("keeps the page's other metadata, such as its robots directive", async () => {
    const generateMetadata = fixedPageMetadata("settings.apiKeys", {
      robots: { index: false, follow: false },
    });

    expect(await generateMetadata(paramsFor("fr"))).toEqual({
      title: "Clés d’API — MagicAIBuilder",
      description:
        "Créez et révoquez des clés pour l’API publique de MagicAIBuilder",
      robots: { index: false, follow: false },
    });
  });

  it("falls back to the default locale for a segment that is not routed", async () => {
    // `de` has a catalog but is dormant; the middleware never routes it here.
    const generateMetadata = fixedPageMetadata("collection");

    expect(await generateMetadata(paramsFor("de"))).toMatchObject({
      title: "My Collection — MagicAIBuilder",
    });
  });

  it.each(FIXED_PAGE_NAMESPACES)(
    "has French text of its own for %s",
    async (namespace) => {
      const generateMetadata = fixedPageMetadata(namespace);
      const english = await generateMetadata(paramsFor("en"));
      const french = await generateMetadata(paramsFor("fr"));

      expect(french.title).not.toBe(english.title);
      expect(french.description).not.toBe(english.description);
    }
  );
});
