/**
 * Solitary tests of the page's card image picker (master plan RR-04): which of
 * the versions Scryfall lists a tile and a zoom show, with plain card values.
 */
import { describe, expect, it } from "vitest";
import { getCardGridImageUri, getListedCardImageUri } from "./card-image";
import { aScryfallCard } from "@/test/builders/scryfall";

const CDN = "https://cards.scryfall.io";

describe("the image a grid tile shows", () => {
  it("shows the grid version of a single-faced card", () => {
    const card = aScryfallCard({
      image_uris: {
        thumb: `${CDN}/thumb/front/s/o/sol-ring.webp`,
        grid: `${CDN}/grid/front/s/o/sol-ring.webp`,
      },
    });

    expect(getCardGridImageUri(card)).toBe(
      `${CDN}/grid/front/s/o/sol-ring.webp`
    );
  });

  it("shows the front face of a double-faced card, whose images live on its faces", () => {
    const card = aScryfallCard({
      card_faces: [
        {
          name: "Delver of Secrets",
          image_uris: { grid: `${CDN}/grid/front/d/e/delver.webp` },
        },
        {
          name: "Insectile Aberration",
          image_uris: { grid: `${CDN}/grid/back/d/e/delver.webp` },
        },
      ],
    });

    expect(getCardGridImageUri(card)).toBe(`${CDN}/grid/front/d/e/delver.webp`);
  });

  it("falls back to the thumb version when that is all Scryfall lists", () => {
    const card = aScryfallCard({
      image_uris: { thumb: `${CDN}/thumb/front/s/o/sol-ring.webp` },
    });

    expect(getCardGridImageUri(card)).toBe(
      `${CDN}/thumb/front/s/o/sol-ring.webp`
    );
  });

  it("has no image for a card that lists none, so the tile shows its placeholder", () => {
    expect(getCardGridImageUri(aScryfallCard())).toBeNull();
    expect(
      getCardGridImageUri(aScryfallCard({ card_faces: [{ name: "Front" }] }))
    ).toBeNull();
  });
});

describe("one listed image version", () => {
  it("takes the card's own version before the front face's", () => {
    const card = aScryfallCard({
      image_uris: { display: `${CDN}/display/front/c/a/card.webp` },
      card_faces: [
        {
          name: "Front",
          image_uris: { display: `${CDN}/display/front/f/a/face.webp` },
        },
      ],
    });

    expect(getListedCardImageUri(card, "display")).toBe(
      `${CDN}/display/front/c/a/card.webp`
    );
  });

  it("is null when the version is listed nowhere, even if another version is", () => {
    const card = aScryfallCard({
      image_uris: { grid: `${CDN}/grid/front/c/a/card.webp` },
    });

    expect(getListedCardImageUri(card, "display")).toBeNull();
  });
});
