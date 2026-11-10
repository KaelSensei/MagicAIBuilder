import { afterEach, expect, it, vi } from "vitest";

const fetchSharedDeck = vi.hoisted(() => vi.fn());

vi.stubGlobal("fetch", fetchSharedDeck);
vi.mock("@/components/deck/ShareDeckView", () => ({ ShareDeckView: () => null }));

import { generateMetadata } from "./page";

afterEach(() => fetchSharedDeck.mockReset());

it("tells crawlers not to retain or index a valid share link", async () => {
  fetchSharedDeck.mockResolvedValue(
    new Response(
      JSON.stringify({
        name: "Private Link Deck",
        cards: [],
        targetBracket: 2,
        format: "commander",
      }),
      { status: 200 }
    )
  );

  const metadata = await generateMetadata({
    params: Promise.resolve({ token: "private-token" }),
  });

  expect(metadata.robots).toEqual({
    index: false,
    follow: false,
    noarchive: true,
  });
});

// Scryfall retires the art_crop JPEG on 2027-01-01; decks saved before then
// still store it, and a link preview must not point at a dead image.
it("previews the commander with Scryfall's WebP art", async () => {
  const art =
    "https://cards.scryfall.io/art/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.webp?1599707796";
  fetchSharedDeck.mockResolvedValue(
    new Response(
      JSON.stringify({
        name: "Superfriends",
        targetBracket: 3,
        format: "commander",
        cards: [
          {
            name: "Atraxa",
            isCommander: true,
            isPartner: false,
            artCropUri:
              "https://cards.scryfall.io/art_crop/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.jpg?1599707796",
          },
        ],
      }),
      { status: 200 }
    )
  );

  const metadata = await generateMetadata({
    params: Promise.resolve({ token: "share-token" }),
  });

  expect(metadata.openGraph?.images).toEqual([{ url: art, alt: "Atraxa" }]);
  expect(metadata.twitter?.images).toEqual([art]);
});
