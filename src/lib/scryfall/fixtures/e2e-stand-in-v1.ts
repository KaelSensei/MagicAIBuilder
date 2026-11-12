/**
 * Scryfall answers the E2E stand-in needs beyond the other recorded fixtures, recorded from
 * the live API.
 *
 * Recorded on 2026-11-12 (18:55 UTC) from https://api.scryfall.com with the app's User-Agent:
 *
 * - `GET /cards/named?exact=Lightning Bolt`: the card the search spec types, which no other
 *   fixture holds;
 * - `GET /cards/search?q=!"Grizzly Bears" game:paper&unique=prints&order=released&dir=desc`,
 *   the request `searchCardPrintings` sends: Scryfall listed 24 printings, and the two kept
 *   are the newest (The Zeta Set) and the Tenth Edition one, so the printing selector of the
 *   printing-swap spec has a choice;
 * - `GET /cards/search?q=zzzzznosuchcardzzzzz`: Scryfall's 404 body for a valid query that
 *   matches no card;
 * - `GET /cards/00000000-0000-4000-8000-000000000601` (19:00 UTC): Scryfall's 404 body for a
 *   printing id it does not hold, which is what a spec's stub id gets.
 *
 * Every card keeps only the fields the app's `ScryfallCard` type declares, with the values and
 * key order Scryfall sent; `prices` keeps `usd`, `usd_foil` and `eur`, and `legalities` keeps
 * `commander` and `brawl`. Nothing else was edited.
 *
 * @module scryfall/fixtures/e2e-stand-in-v1
 */
import type { ScryfallCard, ScryfallError } from "@/lib/scryfall/types";

/** Lightning Bolt, the printing `GET /cards/named?exact=` answered. */
export const LIGHTNING_BOLT_NAMED_RECORDED: ScryfallCard = {
  id: "7673784e-db4b-43a1-8d55-1bb9fc1e284f",
  oracle_id: "4457ed35-7c10-48c8-9776-456485fdf070",
  name: "Lightning Bolt",
  lang: "en",
  layout: "normal",
  image_uris: {
    small:
      "https://cards.scryfall.io/small/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.jpg?1783903008",
    normal:
      "https://cards.scryfall.io/normal/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.jpg?1783903008",
    large:
      "https://cards.scryfall.io/large/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.jpg?1783903008",
    png: "https://cards.scryfall.io/png/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.png?1783903008",
    art_crop:
      "https://cards.scryfall.io/art_crop/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.jpg?1783903008",
    border_crop:
      "https://cards.scryfall.io/border_crop/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.jpg?1783903008",
    thumb:
      "https://cards.scryfall.io/thumb/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.webp?1783903008",
    grid: "https://cards.scryfall.io/grid/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.webp?1783903008",
    display:
      "https://cards.scryfall.io/display/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.webp?1783903008",
    art: "https://cards.scryfall.io/art/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.webp?1783903008",
    crop: "https://cards.scryfall.io/crop/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.webp?1783903008",
    jpeg: "https://cards.scryfall.io/normal/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.jpg?1783903008",
  },
  mana_cost: "{R}",
  cmc: 1,
  type_line: "Instant",
  oracle_text: "Lightning Bolt deals 3 damage to any target.",
  colors: ["R"],
  color_identity: ["R"],
  keywords: [],
  legalities: {
    commander: "legal",
    brawl: "legal",
  },
  set: "msc",
  set_name: "Marvel Super Heroes Commander",
  rarity: "uncommon",
  flavor_text:
    '"I am the god of thunder, the lord of the savage lightning, and the very skies must tremble when speaks The Mighty Thor!"',
  artist: "Milivoj Ćeran",
  prices: {
    usd: "1.14",
    usd_foil: "2.80",
    eur: "2.07",
  },
};

/** Two of the 24 paper printings of Grizzly Bears, newest first, as the printings search lists them. */
export const GRIZZLY_BEARS_PRINTINGS_RECORDED: readonly ScryfallCard[] = [
  {
    id: "6090e321-94c3-4755-b01e-121ea1828fbd",
    oracle_id: "14c8f55d-d177-4c25-a931-ebeb9e6062a0",
    name: "Grizzly Bears",
    lang: "en",
    layout: "normal",
    image_uris: {
      small:
        "https://cards.scryfall.io/small/front/6/0/6090e321-94c3-4755-b01e-121ea1828fbd.jpg?1787745793",
      normal:
        "https://cards.scryfall.io/normal/front/6/0/6090e321-94c3-4755-b01e-121ea1828fbd.jpg?1787745793",
      large:
        "https://cards.scryfall.io/large/front/6/0/6090e321-94c3-4755-b01e-121ea1828fbd.jpg?1787745793",
      png: "https://cards.scryfall.io/png/front/6/0/6090e321-94c3-4755-b01e-121ea1828fbd.png?1787745793",
      art_crop:
        "https://cards.scryfall.io/art_crop/front/6/0/6090e321-94c3-4755-b01e-121ea1828fbd.jpg?1787745793",
      border_crop:
        "https://cards.scryfall.io/border_crop/front/6/0/6090e321-94c3-4755-b01e-121ea1828fbd.jpg?1787745793",
      thumb:
        "https://cards.scryfall.io/thumb/front/6/0/6090e321-94c3-4755-b01e-121ea1828fbd.webp?1787745793",
      grid: "https://cards.scryfall.io/grid/front/6/0/6090e321-94c3-4755-b01e-121ea1828fbd.webp?1787745793",
      display:
        "https://cards.scryfall.io/display/front/6/0/6090e321-94c3-4755-b01e-121ea1828fbd.webp?1787745793",
      art: "https://cards.scryfall.io/art/front/6/0/6090e321-94c3-4755-b01e-121ea1828fbd.webp?1787745793",
      crop: "https://cards.scryfall.io/crop/front/6/0/6090e321-94c3-4755-b01e-121ea1828fbd.webp?1787745793",
      jpeg: "https://cards.scryfall.io/normal/front/6/0/6090e321-94c3-4755-b01e-121ea1828fbd.jpg?1787745793",
    },
    mana_cost: "{1}{G}",
    cmc: 2,
    type_line: "Creature — Bear",
    printed_type_line: "Summon Bear",
    oracle_text: "",
    power: "2",
    toughness: "2",
    colors: ["G"],
    color_identity: ["G"],
    keywords: [],
    legalities: {
      commander: "legal",
      brawl: "legal",
    },
    set: "slz",
    set_name: "The Zeta Set",
    rarity: "common",
    artist: "MSCHF",
    prices: {
      usd: null,
      usd_foil: null,
      eur: null,
    },
  },
  {
    id: "409f9b88-f03e-40b6-9883-68c14c37c0de",
    oracle_id: "14c8f55d-d177-4c25-a931-ebeb9e6062a0",
    name: "Grizzly Bears",
    lang: "en",
    layout: "normal",
    image_uris: {
      small:
        "https://cards.scryfall.io/small/front/4/0/409f9b88-f03e-40b6-9883-68c14c37c0de.jpg?1783943001",
      normal:
        "https://cards.scryfall.io/normal/front/4/0/409f9b88-f03e-40b6-9883-68c14c37c0de.jpg?1783943001",
      large:
        "https://cards.scryfall.io/large/front/4/0/409f9b88-f03e-40b6-9883-68c14c37c0de.jpg?1783943001",
      png: "https://cards.scryfall.io/png/front/4/0/409f9b88-f03e-40b6-9883-68c14c37c0de.png?1783943001",
      art_crop:
        "https://cards.scryfall.io/art_crop/front/4/0/409f9b88-f03e-40b6-9883-68c14c37c0de.jpg?1783943001",
      border_crop:
        "https://cards.scryfall.io/border_crop/front/4/0/409f9b88-f03e-40b6-9883-68c14c37c0de.jpg?1783943001",
      thumb:
        "https://cards.scryfall.io/thumb/front/4/0/409f9b88-f03e-40b6-9883-68c14c37c0de.webp?1783943001",
      grid: "https://cards.scryfall.io/grid/front/4/0/409f9b88-f03e-40b6-9883-68c14c37c0de.webp?1783943001",
      display:
        "https://cards.scryfall.io/display/front/4/0/409f9b88-f03e-40b6-9883-68c14c37c0de.webp?1783943001",
      art: "https://cards.scryfall.io/art/front/4/0/409f9b88-f03e-40b6-9883-68c14c37c0de.webp?1783943001",
      crop: "https://cards.scryfall.io/crop/front/4/0/409f9b88-f03e-40b6-9883-68c14c37c0de.webp?1783943001",
      jpeg: "https://cards.scryfall.io/normal/front/4/0/409f9b88-f03e-40b6-9883-68c14c37c0de.jpg?1783943001",
    },
    mana_cost: "{1}{G}",
    cmc: 2,
    type_line: "Creature — Bear",
    oracle_text: "",
    power: "2",
    toughness: "2",
    colors: ["G"],
    color_identity: ["G"],
    keywords: [],
    legalities: {
      commander: "legal",
      brawl: "legal",
    },
    set: "10e",
    set_name: "Tenth Edition",
    rarity: "common",
    flavor_text:
      '"We cannot forget that among all of Dominaria\'s wonders, a system of life exists, with prey and predators that will never fight wars nor vie for ancient power."\n—Jolrael, empress of beasts',
    artist: "D. J. Cleland-Hura",
    prices: {
      usd: "0.22",
      usd_foil: "3.29",
      eur: "0.16",
    },
  },
];

/** Scryfall's 404 body for a search that matches no card. */
export const SEARCH_NOT_FOUND_RECORDED: ScryfallError = {
  object: "error",
  code: "not_found",
  status: 404,
  details:
    "Your query didn’t match any cards. Adjust your search terms or refer to the syntax guide at https://scryfall.com/docs/reference",
};

/** Scryfall's 404 body for a card id it does not hold. */
export const CARD_NOT_FOUND_RECORDED: ScryfallError = {
  object: "error",
  code: "not_found",
  status: 404,
  details: "No card found with the given ID or set code and collector number.",
};
