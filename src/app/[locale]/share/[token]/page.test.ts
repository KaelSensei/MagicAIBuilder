import { afterEach, expect, it, vi } from "vitest";

const fetchSharedDeck = vi.hoisted(() => vi.fn());

vi.stubGlobal("fetch", fetchSharedDeck);
vi.mock("next-intl/server", () => import("@/test/server-intl"));
vi.mock("@/components/deck/ShareDeckView", () => ({
  ShareDeckView: () => null,
}));

import { shareLinkCacheTag } from "@/lib/deck/share-link-cache";
import { generateMetadata } from "./page";

/**
 * A shared deck with partner commanders and one other card. Metadata reads
 * only the fields below.
 */
const PARTNERS_DECK = {
  name: "Partners in Crime",
  targetBracket: 2,
  format: "commander",
  cards: [
    {
      name: "Thrasios, Triton Hero",
      isCommander: true,
      isPartner: false,
      artCropUri: "",
    },
    {
      name: "Tymna the Weaver",
      isCommander: true,
      isPartner: true,
      artCropUri: "",
    },
    { name: "Sol Ring", isCommander: false, isPartner: false, artCropUri: "" },
  ],
};

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
    params: Promise.resolve({ locale: "en", token: "private-token" }),
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
    params: Promise.resolve({ locale: "en", token: "share-token" }),
  });

  expect(metadata.openGraph?.images).toEqual([{ url: art, alt: "Atraxa" }]);
  expect(metadata.twitter?.images).toEqual([art]);
});

it("describes a shared deck in English", async () => {
  fetchSharedDeck.mockResolvedValue(Response.json(PARTNERS_DECK));

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", token: "private-token" }),
  });

  expect(metadata.title).toBe("Partners in Crime — MagicAIBuilder");
  expect(metadata.description).toBe(
    "Commander: Thrasios, Triton Hero + Tymna the Weaver · 3 cards · Bracket 2 · commander"
  );
  // A capability URL: no canonical, no hreflang.
  expect(metadata.alternates).toBeUndefined();
});

it("describes a shared deck in French under /fr", async () => {
  fetchSharedDeck.mockResolvedValue(Response.json(PARTNERS_DECK));

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "fr", token: "private-token" }),
  });

  expect(metadata.title).toBe("Partners in Crime — MagicAIBuilder");
  expect(metadata.description).toBe(
    "Commandant : Thrasios, Triton Hero + Tymna the Weaver · 3 cartes · Bracket 2 · commander"
  );
  expect(metadata.openGraph).toMatchObject({
    description:
      "Commandant : Thrasios, Triton Hero + Tymna the Weaver · 3 cartes · Bracket 2 · commander",
  });
});

it("says in French when a shared deck has no commander or cannot be found", async () => {
  fetchSharedDeck.mockResolvedValueOnce(
    Response.json({ ...PARTNERS_DECK, cards: [] })
  );
  const empty = await generateMetadata({
    params: Promise.resolve({ locale: "fr", token: "private-token" }),
  });

  fetchSharedDeck.mockResolvedValueOnce(new Response(null, { status: 404 }));
  const missing = await generateMetadata({
    params: Promise.resolve({ locale: "fr", token: "revoked-token" }),
  });

  expect(empty.description).toBe(
    "Commandant : Aucun commandant · 0 carte · Bracket 2 · commander"
  );
  expect(missing.title).toBe("Deck introuvable — MagicAIBuilder");
});

// The page caches the deck for a minute per token. `DELETE /api/decks/[id]/share`
// purges that token's tag, so the tag here and there must be the same one
// (OD-12: a revoked link stops working at once).
it("reads the deck under its token's cache tag, so revoking the link purges the page at once", async () => {
  fetchSharedDeck.mockResolvedValue(Response.json(PARTNERS_DECK));

  await generateMetadata({
    params: Promise.resolve({ locale: "en", token: "tagged-token" }),
  });

  expect(fetchSharedDeck).toHaveBeenCalledWith(
    expect.stringContaining("/api/share/tagged-token"),
    expect.objectContaining({
      next: expect.objectContaining({
        tags: [shareLinkCacheTag("tagged-token")],
      }),
    })
  );
});
