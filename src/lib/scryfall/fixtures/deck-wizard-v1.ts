/**
 * Scryfall answers for the AI deck wizard's flow test, recorded from the live API.
 *
 * Recorded on 2026-11-11 (19:44-19:45 UTC) from https://api.scryfall.com:
 *
 * - `POST /cards/collection` with the identifiers in `WIZARD_COLLECTION_RECORDED_REQUEST`, the
 *   names a mono-blue build streams after the server's check (front-face names, as
 *   `scryfallCollectionLookupName` sends them), plus one name no card has;
 * - `GET /cards/named?fuzzy=Talrand, Sky Summoner` and `GET /cards/autocomplete?q=Talr`;
 * - `GET /cards/named?fuzzy=Zzyzx Nonexistent Card`, Scryfall's 404 body.
 *
 * Every card keeps only the fields the app's `ScryfallCard` and `ScryfallCardFace` types declare,
 * with the values Scryfall sent; `prices` keeps `usd`, `usd_foil` and `eur`, and `legalities`
 * keeps `commander` and `brawl`. Nothing else was edited.
 *
 * What the recording shows about the collection endpoint: a front-face name ("Sea Gate
 * Restoration") resolves to the whole double-faced card, named "Sea Gate Restoration // Sea
 * Gate, Reborn"; a full "Front // Back" name is reported in `not_found` (checked the same day
 * for this card and for "Delver of Secrets // Insectile Aberration").
 *
 * @module scryfall/fixtures/deck-wizard-v1
 */
import type {
  ScryfallAutocompleteResponse,
  ScryfallCard,
  ScryfallCollectionIdentifier,
  ScryfallCollectionResponse,
  ScryfallError,
} from "@/lib/scryfall/types";

/** The identifiers sent with the recorded collection request, in order. */
export const WIZARD_COLLECTION_RECORDED_REQUEST: readonly ScryfallCollectionIdentifier[] =
  [
    {
      name: "Sol Ring",
    },
    {
      name: "Island",
    },
    {
      name: "Solemn Simulacrum",
    },
    {
      name: "Sea Gate Restoration",
    },
    {
      name: "Counterspell",
    },
    {
      name: "Talrand's Grand Archive",
    },
  ];

/** Scryfall's answer to `WIZARD_COLLECTION_RECORDED_REQUEST`. */
export const WIZARD_COLLECTION_RECORDED: ScryfallCollectionResponse = {
  object: "list",
  not_found: [
    {
      name: "Talrand's Grand Archive",
    },
  ],
  data: [
    {
      id: "fc817e07-c1f3-469f-9cf7-0945dea7400f",
      oracle_id: "6ad8011d-3471-4369-9d68-b264cc027487",
      name: "Sol Ring",
      layout: "normal",
      mana_cost: "{1}",
      cmc: 1.0,
      type_line: "Artifact",
      oracle_text: "{T}: Add {C}{C}.",
      colors: [],
      color_identity: [],
      image_uris: {
        small:
          "https://cards.scryfall.io/small/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.jpg?1793021181",
        normal:
          "https://cards.scryfall.io/normal/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.jpg?1793021181",
        large:
          "https://cards.scryfall.io/large/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.jpg?1793021181",
        png: "https://cards.scryfall.io/png/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.png?1793021181",
        art_crop:
          "https://cards.scryfall.io/art_crop/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.jpg?1793021181",
        border_crop:
          "https://cards.scryfall.io/border_crop/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.jpg?1793021181",
        thumb:
          "https://cards.scryfall.io/thumb/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.webp?1793021181",
        grid: "https://cards.scryfall.io/grid/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.webp?1793021181",
        display:
          "https://cards.scryfall.io/display/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.webp?1793021181",
        art: "https://cards.scryfall.io/art/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.webp?1793021181",
        crop: "https://cards.scryfall.io/crop/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.webp?1793021181",
        jpeg: "https://cards.scryfall.io/normal/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.jpg?1793021181",
      },
      prices: {
        usd: "1.31",
        usd_foil: null,
        eur: "1.11",
      },
      legalities: {
        commander: "legal",
        brawl: "not_legal",
      },
      set: "trc",
      set_name: "Star Trek Commander",
      rarity: "uncommon",
      artist: "Hector Ortiz",
      flavor_text:
        "\"Actually, 'warp core' is a misnomer. It is technically a generator, but it's not a warp field generator. For some reason, 'deuterium/anti-deuterium intermix reactor' never caught on. Funny, right?\"\n—Lieutenant junior grade Sam Rutherford",
      keywords: [],
      lang: "en",
    },
    {
      id: "1335d293-3dd2-4f13-bd2c-22181f4528ee",
      oracle_id: "b2c6aa39-2d2a-459c-a555-fb48ba993373",
      name: "Island",
      layout: "normal",
      mana_cost: "",
      cmc: 0.0,
      type_line: "Basic Land — Island",
      oracle_text: "({T}: Add {U}.)",
      colors: [],
      color_identity: ["U"],
      image_uris: {
        small:
          "https://cards.scryfall.io/small/front/1/3/1335d293-3dd2-4f13-bd2c-22181f4528ee.jpg?1791578424",
        normal:
          "https://cards.scryfall.io/normal/front/1/3/1335d293-3dd2-4f13-bd2c-22181f4528ee.jpg?1791578424",
        large:
          "https://cards.scryfall.io/large/front/1/3/1335d293-3dd2-4f13-bd2c-22181f4528ee.jpg?1791578424",
        png: "https://cards.scryfall.io/png/front/1/3/1335d293-3dd2-4f13-bd2c-22181f4528ee.png?1791578424",
        art_crop:
          "https://cards.scryfall.io/art_crop/front/1/3/1335d293-3dd2-4f13-bd2c-22181f4528ee.jpg?1791578424",
        border_crop:
          "https://cards.scryfall.io/border_crop/front/1/3/1335d293-3dd2-4f13-bd2c-22181f4528ee.jpg?1791578424",
        thumb:
          "https://cards.scryfall.io/thumb/front/1/3/1335d293-3dd2-4f13-bd2c-22181f4528ee.webp?1791578424",
        grid: "https://cards.scryfall.io/grid/front/1/3/1335d293-3dd2-4f13-bd2c-22181f4528ee.webp?1791578424",
        display:
          "https://cards.scryfall.io/display/front/1/3/1335d293-3dd2-4f13-bd2c-22181f4528ee.webp?1791578424",
        art: "https://cards.scryfall.io/art/front/1/3/1335d293-3dd2-4f13-bd2c-22181f4528ee.webp?1791578424",
        crop: "https://cards.scryfall.io/crop/front/1/3/1335d293-3dd2-4f13-bd2c-22181f4528ee.webp?1791578424",
        jpeg: "https://cards.scryfall.io/normal/front/1/3/1335d293-3dd2-4f13-bd2c-22181f4528ee.jpg?1791578424",
      },
      prices: {
        usd: null,
        usd_foil: null,
        eur: null,
      },
      legalities: {
        commander: "legal",
        brawl: "legal",
      },
      set: "mdd",
      set_name: "Marvel: Darkhold Destiny",
      rarity: "common",
      artist: "Eren Arik",
      flavor_text:
        '"The Dream Dimension. A benevolent fountain of ideals, the source of humanity\'s collective inspiration, and the home of the muses themselves. Its wonder never ceases to amaze me."\n—Doctor Strange',
      keywords: [],
      lang: "en",
    },
    {
      id: "daafd816-f7c1-4630-9e5c-a1e5db570a35",
      oracle_id: "00c0543c-2a1f-4425-8283-4062d74a1637",
      name: "Solemn Simulacrum",
      layout: "normal",
      mana_cost: "{4}",
      cmc: 4.0,
      type_line: "Artifact Creature — Golem",
      oracle_text:
        "When this creature enters, you may search your library for a basic land card, put that card onto the battlefield tapped, then shuffle.\nWhen this creature dies, you may draw a card.",
      colors: [],
      color_identity: [],
      power: "2",
      toughness: "2",
      image_uris: {
        small:
          "https://cards.scryfall.io/small/front/d/a/daafd816-f7c1-4630-9e5c-a1e5db570a35.jpg?1783903212",
        normal:
          "https://cards.scryfall.io/normal/front/d/a/daafd816-f7c1-4630-9e5c-a1e5db570a35.jpg?1783903212",
        large:
          "https://cards.scryfall.io/large/front/d/a/daafd816-f7c1-4630-9e5c-a1e5db570a35.jpg?1783903212",
        png: "https://cards.scryfall.io/png/front/d/a/daafd816-f7c1-4630-9e5c-a1e5db570a35.png?1783903212",
        art_crop:
          "https://cards.scryfall.io/art_crop/front/d/a/daafd816-f7c1-4630-9e5c-a1e5db570a35.jpg?1783903212",
        border_crop:
          "https://cards.scryfall.io/border_crop/front/d/a/daafd816-f7c1-4630-9e5c-a1e5db570a35.jpg?1783903212",
        thumb:
          "https://cards.scryfall.io/thumb/front/d/a/daafd816-f7c1-4630-9e5c-a1e5db570a35.webp?1783903212",
        grid: "https://cards.scryfall.io/grid/front/d/a/daafd816-f7c1-4630-9e5c-a1e5db570a35.webp?1783903212",
        display:
          "https://cards.scryfall.io/display/front/d/a/daafd816-f7c1-4630-9e5c-a1e5db570a35.webp?1783903212",
        art: "https://cards.scryfall.io/art/front/d/a/daafd816-f7c1-4630-9e5c-a1e5db570a35.webp?1783903212",
        crop: "https://cards.scryfall.io/crop/front/d/a/daafd816-f7c1-4630-9e5c-a1e5db570a35.webp?1783903212",
        jpeg: "https://cards.scryfall.io/normal/front/d/a/daafd816-f7c1-4630-9e5c-a1e5db570a35.jpg?1783903212",
      },
      prices: {
        usd: "0.51",
        usd_foil: null,
        eur: "0.31",
      },
      legalities: {
        commander: "legal",
        brawl: "legal",
      },
      set: "msc",
      set_name: "Marvel Super Heroes Commander",
      rarity: "rare",
      artist: "Flavio Greco Paglia",
      keywords: [],
      lang: "en",
    },
    {
      id: "193071fe-180b-4d35-ba78-9c16675c29fc",
      oracle_id: "4a8d41fe-e04d-484b-a7d1-19be311e6ca7",
      name: "Sea Gate Restoration // Sea Gate, Reborn",
      layout: "modal_dfc",
      cmc: 7.0,
      type_line: "Sorcery // Land",
      color_identity: ["U"],
      card_faces: [
        {
          name: "Sea Gate Restoration",
          mana_cost: "{4}{U}{U}{U}",
          type_line: "Sorcery",
          oracle_text:
            "Draw cards equal to the number of cards in your hand plus one. You have no maximum hand size for the rest of the game.",
          image_uris: {
            small:
              "https://cards.scryfall.io/small/front/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.jpg?1783929396",
            normal:
              "https://cards.scryfall.io/normal/front/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.jpg?1783929396",
            large:
              "https://cards.scryfall.io/large/front/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.jpg?1783929396",
            png: "https://cards.scryfall.io/png/front/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.png?1783929396",
            art_crop:
              "https://cards.scryfall.io/art_crop/front/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.jpg?1783929396",
            border_crop:
              "https://cards.scryfall.io/border_crop/front/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.jpg?1783929396",
            thumb:
              "https://cards.scryfall.io/thumb/front/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.webp?1783929396",
            grid: "https://cards.scryfall.io/grid/front/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.webp?1783929396",
            display:
              "https://cards.scryfall.io/display/front/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.webp?1783929396",
            art: "https://cards.scryfall.io/art/front/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.webp?1783929396",
            crop: "https://cards.scryfall.io/crop/front/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.webp?1783929396",
            jpeg: "https://cards.scryfall.io/normal/front/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.jpg?1783929396",
          },
          colors: ["U"],
        },
        {
          name: "Sea Gate, Reborn",
          mana_cost: "",
          type_line: "Land",
          oracle_text:
            "As this land enters, you may pay 3 life. If you don't, it enters tapped.\n{T}: Add {U}.",
          image_uris: {
            small:
              "https://cards.scryfall.io/small/back/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.jpg?1783929396",
            normal:
              "https://cards.scryfall.io/normal/back/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.jpg?1783929396",
            large:
              "https://cards.scryfall.io/large/back/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.jpg?1783929396",
            png: "https://cards.scryfall.io/png/back/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.png?1783929396",
            art_crop:
              "https://cards.scryfall.io/art_crop/back/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.jpg?1783929396",
            border_crop:
              "https://cards.scryfall.io/border_crop/back/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.jpg?1783929396",
            thumb:
              "https://cards.scryfall.io/thumb/back/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.webp?1783929396",
            grid: "https://cards.scryfall.io/grid/back/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.webp?1783929396",
            display:
              "https://cards.scryfall.io/display/back/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.webp?1783929396",
            art: "https://cards.scryfall.io/art/back/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.webp?1783929396",
            crop: "https://cards.scryfall.io/crop/back/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.webp?1783929396",
            jpeg: "https://cards.scryfall.io/normal/back/1/9/193071fe-180b-4d35-ba78-9c16675c29fc.jpg?1783929396",
          },
          colors: [],
        },
      ],
      prices: {
        usd: "35.65",
        usd_foil: "40.31",
        eur: "27.01",
      },
      legalities: {
        commander: "legal",
        brawl: "legal",
      },
      set: "znr",
      set_name: "Zendikar Rising",
      rarity: "mythic",
      artist: "Adam Paquette",
      keywords: [],
      lang: "en",
    },
    {
      id: "4f616706-ec97-4923-bb1e-11a69fbaa1f8",
      oracle_id: "cc187110-1148-4090-bbb8-e205694a39f5",
      name: "Counterspell",
      layout: "normal",
      mana_cost: "{U}{U}",
      cmc: 2.0,
      type_line: "Instant",
      oracle_text: "Counter target spell.",
      colors: ["U"],
      color_identity: ["U"],
      image_uris: {
        small:
          "https://cards.scryfall.io/small/front/4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.jpg?1783909630",
        normal:
          "https://cards.scryfall.io/normal/front/4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.jpg?1783909630",
        large:
          "https://cards.scryfall.io/large/front/4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.jpg?1783909630",
        png: "https://cards.scryfall.io/png/front/4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.png?1783909630",
        art_crop:
          "https://cards.scryfall.io/art_crop/front/4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.jpg?1783909630",
        border_crop:
          "https://cards.scryfall.io/border_crop/front/4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.jpg?1783909630",
        thumb:
          "https://cards.scryfall.io/thumb/front/4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.webp?1783909630",
        grid: "https://cards.scryfall.io/grid/front/4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.webp?1783909630",
        display:
          "https://cards.scryfall.io/display/front/4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.webp?1783909630",
        art: "https://cards.scryfall.io/art/front/4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.webp?1783909630",
        crop: "https://cards.scryfall.io/crop/front/4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.webp?1783909630",
        jpeg: "https://cards.scryfall.io/normal/front/4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8.jpg?1783909630",
      },
      prices: {
        usd: "4.03",
        usd_foil: null,
        eur: "4.77",
      },
      legalities: {
        commander: "legal",
        brawl: "legal",
      },
      set: "dsc",
      set_name: "Duskmourn: House of Horror Commander",
      rarity: "uncommon",
      artist: "Zack Stella",
      keywords: [],
      lang: "en",
    },
  ],
};

/** Scryfall's answer to `GET /cards/named?fuzzy=Talrand, Sky Summoner`. */
export const TALRAND_NAMED_RECORDED: ScryfallCard = {
  id: "1be3ed47-072e-481a-b3d9-dc232ac4b24f",
  oracle_id: "ea1eb902-a23c-44ff-9169-19baf71de238",
  name: "Talrand, Sky Summoner",
  layout: "normal",
  mana_cost: "{2}{U}{U}",
  cmc: 4.0,
  type_line: "Legendary Creature — Merfolk Wizard",
  oracle_text:
    "Whenever you cast an instant or sorcery spell, create a 2/2 blue Drake creature token with flying.",
  colors: ["U"],
  color_identity: ["U"],
  power: "2",
  toughness: "2",
  image_uris: {
    small:
      "https://cards.scryfall.io/small/front/1/b/1be3ed47-072e-481a-b3d9-dc232ac4b24f.jpg?1783911937",
    normal:
      "https://cards.scryfall.io/normal/front/1/b/1be3ed47-072e-481a-b3d9-dc232ac4b24f.jpg?1783911937",
    large:
      "https://cards.scryfall.io/large/front/1/b/1be3ed47-072e-481a-b3d9-dc232ac4b24f.jpg?1783911937",
    png: "https://cards.scryfall.io/png/front/1/b/1be3ed47-072e-481a-b3d9-dc232ac4b24f.png?1783911937",
    art_crop:
      "https://cards.scryfall.io/art_crop/front/1/b/1be3ed47-072e-481a-b3d9-dc232ac4b24f.jpg?1783911937",
    border_crop:
      "https://cards.scryfall.io/border_crop/front/1/b/1be3ed47-072e-481a-b3d9-dc232ac4b24f.jpg?1783911937",
    thumb:
      "https://cards.scryfall.io/thumb/front/1/b/1be3ed47-072e-481a-b3d9-dc232ac4b24f.webp?1783911937",
    grid: "https://cards.scryfall.io/grid/front/1/b/1be3ed47-072e-481a-b3d9-dc232ac4b24f.webp?1783911937",
    display:
      "https://cards.scryfall.io/display/front/1/b/1be3ed47-072e-481a-b3d9-dc232ac4b24f.webp?1783911937",
    art: "https://cards.scryfall.io/art/front/1/b/1be3ed47-072e-481a-b3d9-dc232ac4b24f.webp?1783911937",
    crop: "https://cards.scryfall.io/crop/front/1/b/1be3ed47-072e-481a-b3d9-dc232ac4b24f.webp?1783911937",
    jpeg: "https://cards.scryfall.io/normal/front/1/b/1be3ed47-072e-481a-b3d9-dc232ac4b24f.jpg?1783911937",
  },
  prices: {
    usd: "1.24",
    usd_foil: null,
    eur: "0.54",
  },
  legalities: {
    commander: "legal",
    brawl: "legal",
  },
  set: "otc",
  set_name: "Outlaws of Thunder Junction Commander",
  rarity: "rare",
  artist: "Svetlin Velinov",
  flavor_text:
    '"The seas are vast, but the skies are even more so. Why be content with one kingdom when I can rule them both?"',
  keywords: [],
  lang: "en",
};

/** Scryfall's answer to `GET /cards/autocomplete?q=Talr`. */
export const TALR_AUTOCOMPLETE_RECORDED: ScryfallAutocompleteResponse = {
  object: "catalog",
  total_values: 10,
  data: [
    "Talruum Piper",
    "Talruum Champion",
    "Talruum Minotaur",
    "Talrand's Invocation",
    "Talrand, Sky Summoner",
    "Tahngarth, Talruum Hero",
    "Crystal Rod",
    "Gastal Raider",
    "Elemental Resonance",
    "Surgical Suite // Hospital Room",
  ],
};

/** Scryfall's 404 body for a fuzzy name that matches no card. */
export const NAMED_NOT_FOUND_RECORDED: ScryfallError = {
  object: "error",
  code: "not_found",
  status: 404,
  details: "No cards found matching “Zzyzx Nonexistent Card”",
};
