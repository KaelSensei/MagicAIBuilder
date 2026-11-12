import { describe, expect, it } from "vitest";
import { makeDeckCard, rebuildCardFaces } from "./store-card-faces";
import type { ScryfallCard, ScryfallImageUris } from "@/lib/scryfall/types";

const CDN = "https://cards.scryfall.io";
const SOL_RING_ID = "fc817e07-c1f3-469f-9cf7-0945dea7400f";
const DELVER_ID = "6904ea20-e504-47da-95a0-08739fdde260";

/** The image versions Scryfall listed for a face on 2026-11-10: JPEG and WebP side by side. */
function listedUris(
  id: string,
  side: "front" | "back",
  stamp: string
): ScryfallImageUris {
  const path = `${side}/${id[0]}/${id[1]}/${id}`;
  return {
    normal: `${CDN}/normal/${path}.jpg?${stamp}`,
    art_crop: `${CDN}/art_crop/${path}.jpg?${stamp}`,
    grid: `${CDN}/grid/${path}.webp?${stamp}`,
    art: `${CDN}/art/${path}.webp?${stamp}`,
    jpeg: `${CDN}/normal/${path}.jpg?${stamp}`,
  };
}

const solRing: ScryfallCard = {
  id: SOL_RING_ID,
  name: "Sol Ring",
  layout: "normal",
  mana_cost: "{1}",
  cmc: 1,
  type_line: "Artifact",
  oracle_text: "{T}: Add {C}{C}.",
  color_identity: [],
  image_uris: listedUris(SOL_RING_ID, "front", "1793021181"),
};

const delver: ScryfallCard = {
  id: DELVER_ID,
  name: "Delver of Secrets // Insectile Aberration",
  layout: "transform",
  cmc: 1,
  type_line: "Creature — Human Wizard // Creature — Human Insect",
  color_identity: ["U"],
  card_faces: [
    {
      name: "Delver of Secrets",
      mana_cost: "{U}",
      type_line: "Creature — Human Wizard",
      image_uris: listedUris(DELVER_ID, "front", "1783908173"),
    },
    {
      name: "Insectile Aberration",
      mana_cost: "",
      type_line: "Creature — Human Insect",
      image_uris: listedUris(DELVER_ID, "back", "1783908173"),
    },
  ],
};

describe("makeDeckCard images", () => {
  it("keeps the grid and art WebP Scryfall lists for a single-faced card", () => {
    const card = makeDeckCard(solRing);

    expect(card.imageUri).toBe(
      `${CDN}/grid/front/f/c/${SOL_RING_ID}.webp?1793021181`
    );
    expect(card.artCropUri).toBe(
      `${CDN}/art/front/f/c/${SOL_RING_ID}.webp?1793021181`
    );
  });

  it("keeps each face's WebP for a double-faced card", () => {
    const card = makeDeckCard(delver);

    expect(card.imageUri).toBe(
      `${CDN}/grid/front/6/9/${DELVER_ID}.webp?1783908173`
    );
    expect(card.artCropUri).toBe(
      `${CDN}/art/front/6/9/${DELVER_ID}.webp?1783908173`
    );
    expect(card.cardFaces?.[1].imageUri).toBe(
      `${CDN}/grid/back/6/9/${DELVER_ID}.webp?1783908173`
    );
    expect(card.cardFaces?.[1].artCropUri).toBe(
      `${CDN}/art/back/6/9/${DELVER_ID}.webp?1783908173`
    );
  });
});

describe("rebuildCardFaces images", () => {
  it("points the faces of a stored double-faced card at Scryfall's WebP", () => {
    const faces = rebuildCardFaces(
      DELVER_ID,
      "Delver of Secrets // Insectile Aberration",
      "Creature — Human Wizard // Creature — Human Insect",
      "{U} // ",
      ""
    );

    expect(faces?.map((face) => [face.imageUri, face.artCropUri])).toEqual([
      [
        `${CDN}/grid/front/6/9/${DELVER_ID}.webp`,
        `${CDN}/art/front/6/9/${DELVER_ID}.webp`,
      ],
      [
        `${CDN}/grid/back/6/9/${DELVER_ID}.webp`,
        `${CDN}/art/back/6/9/${DELVER_ID}.webp`,
      ],
    ]);
  });
});
