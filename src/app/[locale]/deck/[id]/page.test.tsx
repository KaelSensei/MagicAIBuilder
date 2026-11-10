import { afterEach, expect, it, vi } from "vitest";

const fetchPublicDeck = vi.hoisted(() => vi.fn());
vi.mock("@/lib/deck/public-deck", () => ({ fetchPublicDeck }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/lib/auth/config", () => ({ auth: async () => null }));
vi.mock("@/components/layout/Header", () => ({ Header: () => null }));
vi.mock("@/components/profile/PublicDeckView", () => ({ PublicDeckView: () => null }));

import PublicDeckPage, { generateMetadata } from "./page";

afterEach(() => fetchPublicDeck.mockReset());

it("does not label an unavailable public deck as missing in metadata", async () => {
  fetchPublicDeck.mockRejectedValue(new Error("PUBLIC_DECK_UNAVAILABLE"));

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", id: "deck-1" }),
  });

  expect(metadata.title).toBe("Deck unavailable — MagicAIBuilder");
});

it("passes a temporary deck failure to the retryable route error boundary", async () => {
  fetchPublicDeck.mockRejectedValue(new Error("PUBLIC_DECK_UNAVAILABLE"));

  await expect(
    PublicDeckPage({ params: Promise.resolve({ locale: "en", id: "deck-1" }) })
  ).rejects.toThrow("PUBLIC_DECK_UNAVAILABLE");
});

it("keeps a missing deck as not found", async () => {
  fetchPublicDeck.mockResolvedValue(null);

  await expect(
    PublicDeckPage({ params: Promise.resolve({ locale: "en", id: "missing" }) })
  ).rejects.toThrow("NOT_FOUND");
});

// Scryfall retires the art_crop JPEG on 2027-01-01; decks saved before then
// still store it, and a link preview must not point at a dead image.
it("previews the commander with Scryfall's WebP art", async () => {
  fetchPublicDeck.mockResolvedValue({
    name: "Superfriends",
    targetBracket: 3,
    format: "commander",
    user: { name: "Totoro", username: "totoro" },
    cards: [
      {
        name: "Atraxa",
        isCommander: true,
        isPartner: false,
        artCropUri:
          "https://cards.scryfall.io/art_crop/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.jpg?1599707796",
      },
    ],
  });

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", id: "deck-1" }),
  });

  expect(metadata.openGraph?.images).toEqual([
    {
      url: "https://cards.scryfall.io/art/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.webp?1599707796",
    },
  ]);
});
