import { describe, expect, it } from "vitest";
import { RECORDED_CATALOG_CARDS as RECORDED } from "./fixtures/catalog-cards-v1";
import { toCatalogCard } from "./to-catalog-card";

const IMAGE_HOST = "https://cards.scryfall.io";

/** The card a recorded body maps to; fails the test when the mapper refuses it. */
function mapped(json: unknown) {
  const result = toCatalogCard(json);
  if (!result.ok) throw new Error(`refused: ${result.reason}`);
  return result.card;
}

describe("toCatalogCard", () => {
  it("translates a single-faced creature into the product's camelCase card", () => {
    const id = "6a0b230b-d391-4998-a3f7-7b158a0ec2cd";
    const webp = (size: string) =>
      `${IMAGE_HOST}/${size}/front/6/a/${id}.webp?1783909057`;

    expect(mapped(RECORDED.normal)).toEqual({
      id,
      oracleId: "68954295-54e3-4303-a6bc-fc4547a4e3a3",
      name: "Llanowar Elves",
      layout: "normal",
      lang: "en",
      manaCost: "{G}",
      manaValue: 1,
      typeLine: "Creature — Elf Druid",
      oracleText: "{T}: Add {G}.",
      colorIdentity: ["G"],
      power: "1",
      toughness: "1",
      keywords: [],
      legalities: { commander: "legal", brawl: "legal" },
      priceUsd: 0.28,
      setCode: "fdn",
      setName: "Foundations",
      images: {
        thumb: webp("thumb"),
        grid: webp("grid"),
        display: webp("display"),
        crop: webp("crop"),
        art: webp("art"),
      },
      faces: [],
      printedName: null,
      printedTypeLine: null,
      printedText: null,
    });
  });

  it("keeps a double-faced card's mana cost, text, stats and images on its faces", () => {
    const card = mapped(RECORDED.transform);

    expect(card).toMatchObject({
      name: "Delver of Secrets // Insectile Aberration",
      layout: "transform",
      manaCost: null,
      manaValue: 1,
      typeLine: "Creature — Human Wizard // Creature — Human Insect",
      oracleText: null,
      power: null,
      toughness: null,
      keywords: ["Flying", "Transform"],
      images: null,
    });
    expect(
      card.faces.map((face) => [
        face.name,
        face.manaCost,
        face.power,
        face.toughness,
      ])
    ).toEqual([
      ["Delver of Secrets", "{U}", "1", "1"],
      ["Insectile Aberration", "", "3", "2"],
    ]);
    expect(card.faces.map((face) => face.images?.grid)).toEqual([
      expect.stringMatching(
        /^https:\/\/cards\.scryfall\.io\/grid\/front\/.+\.webp/
      ),
      expect.stringMatching(
        /^https:\/\/cards\.scryfall\.io\/grid\/back\/.+\.webp/
      ),
    ]);
  });

  it("keeps a modal double-faced card's land back, whose mana cost is empty", () => {
    const card = mapped(RECORDED.modalDoubleFaced);

    expect(card).toMatchObject({
      layout: "modal_dfc",
      manaCost: null,
      typeLine: "Instant // Land",
    });
    expect(
      card.faces.map((face) => [face.name, face.manaCost, face.typeLine])
    ).toEqual([
      ["Valakut Awakening", "{2}{R}", "Instant"],
      ["Valakut Stoneforge", "", "Land"],
    ]);
  });

  it("keeps a split card's combined mana cost on the card and each half's text on its face", () => {
    const card = mapped(RECORDED.split);

    expect(card).toMatchObject({
      name: "Fire // Ice",
      manaCost: "{1}{R} // {1}{U}",
      manaValue: 4,
      oracleText: null,
      images: { grid: expect.stringContaining("/grid/front/") },
    });
    expect(
      card.faces.map((face) => [face.name, face.manaCost, face.images])
    ).toEqual([
      ["Fire", "{1}{R}", null],
      ["Ice", "{1}{U}", null],
    ]);
  });

  it("keeps an adventurer card's creature stats on the card and its adventure as the second face", () => {
    const card = mapped(RECORDED.adventure);

    expect(card).toMatchObject({
      power: "4",
      toughness: "3",
      oracleText: null,
    });
    expect(
      card.faces.map((face) => [face.name, face.typeLine, face.power])
    ).toEqual([
      ["Bonecrusher Giant", "Creature — Giant", "4"],
      ["Stomp", "Instant — Adventure", null],
    ]);
  });

  it("maps a token, with its empty colour identity and its not-legal status", () => {
    expect(mapped(RECORDED.token)).toMatchObject({
      name: "Treasure",
      layout: "token",
      typeLine: "Token Artifact — Treasure",
      colorIdentity: [],
      legalities: { commander: "not_legal" },
    });
  });

  it("has no price when Scryfall has none for the printing", () => {
    expect(mapped(RECORDED.noPrices).priceUsd).toBeNull();
  });

  it("maps a Universes Beyond card like any other", () => {
    expect(mapped(RECORDED.universesBeyond)).toMatchObject({
      name: "Gandalf the Grey",
      setCode: "ltr",
      colorIdentity: ["R", "U"],
      priceUsd: 0.53,
    });
  });

  it("keeps a basic land's empty mana cost as an empty string, not as absent", () => {
    expect(mapped(RECORDED.basicLand)).toMatchObject({
      typeLine: "Basic Land — Forest",
      manaCost: "",
      manaValue: 0,
      power: null,
    });
  });

  it("keeps a snow basic's type line verbatim, supertypes in Scryfall's order", () => {
    // CR 205.4c makes it basic by its supertype; deciding that is the rules' job, not the mapper's.
    expect(mapped(RECORDED.snowBasicLand).typeLine).toBe(
      "Basic Snow Land — Forest"
    );
  });

  it("keeps a localised printing's language and printed text beside the English Oracle text", () => {
    expect(mapped(RECORDED.localized)).toMatchObject({
      lang: "fr",
      name: "Llanowar Elves",
      oracleText: "{T}: Add {G}.",
      printedName: "Elfes de Llanowar",
      printedTypeLine: "Créature — elfe et druide",
      printedText: "{T} : Ajoutez {G}.",
    });
  });

  it("maps a reversible card, whose rules fields Scryfall keeps on its faces only", () => {
    const card = mapped(RECORDED.reversible);

    expect(card).toMatchObject({
      layout: "reversible_card",
      oracleId: null,
      manaCost: null,
      manaValue: null,
      typeLine: null,
      images: null,
    });
    expect(card.faces.map((face) => face.typeLine)).toEqual([
      "Artifact",
      "Artifact",
    ]);
  });

  it("leaves out a legality status it does not know, and keeps the card and the other formats", () => {
    const card = mapped({
      ...RECORDED.normal,
      legalities: { commander: "legal", brawl: "suspended" },
    });

    expect(card.legalities).toEqual({ commander: "legal" });
  });

  it("maps the JPEG-era image keys of card JSON cached before Scryfall served WebP", () => {
    const id = "6a0b230b-d391-4998-a3f7-7b158a0ec2cd";
    const jpeg = (version: string) =>
      `${IMAGE_HOST}/${version}/front/6/a/${id}.jpg?1783909057`;

    const card = mapped({
      ...RECORDED.normal,
      image_uris: {
        small: jpeg("small"),
        normal: jpeg("normal"),
        large: jpeg("large"),
        art_crop: jpeg("art_crop"),
        border_crop: jpeg("border_crop"),
      },
    });

    expect(card.images).toEqual({
      thumb: `${IMAGE_HOST}/thumb/front/6/a/${id}.webp?1783909057`,
      grid: `${IMAGE_HOST}/grid/front/6/a/${id}.webp?1783909057`,
      display: `${IMAGE_HOST}/display/front/6/a/${id}.webp?1783909057`,
      crop: `${IMAGE_HOST}/crop/front/6/a/${id}.webp?1783909057`,
      art: `${IMAGE_HOST}/art/front/6/a/${id}.webp?1783909057`,
    });
  });

  it("has no price when Scryfall's price is not a number", () => {
    const card = mapped({ ...RECORDED.normal, prices: { usd: "n/a" } });

    expect(card.priceUsd).toBeNull();
  });

  it("refuses Scryfall's error body, naming the fields a card must have", () => {
    const result = toCatalogCard({
      object: "error",
      code: "not_found",
      status: 404,
      details: "No cards found matching \u201cZzyzx\u201d",
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.reason).toMatch(/^id: .*; name: /);
  });

  it("refuses a colour identity outside the five colours", () => {
    const result = toCatalogCard({
      ...RECORDED.normal,
      color_identity: ["G", "C"],
    });

    expect(result).toEqual({
      ok: false,
      reason: expect.stringContaining("color_identity.1"),
    });
  });

  it.each([null, "Llanowar Elves", 42, []])(
    "refuses %j, which is not a card object",
    (json) => {
      expect(toCatalogCard(json).ok).toBe(false);
    }
  );
});
