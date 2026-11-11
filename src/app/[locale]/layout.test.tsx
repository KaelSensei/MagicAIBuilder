import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

vi.mock("next/font/google", () => {
  const font = () => ({ variable: "" });
  return { Geist: font, Geist_Mono: font, Inter: font };
});
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
