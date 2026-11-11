import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

/** The part of a `next/font/local` call these tests read. */
type LocalFontRequest = {
  readonly src: string | readonly { readonly path: string }[];
  readonly variable?: string;
};

/** Every font the layout asked a loader for, recorded when it loads. */
const fontLoaders = vi.hoisted(() => {
  const googleRequests: string[] = [];
  const localRequests: LocalFontRequest[] = [];
  // What a loader returns. The layout reads only `variable`.
  const loadedFont = { variable: "", className: "", style: { fontFamily: "" } };
  return { googleRequests, localRequests, loadedFont };
});

// A tripwire for Google Fonts. A call to one of the three fonts the layout
// used is recorded, and the test below names it. Any other Google font is
// missing from this mock, so importing it fails the whole file.
vi.mock(import("next/font/google"), () => {
  const font = (name: string) => () => {
    fontLoaders.googleRequests.push(name);
    return fontLoaders.loadedFont;
  };
  return {
    Geist: font("Geist"),
    Geist_Mono: font("Geist_Mono"),
    Inter: font("Inter"),
  };
});
vi.mock(import("next/font/local"), () => ({
  default: (request: LocalFontRequest) => {
    fontLoaders.localRequests.push(request);
    return fontLoaders.loadedFont;
  },
}));
vi.mock(import("@vercel/speed-insights/next"), () => ({
  SpeedInsights: () => null,
}));
vi.mock("next-intl/server", () => import("@/test/server-intl"));
vi.mock("./providers", () => ({
  Providers: ({ children }: { children: ReactNode }) => children,
}));

import { generateMetadata } from "./layout";

/**
 * The layout's title and description are what every page without its own
 * shows — the home page first among them. They were one English object, so
 * `/fr` was titled and described in English.
 */

it("titles and describes the site in English at the root", async () => {
  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en" }),
  });

  expect(metadata).toMatchObject({
    title: {
      default: "MagicAIBuilder — Commander Deck Builder",
      template: "%s | MagicAIBuilder",
    },
    description:
      "Build Commander decks with live bracket scoring, AI suggestions, and Scryfall integration.",
    openGraph: {
      title: "MagicAIBuilder — Commander Deck Builder",
      description:
        "Build Commander decks with live bracket scoring, AI suggestions, and Scryfall integration.",
    },
  });
});

it("titles and describes the site in French under /fr", async () => {
  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "fr" }),
  });

  expect(metadata).toMatchObject({
    title: {
      default: "MagicAIBuilder — Créateur de decks Commander",
      template: "%s | MagicAIBuilder",
    },
    description:
      "Créez des decks Commander avec le scoring de bracket en direct, des suggestions par IA et l’intégration de Scryfall.",
    openGraph: {
      title: "MagicAIBuilder — Créateur de decks Commander",
      description:
        "Créez des decks Commander avec le scoring de bracket en direct, des suggestions par IA et l’intégration de Scryfall.",
    },
  });
});

/**
 * `next/font/google` downloaded every font from Google Fonts during
 * `next build`. When Google answered with CSS it could not parse, the build
 * failed with "TypeError: Cannot read properties of null (reading '1')" in
 * CI and in the pre-push E2E gate (backlog row 54). The fonts are committed
 * files now, so a build reads them from disk.
 */
describe("fonts", () => {
  const layoutFolder = dirname(fileURLToPath(import.meta.url));
  const globalsCss = readFileSync(
    join(process.cwd(), "src", "styles", "globals.css"),
    "utf8"
  );

  it("asks Google Fonts for nothing, so no build depends on Google's answer", () => {
    expect(fontLoaders.googleRequests).toEqual([]);
  });

  it("loads every font from a file committed to the repository", () => {
    const paths = fontLoaders.localRequests.flatMap(({ src }) =>
      typeof src === "string" ? [src] : src.map(({ path }) => path)
    );

    expect(paths).not.toEqual([]);
    for (const path of paths) {
      expect(existsSync(join(layoutFolder, path)), path).toBe(true);
    }
  });

  it("defines every font variable the global stylesheet uses", () => {
    const used = [...globalsCss.matchAll(/var\((--font-[\w-]+)\)/g)].map(
      ([, variable]) => variable
    );
    const defined = fontLoaders.localRequests.map(({ variable }) => variable);

    expect(used).not.toEqual([]);
    expect(defined).toEqual(expect.arrayContaining(used));
  });
});
