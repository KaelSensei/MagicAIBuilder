import { describe, it, expect } from "vitest";
import {
  getCardImageUri,
  getListedImageUri,
  buildScryfallImageUrl,
  normalizeScryfallImageUrl,
  CARD_BACK_URL,
} from "@/lib/scryfall/images";
import type { ScryfallCard, ScryfallImageUris } from "@/lib/scryfall/types";

/** Sol Ring as `GET /cards/named?exact=Sol+Ring` returned it on 2026-11-10. */
const SOL_RING_ID = "fc817e07-c1f3-469f-9cf7-0945dea7400f";
/** Delver of Secrets, a transform card whose images live on each face. */
const DELVER_ID = "6904ea20-e504-47da-95a0-08739fdde260";

const CDN = "https://cards.scryfall.io";

function imageUrisFor(
  id: string,
  face: "front" | "back",
  stamp: string
): ScryfallImageUris {
  const path = `${face}/${id[0]}/${id[1]}/${id}`;
  return {
    small: `${CDN}/small/${path}.jpg?${stamp}`,
    normal: `${CDN}/normal/${path}.jpg?${stamp}`,
    large: `${CDN}/large/${path}.jpg?${stamp}`,
    png: `${CDN}/png/${path}.png?${stamp}`,
    art_crop: `${CDN}/art_crop/${path}.jpg?${stamp}`,
    border_crop: `${CDN}/border_crop/${path}.jpg?${stamp}`,
    thumb: `${CDN}/thumb/${path}.webp?${stamp}`,
    grid: `${CDN}/grid/${path}.webp?${stamp}`,
    display: `${CDN}/display/${path}.webp?${stamp}`,
    art: `${CDN}/art/${path}.webp?${stamp}`,
    crop: `${CDN}/crop/${path}.webp?${stamp}`,
    jpeg: `${CDN}/normal/${path}.jpg?${stamp}`,
  };
}

/** Keeps only the JPEG-era keys, as card JSON cached before 2026-10-14 carries them. */
function legacyOnly(uris: ScryfallImageUris): ScryfallImageUris {
  const { small, normal, large, png, art_crop, border_crop } = uris;
  return { small, normal, large, png, art_crop, border_crop };
}

function makeCard(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: SOL_RING_ID,
    name: "Sol Ring",
    mana_cost: "{1}",
    cmc: 1,
    type_line: "Artifact",
    oracle_text: "",
    color_identity: [],
    colors: [],
    keywords: [],
    set: "cmd",
    set_name: "Commander",
    rarity: "uncommon",
    prices: { usd: null, usd_foil: null, eur: null },
    image_uris: imageUrisFor(SOL_RING_ID, "front", "1793021181"),
    card_faces: undefined,
    legalities: { commander: "legal" },
    ...overrides,
  };
}

function makeDelver(
  front: ScryfallImageUris | undefined,
  back: ScryfallImageUris | undefined
): ScryfallCard {
  return makeCard({
    id: DELVER_ID,
    name: "Delver of Secrets // Insectile Aberration",
    layout: "transform",
    image_uris: undefined,
    card_faces: [
      {
        name: "Delver of Secrets",
        type_line: "Creature — Human Wizard",
        image_uris: front,
      },
      {
        name: "Insectile Aberration",
        type_line: "Creature — Human Insect",
        image_uris: back,
      },
    ],
  });
}

describe("CARD_BACK_URL", () => {
  it("uses the bundled card back so hidden cards do not depend on the network", () => {
    expect(CARD_BACK_URL).toBe("/images/card-back.svg");
  });
});

describe("normalizeScryfallImageUrl", () => {
  it.each([
    ["small", "thumb"],
    ["normal", "grid"],
    ["large", "display"],
    ["border_crop", "crop"],
    ["art_crop", "art"],
  ])(
    "moves a stored %s JPEG to its %s WebP analog, keeping face and cache stamp",
    (legacy, current) => {
      expect(
        normalizeScryfallImageUrl(
          `${CDN}/${legacy}/back/6/9/${DELVER_ID}.jpg?1783908173`
        )
      ).toBe(`${CDN}/${current}/back/6/9/${DELVER_ID}.webp?1783908173`);
    }
  );

  it("moves a PNG to the largest WebP, since PNG hotlinking ends on 2027-01-01", () => {
    expect(
      normalizeScryfallImageUrl(
        `${CDN}/png/front/f/c/${SOL_RING_ID}.png?1793021181`
      )
    ).toBe(`${CDN}/display/front/f/c/${SOL_RING_ID}.webp?1793021181`);
  });

  it("moves a URL built without a cache stamp", () => {
    expect(
      normalizeScryfallImageUrl(`${CDN}/art_crop/front/f/c/${SOL_RING_ID}.jpg`)
    ).toBe(`${CDN}/art/front/f/c/${SOL_RING_ID}.webp`);
  });

  it.each([
    [
      "a current WebP URL",
      `${CDN}/grid/front/f/c/${SOL_RING_ID}.webp?1793021181`,
    ],
    ["an empty URL", ""],
    ["the bundled card back", CARD_BACK_URL],
    [
      "another host with the same path",
      `https://example.com/normal/front/f/c/${SOL_RING_ID}.jpg`,
    ],
    ["a Scryfall URL outside the card path scheme", `${CDN}/red.jpg`],
    ["an unknown face", `${CDN}/normal/side/f/c/${SOL_RING_ID}.jpg`],
    ["a mana symbol", "https://svgs.scryfall.io/card-symbols/W.svg"],
    ["text that is not a URL", "cards.scryfall.io/normal"],
  ])("leaves %s unchanged", (_label, url) => {
    expect(normalizeScryfallImageUrl(url)).toBe(url);
  });
});

describe("getListedImageUri", () => {
  it("returns the listed WebP version", () => {
    expect(
      getListedImageUri(imageUrisFor(SOL_RING_ID, "front", "1793021181"), "art")
    ).toBe(`${CDN}/art/front/f/c/${SOL_RING_ID}.webp?1793021181`);
  });

  it("maps the JPEG a version replaces when only that is listed", () => {
    const uris = legacyOnly(imageUrisFor(SOL_RING_ID, "front", "1793021181"));
    expect(getListedImageUri(uris, "display")).toBe(
      `${CDN}/display/front/f/c/${SOL_RING_ID}.webp?1793021181`
    );
  });

  it("returns nothing rather than another version when neither key is listed", () => {
    expect(
      getListedImageUri(
        { grid: `${CDN}/grid/front/f/c/${SOL_RING_ID}.webp` },
        "art"
      )
    ).toBeUndefined();
    expect(getListedImageUri(undefined, "grid")).toBeUndefined();
  });
});

describe("buildScryfallImageUrl", () => {
  it("builds the grid WebP of the front face by default", () => {
    expect(buildScryfallImageUrl(SOL_RING_ID)).toBe(
      `${CDN}/grid/front/f/c/${SOL_RING_ID}.webp`
    );
  });

  it("builds the requested WebP version of the back face", () => {
    expect(buildScryfallImageUrl(DELVER_ID, "art", "back")).toBe(
      `${CDN}/art/back/6/9/${DELVER_ID}.webp`
    );
  });
});

describe("getCardImageUri", () => {
  it("returns the grid WebP by default", () => {
    expect(getCardImageUri(makeCard())).toBe(
      `${CDN}/grid/front/f/c/${SOL_RING_ID}.webp?1793021181`
    );
  });

  it.each(["thumb", "grid", "display", "crop", "art"] as const)(
    "returns the %s WebP the API lists",
    (size) => {
      expect(getCardImageUri(makeCard(), size)).toBe(
        `${CDN}/${size}/front/f/c/${SOL_RING_ID}.webp?1793021181`
      );
    }
  );

  it.each([
    ["thumb", "small"],
    ["grid", "normal"],
    ["display", "large"],
    ["crop", "border_crop"],
    ["art", "art_crop"],
  ] as const)(
    "derives the %s WebP from the %s JPEG of a card cached before WebP existed",
    (size, legacy) => {
      const card = makeCard({
        image_uris: {
          [legacy]: `${CDN}/${legacy}/front/f/c/${SOL_RING_ID}.jpg?1793021181`,
        },
      });
      expect(getCardImageUri(card, size)).toBe(
        `${CDN}/${size}/front/f/c/${SOL_RING_ID}.webp?1793021181`
      );
    }
  );

  it("falls back to the card's JPEG when the requested version is missing", () => {
    const card = makeCard({
      image_uris: { jpeg: "https://example.com/card.jpg" },
    });
    expect(getCardImageUri(card, "art")).toBe("https://example.com/card.jpg");
  });

  it("reads each face of a double-faced card", () => {
    const card = makeDelver(
      imageUrisFor(DELVER_ID, "front", "1783908173"),
      imageUrisFor(DELVER_ID, "back", "1783908173")
    );
    expect(getCardImageUri(card, "grid", "front")).toBe(
      `${CDN}/grid/front/6/9/${DELVER_ID}.webp?1783908173`
    );
    expect(getCardImageUri(card, "art", "back")).toBe(
      `${CDN}/art/back/6/9/${DELVER_ID}.webp?1783908173`
    );
  });

  it("derives a face's WebP from its cached JPEG", () => {
    const card = makeDelver(
      legacyOnly(imageUrisFor(DELVER_ID, "front", "1783908173")),
      legacyOnly(imageUrisFor(DELVER_ID, "back", "1783908173"))
    );
    expect(getCardImageUri(card, "art", "back")).toBe(
      `${CDN}/art/back/6/9/${DELVER_ID}.webp?1783908173`
    );
  });

  it("falls back to the front face when the back face has no images", () => {
    const card = makeDelver(
      imageUrisFor(DELVER_ID, "front", "1783908173"),
      undefined
    );
    expect(getCardImageUri(card, "grid", "back")).toBe(
      `${CDN}/grid/front/6/9/${DELVER_ID}.webp?1783908173`
    );
  });

  it("builds the WebP from the card id when Scryfall sends no images", () => {
    const card = makeCard({ image_uris: undefined, card_faces: undefined });
    expect(getCardImageUri(card, "art")).toBe(
      `${CDN}/art/front/f/c/${SOL_RING_ID}.webp`
    );
  });
});
