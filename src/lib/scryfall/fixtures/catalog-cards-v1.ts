/**
 * Scryfall card objects for the `toCatalogCard` mapper tests, recorded from the live API.
 *
 * Recorded on 2026-11-11 (19:58 UTC) from https://api.scryfall.com with the app's
 * User-Agent, one request per case (listed on each case). Every card keeps only the
 * fields the app's `ScryfallCard` and `ScryfallCardFace` types declare, with the values
 * and key order Scryfall sent; `prices` keeps `usd`, `usd_foil` and `eur`, and
 * `legalities` keeps `commander` and `brawl`. Nothing else was edited.
 *
 * What the recording shows beyond Scryfall's documentation
 * (https://scryfall.com/docs/api/cards, read 2026-11-11): a reversible card has no
 * card-level `oracle_id`, `mana_cost`, `cmc` or `type_line`, although the documentation
 * lists `cmc` and `type_line` as always present; the faces carry them.
 *
 * @module scryfall/fixtures/catalog-cards-v1
 */
export const RECORDED_CATALOG_CARDS = {
  /** Llanowar Elves (Foundations): a creature with power, toughness and one colour. Recorded with `GET /cards/named?exact=Llanowar Elves`. */
  normal: {
    id: "6a0b230b-d391-4998-a3f7-7b158a0ec2cd",
    oracle_id: "68954295-54e3-4303-a6bc-fc4547a4e3a3",
    name: "Llanowar Elves",
    lang: "en",
    layout: "normal",
    image_uris: {
      small:
        "https://cards.scryfall.io/small/front/6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.jpg?1783909057",
      normal:
        "https://cards.scryfall.io/normal/front/6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.jpg?1783909057",
      large:
        "https://cards.scryfall.io/large/front/6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.jpg?1783909057",
      png: "https://cards.scryfall.io/png/front/6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.png?1783909057",
      art_crop:
        "https://cards.scryfall.io/art_crop/front/6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.jpg?1783909057",
      border_crop:
        "https://cards.scryfall.io/border_crop/front/6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.jpg?1783909057",
      thumb:
        "https://cards.scryfall.io/thumb/front/6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.webp?1783909057",
      grid: "https://cards.scryfall.io/grid/front/6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.webp?1783909057",
      display:
        "https://cards.scryfall.io/display/front/6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.webp?1783909057",
      art: "https://cards.scryfall.io/art/front/6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.webp?1783909057",
      crop: "https://cards.scryfall.io/crop/front/6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.webp?1783909057",
      jpeg: "https://cards.scryfall.io/normal/front/6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.jpg?1783909057",
    },
    mana_cost: "{G}",
    cmc: 1.0,
    type_line: "Creature — Elf Druid",
    oracle_text: "{T}: Add {G}.",
    power: "1",
    toughness: "1",
    colors: ["G"],
    color_identity: ["G"],
    keywords: [],
    legalities: {
      commander: "legal",
      brawl: "legal",
    },
    set: "fdn",
    set_name: "Foundations",
    rarity: "common",
    flavor_text:
      "The elves of the Llanowar forest have defended it for generations. It is their sacred duty to keep outside influences from corrupting their ancestral home.",
    artist: "Kev Walker",
    prices: {
      usd: "0.28",
      usd_foil: "0.73",
      eur: "0.22",
    },
  },
  /** Delver of Secrets // Insectile Aberration: a nonmodal (transforming) double-faced card (CR 712.2). Recorded with `GET /cards/named?exact=Delver of Secrets`. */
  transform: {
    id: "6904ea20-e504-47da-95a0-08739fdde260",
    oracle_id: "edd531b9-f615-4399-8c8c-1c5e18c4acbf",
    name: "Delver of Secrets // Insectile Aberration",
    lang: "en",
    layout: "transform",
    cmc: 1.0,
    type_line: "Creature — Human Wizard // Creature — Human Insect",
    color_identity: ["U"],
    keywords: ["Flying", "Transform"],
    card_faces: [
      {
        name: "Delver of Secrets",
        mana_cost: "{U}",
        type_line: "Creature — Human Wizard",
        oracle_text:
          "At the beginning of your upkeep, look at the top card of your library. You may reveal that card. If an instant or sorcery card is revealed this way, transform this creature.",
        colors: ["U"],
        power: "1",
        toughness: "1",
        image_uris: {
          small:
            "https://cards.scryfall.io/small/front/6/9/6904ea20-e504-47da-95a0-08739fdde260.jpg?1783908173",
          normal:
            "https://cards.scryfall.io/normal/front/6/9/6904ea20-e504-47da-95a0-08739fdde260.jpg?1783908173",
          large:
            "https://cards.scryfall.io/large/front/6/9/6904ea20-e504-47da-95a0-08739fdde260.jpg?1783908173",
          png: "https://cards.scryfall.io/png/front/6/9/6904ea20-e504-47da-95a0-08739fdde260.png?1783908173",
          art_crop:
            "https://cards.scryfall.io/art_crop/front/6/9/6904ea20-e504-47da-95a0-08739fdde260.jpg?1783908173",
          border_crop:
            "https://cards.scryfall.io/border_crop/front/6/9/6904ea20-e504-47da-95a0-08739fdde260.jpg?1783908173",
          thumb:
            "https://cards.scryfall.io/thumb/front/6/9/6904ea20-e504-47da-95a0-08739fdde260.webp?1783908173",
          grid: "https://cards.scryfall.io/grid/front/6/9/6904ea20-e504-47da-95a0-08739fdde260.webp?1783908173",
          display:
            "https://cards.scryfall.io/display/front/6/9/6904ea20-e504-47da-95a0-08739fdde260.webp?1783908173",
          art: "https://cards.scryfall.io/art/front/6/9/6904ea20-e504-47da-95a0-08739fdde260.webp?1783908173",
          crop: "https://cards.scryfall.io/crop/front/6/9/6904ea20-e504-47da-95a0-08739fdde260.webp?1783908173",
          jpeg: "https://cards.scryfall.io/normal/front/6/9/6904ea20-e504-47da-95a0-08739fdde260.jpg?1783908173",
        },
      },
      {
        name: "Insectile Aberration",
        mana_cost: "",
        type_line: "Creature — Human Insect",
        oracle_text: "Flying",
        colors: ["U"],
        color_indicator: ["U"],
        power: "3",
        toughness: "2",
        image_uris: {
          small:
            "https://cards.scryfall.io/small/back/6/9/6904ea20-e504-47da-95a0-08739fdde260.jpg?1783908173",
          normal:
            "https://cards.scryfall.io/normal/back/6/9/6904ea20-e504-47da-95a0-08739fdde260.jpg?1783908173",
          large:
            "https://cards.scryfall.io/large/back/6/9/6904ea20-e504-47da-95a0-08739fdde260.jpg?1783908173",
          png: "https://cards.scryfall.io/png/back/6/9/6904ea20-e504-47da-95a0-08739fdde260.png?1783908173",
          art_crop:
            "https://cards.scryfall.io/art_crop/back/6/9/6904ea20-e504-47da-95a0-08739fdde260.jpg?1783908173",
          border_crop:
            "https://cards.scryfall.io/border_crop/back/6/9/6904ea20-e504-47da-95a0-08739fdde260.jpg?1783908173",
          thumb:
            "https://cards.scryfall.io/thumb/back/6/9/6904ea20-e504-47da-95a0-08739fdde260.webp?1783908173",
          grid: "https://cards.scryfall.io/grid/back/6/9/6904ea20-e504-47da-95a0-08739fdde260.webp?1783908173",
          display:
            "https://cards.scryfall.io/display/back/6/9/6904ea20-e504-47da-95a0-08739fdde260.webp?1783908173",
          art: "https://cards.scryfall.io/art/back/6/9/6904ea20-e504-47da-95a0-08739fdde260.webp?1783908173",
          crop: "https://cards.scryfall.io/crop/back/6/9/6904ea20-e504-47da-95a0-08739fdde260.webp?1783908173",
          jpeg: "https://cards.scryfall.io/normal/back/6/9/6904ea20-e504-47da-95a0-08739fdde260.jpg?1783908173",
        },
      },
    ],
    legalities: {
      commander: "legal",
      brawl: "legal",
    },
    set: "inr",
    set_name: "Innistrad Remastered",
    rarity: "common",
    artist: "Nils Hamm",
    prices: {
      usd: "0.29",
      usd_foil: "0.31",
      eur: "0.20",
    },
  },
  /** Valakut Awakening // Valakut Stoneforge: a modal double-faced card with a land back (CR 712.3). Recorded with `GET /cards/named?exact=Valakut Awakening`. */
  modalDoubleFaced: {
    id: "228e551e-023a-4c9a-8f32-58dae6ffdf7f",
    oracle_id: "ff0ab867-b710-4b1a-baed-95fc3cf68f79",
    name: "Valakut Awakening // Valakut Stoneforge",
    lang: "en",
    layout: "modal_dfc",
    cmc: 3.0,
    type_line: "Instant // Land",
    color_identity: ["R"],
    keywords: [],
    card_faces: [
      {
        name: "Valakut Awakening",
        mana_cost: "{2}{R}",
        type_line: "Instant",
        oracle_text:
          "Put any number of cards from your hand on the bottom of your library, then draw that many cards plus one.",
        colors: ["R"],
        image_uris: {
          small:
            "https://cards.scryfall.io/small/front/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.jpg?1783929350",
          normal:
            "https://cards.scryfall.io/normal/front/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.jpg?1783929350",
          large:
            "https://cards.scryfall.io/large/front/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.jpg?1783929350",
          png: "https://cards.scryfall.io/png/front/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.png?1783929350",
          art_crop:
            "https://cards.scryfall.io/art_crop/front/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.jpg?1783929350",
          border_crop:
            "https://cards.scryfall.io/border_crop/front/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.jpg?1783929350",
          thumb:
            "https://cards.scryfall.io/thumb/front/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.webp?1783929350",
          grid: "https://cards.scryfall.io/grid/front/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.webp?1783929350",
          display:
            "https://cards.scryfall.io/display/front/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.webp?1783929350",
          art: "https://cards.scryfall.io/art/front/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.webp?1783929350",
          crop: "https://cards.scryfall.io/crop/front/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.webp?1783929350",
          jpeg: "https://cards.scryfall.io/normal/front/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.jpg?1783929350",
        },
      },
      {
        name: "Valakut Stoneforge",
        mana_cost: "",
        type_line: "Land",
        oracle_text: "This land enters tapped.\n{T}: Add {R}.",
        colors: [],
        image_uris: {
          small:
            "https://cards.scryfall.io/small/back/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.jpg?1783929350",
          normal:
            "https://cards.scryfall.io/normal/back/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.jpg?1783929350",
          large:
            "https://cards.scryfall.io/large/back/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.jpg?1783929350",
          png: "https://cards.scryfall.io/png/back/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.png?1783929350",
          art_crop:
            "https://cards.scryfall.io/art_crop/back/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.jpg?1783929350",
          border_crop:
            "https://cards.scryfall.io/border_crop/back/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.jpg?1783929350",
          thumb:
            "https://cards.scryfall.io/thumb/back/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.webp?1783929350",
          grid: "https://cards.scryfall.io/grid/back/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.webp?1783929350",
          display:
            "https://cards.scryfall.io/display/back/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.webp?1783929350",
          art: "https://cards.scryfall.io/art/back/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.webp?1783929350",
          crop: "https://cards.scryfall.io/crop/back/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.webp?1783929350",
          jpeg: "https://cards.scryfall.io/normal/back/2/2/228e551e-023a-4c9a-8f32-58dae6ffdf7f.jpg?1783929350",
        },
      },
    ],
    legalities: {
      commander: "legal",
      brawl: "legal",
    },
    set: "znr",
    set_name: "Zendikar Rising",
    rarity: "rare",
    artist: "Campbell White",
    prices: {
      usd: "14.23",
      usd_foil: "17.51",
      eur: "12.86",
    },
  },
  /** Fire // Ice: a split card (CR 709.1). Recorded with `GET /cards/named?exact=Fire // Ice`. */
  split: {
    id: "18303862-4726-4136-814f-157aa7006579",
    oracle_id: "ae92942b-919c-4ea9-b693-85fcef765d5a",
    name: "Fire // Ice",
    lang: "en",
    layout: "split",
    image_uris: {
      small:
        "https://cards.scryfall.io/small/front/1/8/18303862-4726-4136-814f-157aa7006579.jpg?1783918420",
      normal:
        "https://cards.scryfall.io/normal/front/1/8/18303862-4726-4136-814f-157aa7006579.jpg?1783918420",
      large:
        "https://cards.scryfall.io/large/front/1/8/18303862-4726-4136-814f-157aa7006579.jpg?1783918420",
      png: "https://cards.scryfall.io/png/front/1/8/18303862-4726-4136-814f-157aa7006579.png?1783918420",
      art_crop:
        "https://cards.scryfall.io/art_crop/front/1/8/18303862-4726-4136-814f-157aa7006579.jpg?1783918420",
      border_crop:
        "https://cards.scryfall.io/border_crop/front/1/8/18303862-4726-4136-814f-157aa7006579.jpg?1783918420",
      thumb:
        "https://cards.scryfall.io/thumb/front/1/8/18303862-4726-4136-814f-157aa7006579.webp?1783918420",
      grid: "https://cards.scryfall.io/grid/front/1/8/18303862-4726-4136-814f-157aa7006579.webp?1783918420",
      display:
        "https://cards.scryfall.io/display/front/1/8/18303862-4726-4136-814f-157aa7006579.webp?1783918420",
      art: "https://cards.scryfall.io/art/front/1/8/18303862-4726-4136-814f-157aa7006579.webp?1783918420",
      crop: "https://cards.scryfall.io/crop/front/1/8/18303862-4726-4136-814f-157aa7006579.webp?1783918420",
      jpeg: "https://cards.scryfall.io/normal/front/1/8/18303862-4726-4136-814f-157aa7006579.jpg?1783918420",
    },
    mana_cost: "{1}{R} // {1}{U}",
    cmc: 4.0,
    type_line: "Instant // Instant",
    colors: ["R", "U"],
    color_identity: ["R", "U"],
    keywords: [],
    card_faces: [
      {
        name: "Fire",
        mana_cost: "{1}{R}",
        type_line: "Instant",
        oracle_text:
          "Fire deals 2 damage divided as you choose among one or two targets.",
      },
      {
        name: "Ice",
        mana_cost: "{1}{U}",
        type_line: "Instant",
        oracle_text: "Tap target permanent.\nDraw a card.",
      },
    ],
    legalities: {
      commander: "legal",
      brawl: "not_legal",
    },
    set: "dmr",
    set_name: "Dominaria Remastered",
    rarity: "uncommon",
    artist: "David Martin & Franz Vohwinkel",
    prices: {
      usd: "0.22",
      usd_foil: "0.33",
      eur: "0.26",
    },
  },
  /** Bonecrusher Giant // Stomp: an adventurer card (CR 715.1). Recorded with `GET /cards/named?exact=Bonecrusher Giant`. */
  adventure: {
    id: "b5b71cd2-de35-451f-b16e-2e3936169407",
    oracle_id: "d6d72f5f-8f5d-4180-b514-f22ff5482902",
    name: "Bonecrusher Giant // Stomp",
    lang: "en",
    layout: "adventure",
    image_uris: {
      small:
        "https://cards.scryfall.io/small/front/b/5/b5b71cd2-de35-451f-b16e-2e3936169407.jpg?1783922435",
      normal:
        "https://cards.scryfall.io/normal/front/b/5/b5b71cd2-de35-451f-b16e-2e3936169407.jpg?1783922435",
      large:
        "https://cards.scryfall.io/large/front/b/5/b5b71cd2-de35-451f-b16e-2e3936169407.jpg?1783922435",
      png: "https://cards.scryfall.io/png/front/b/5/b5b71cd2-de35-451f-b16e-2e3936169407.png?1783922435",
      art_crop:
        "https://cards.scryfall.io/art_crop/front/b/5/b5b71cd2-de35-451f-b16e-2e3936169407.jpg?1783922435",
      border_crop:
        "https://cards.scryfall.io/border_crop/front/b/5/b5b71cd2-de35-451f-b16e-2e3936169407.jpg?1783922435",
      thumb:
        "https://cards.scryfall.io/thumb/front/b/5/b5b71cd2-de35-451f-b16e-2e3936169407.webp?1783922435",
      grid: "https://cards.scryfall.io/grid/front/b/5/b5b71cd2-de35-451f-b16e-2e3936169407.webp?1783922435",
      display:
        "https://cards.scryfall.io/display/front/b/5/b5b71cd2-de35-451f-b16e-2e3936169407.webp?1783922435",
      art: "https://cards.scryfall.io/art/front/b/5/b5b71cd2-de35-451f-b16e-2e3936169407.webp?1783922435",
      crop: "https://cards.scryfall.io/crop/front/b/5/b5b71cd2-de35-451f-b16e-2e3936169407.webp?1783922435",
      jpeg: "https://cards.scryfall.io/normal/front/b/5/b5b71cd2-de35-451f-b16e-2e3936169407.jpg?1783922435",
    },
    mana_cost: "{2}{R} // {1}{R}",
    cmc: 3.0,
    type_line: "Creature — Giant // Instant — Adventure",
    power: "4",
    toughness: "3",
    colors: ["R"],
    color_identity: ["R"],
    keywords: [],
    card_faces: [
      {
        name: "Bonecrusher Giant",
        mana_cost: "{2}{R}",
        type_line: "Creature — Giant",
        oracle_text:
          "Whenever this creature becomes the target of a spell, this creature deals 2 damage to that spell's controller.",
        power: "4",
        toughness: "3",
      },
      {
        name: "Stomp",
        mana_cost: "{1}{R}",
        type_line: "Instant — Adventure",
        oracle_text:
          "Damage can't be prevented this turn. Stomp deals 2 damage to any target.",
      },
    ],
    legalities: {
      commander: "legal",
      brawl: "legal",
    },
    set: "clb",
    set_name: "Commander Legends: Battle for Baldur's Gate",
    rarity: "rare",
    flavor_text: "Not every tale ends in glory.",
    artist: "Victor Adame Minguez",
    prices: {
      usd: "0.37",
      usd_foil: null,
      eur: "0.46",
    },
  },
  /** Treasure (The Lost Caverns of Ixalan Tokens): a token (CR 111.1). Recorded with `GET /cards/search?q=t:token !"Treasure" set:tlci&unique=prints, first result`. */
  token: {
    id: "3dfaedeb-f8ec-4f0e-b243-c850770a86f2",
    oracle_id: "3c549374-6c37-42e0-8d88-a8555d46732d",
    name: "Treasure",
    lang: "en",
    layout: "token",
    image_uris: {
      small:
        "https://cards.scryfall.io/small/front/3/d/3dfaedeb-f8ec-4f0e-b243-c850770a86f2.jpg?1783913602",
      normal:
        "https://cards.scryfall.io/normal/front/3/d/3dfaedeb-f8ec-4f0e-b243-c850770a86f2.jpg?1783913602",
      large:
        "https://cards.scryfall.io/large/front/3/d/3dfaedeb-f8ec-4f0e-b243-c850770a86f2.jpg?1783913602",
      png: "https://cards.scryfall.io/png/front/3/d/3dfaedeb-f8ec-4f0e-b243-c850770a86f2.png?1783913602",
      art_crop:
        "https://cards.scryfall.io/art_crop/front/3/d/3dfaedeb-f8ec-4f0e-b243-c850770a86f2.jpg?1783913602",
      border_crop:
        "https://cards.scryfall.io/border_crop/front/3/d/3dfaedeb-f8ec-4f0e-b243-c850770a86f2.jpg?1783913602",
      thumb:
        "https://cards.scryfall.io/thumb/front/3/d/3dfaedeb-f8ec-4f0e-b243-c850770a86f2.webp?1783913602",
      grid: "https://cards.scryfall.io/grid/front/3/d/3dfaedeb-f8ec-4f0e-b243-c850770a86f2.webp?1783913602",
      display:
        "https://cards.scryfall.io/display/front/3/d/3dfaedeb-f8ec-4f0e-b243-c850770a86f2.webp?1783913602",
      art: "https://cards.scryfall.io/art/front/3/d/3dfaedeb-f8ec-4f0e-b243-c850770a86f2.webp?1783913602",
      crop: "https://cards.scryfall.io/crop/front/3/d/3dfaedeb-f8ec-4f0e-b243-c850770a86f2.webp?1783913602",
      jpeg: "https://cards.scryfall.io/normal/front/3/d/3dfaedeb-f8ec-4f0e-b243-c850770a86f2.jpg?1783913602",
    },
    mana_cost: "",
    cmc: 0.0,
    type_line: "Token Artifact — Treasure",
    oracle_text: "{T}, Sacrifice this token: Add one mana of any color.",
    colors: [],
    color_identity: [],
    keywords: [],
    legalities: {
      commander: "not_legal",
      brawl: "not_legal",
    },
    set: "tlci",
    set_name: "The Lost Caverns of Ixalan Tokens",
    rarity: "common",
    artist: "Wero Gallo",
    prices: {
      usd: "0.35",
      usd_foil: null,
      eur: "0.17",
    },
  },
  /** Abbot of Keral Keep (Explorer Anthology 3): an Arena-only printing with every price null. Recorded with `GET /cards/search?q=game:arena -game:paper is:digital t:creature&order=name, first result`. */
  noPrices: {
    id: "522d3a79-2523-4680-8853-6560c626eaa4",
    oracle_id: "09be0f69-9c7f-491f-964d-bfbbc2d4251f",
    name: "Abbot of Keral Keep",
    lang: "en",
    layout: "normal",
    image_uris: {
      small:
        "https://cards.scryfall.io/small/front/5/2/522d3a79-2523-4680-8853-6560c626eaa4.jpg?1783915791",
      normal:
        "https://cards.scryfall.io/normal/front/5/2/522d3a79-2523-4680-8853-6560c626eaa4.jpg?1783915791",
      large:
        "https://cards.scryfall.io/large/front/5/2/522d3a79-2523-4680-8853-6560c626eaa4.jpg?1783915791",
      png: "https://cards.scryfall.io/png/front/5/2/522d3a79-2523-4680-8853-6560c626eaa4.png?1783915791",
      art_crop:
        "https://cards.scryfall.io/art_crop/front/5/2/522d3a79-2523-4680-8853-6560c626eaa4.jpg?1783915791",
      border_crop:
        "https://cards.scryfall.io/border_crop/front/5/2/522d3a79-2523-4680-8853-6560c626eaa4.jpg?1783915791",
      thumb:
        "https://cards.scryfall.io/thumb/front/5/2/522d3a79-2523-4680-8853-6560c626eaa4.webp?1783915791",
      grid: "https://cards.scryfall.io/grid/front/5/2/522d3a79-2523-4680-8853-6560c626eaa4.webp?1783915791",
      display:
        "https://cards.scryfall.io/display/front/5/2/522d3a79-2523-4680-8853-6560c626eaa4.webp?1783915791",
      art: "https://cards.scryfall.io/art/front/5/2/522d3a79-2523-4680-8853-6560c626eaa4.webp?1783915791",
      crop: "https://cards.scryfall.io/crop/front/5/2/522d3a79-2523-4680-8853-6560c626eaa4.webp?1783915791",
      jpeg: "https://cards.scryfall.io/normal/front/5/2/522d3a79-2523-4680-8853-6560c626eaa4.jpg?1783915791",
    },
    mana_cost: "{1}{R}",
    cmc: 2.0,
    type_line: "Creature — Human Monk",
    oracle_text:
      "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)\nWhen this creature enters, exile the top card of your library. Until end of turn, you may play that card.",
    power: "2",
    toughness: "1",
    colors: ["R"],
    color_identity: ["R"],
    keywords: ["Prowess"],
    legalities: {
      commander: "legal",
      brawl: "legal",
    },
    set: "ea3",
    set_name: "Explorer Anthology 3",
    rarity: "rare",
    artist: "Deruchenko Alexander",
    prices: {
      usd: null,
      usd_foil: null,
      eur: null,
    },
  },
  /** Gandalf the Grey (The Lord of the Rings: Tales of Middle-earth): a Universes Beyond card. Recorded with `GET /cards/named?exact=Gandalf the Grey`. */
  universesBeyond: {
    id: "e2b975e6-e709-481f-bfbc-41a832508283",
    oracle_id: "dfd12e3c-2b2a-4461-a08d-09d4e6c4626e",
    name: "Gandalf the Grey",
    lang: "en",
    layout: "normal",
    image_uris: {
      small:
        "https://cards.scryfall.io/small/front/e/2/e2b975e6-e709-481f-bfbc-41a832508283.jpg?1783916255",
      normal:
        "https://cards.scryfall.io/normal/front/e/2/e2b975e6-e709-481f-bfbc-41a832508283.jpg?1783916255",
      large:
        "https://cards.scryfall.io/large/front/e/2/e2b975e6-e709-481f-bfbc-41a832508283.jpg?1783916255",
      png: "https://cards.scryfall.io/png/front/e/2/e2b975e6-e709-481f-bfbc-41a832508283.png?1783916255",
      art_crop:
        "https://cards.scryfall.io/art_crop/front/e/2/e2b975e6-e709-481f-bfbc-41a832508283.jpg?1783916255",
      border_crop:
        "https://cards.scryfall.io/border_crop/front/e/2/e2b975e6-e709-481f-bfbc-41a832508283.jpg?1783916255",
      thumb:
        "https://cards.scryfall.io/thumb/front/e/2/e2b975e6-e709-481f-bfbc-41a832508283.webp?1783916255",
      grid: "https://cards.scryfall.io/grid/front/e/2/e2b975e6-e709-481f-bfbc-41a832508283.webp?1783916255",
      display:
        "https://cards.scryfall.io/display/front/e/2/e2b975e6-e709-481f-bfbc-41a832508283.webp?1783916255",
      art: "https://cards.scryfall.io/art/front/e/2/e2b975e6-e709-481f-bfbc-41a832508283.webp?1783916255",
      crop: "https://cards.scryfall.io/crop/front/e/2/e2b975e6-e709-481f-bfbc-41a832508283.webp?1783916255",
      jpeg: "https://cards.scryfall.io/normal/front/e/2/e2b975e6-e709-481f-bfbc-41a832508283.jpg?1783916255",
    },
    mana_cost: "{3}{U}{R}",
    cmc: 5.0,
    type_line: "Legendary Creature — Avatar Wizard",
    oracle_text:
      "Whenever you cast an instant or sorcery spell, choose one that hasn't been chosen —\n• You may tap or untap target permanent.\n• Gandalf deals 3 damage to each opponent.\n• Copy target instant or sorcery spell you control. You may choose new targets for the copy.\n• Put Gandalf on top of its owner's library.",
    power: "3",
    toughness: "4",
    colors: ["R", "U"],
    color_identity: ["R", "U"],
    keywords: [],
    legalities: {
      commander: "legal",
      brawl: "legal",
    },
    set: "ltr",
    set_name: "The Lord of the Rings: Tales of Middle-earth",
    rarity: "rare",
    artist: "Aaron Miller",
    prices: {
      usd: "0.53",
      usd_foil: "1.48",
      eur: "0.35",
    },
  },
  /** Forest (Marvel: Darkhold Destiny), the default printing: a basic land (CR 205.4c). Recorded with `GET /cards/named?exact=Forest`. */
  basicLand: {
    id: "2e781bfd-f8cb-4d20-b977-4359f3a21311",
    oracle_id: "b34bb2dc-c1af-4d77-b0b3-a0fb342a5fc6",
    name: "Forest",
    lang: "en",
    layout: "normal",
    image_uris: {
      small:
        "https://cards.scryfall.io/small/front/2/e/2e781bfd-f8cb-4d20-b977-4359f3a21311.jpg?1791578317",
      normal:
        "https://cards.scryfall.io/normal/front/2/e/2e781bfd-f8cb-4d20-b977-4359f3a21311.jpg?1791578317",
      large:
        "https://cards.scryfall.io/large/front/2/e/2e781bfd-f8cb-4d20-b977-4359f3a21311.jpg?1791578317",
      png: "https://cards.scryfall.io/png/front/2/e/2e781bfd-f8cb-4d20-b977-4359f3a21311.png?1791578317",
      art_crop:
        "https://cards.scryfall.io/art_crop/front/2/e/2e781bfd-f8cb-4d20-b977-4359f3a21311.jpg?1791578317",
      border_crop:
        "https://cards.scryfall.io/border_crop/front/2/e/2e781bfd-f8cb-4d20-b977-4359f3a21311.jpg?1791578317",
      thumb:
        "https://cards.scryfall.io/thumb/front/2/e/2e781bfd-f8cb-4d20-b977-4359f3a21311.webp?1791578317",
      grid: "https://cards.scryfall.io/grid/front/2/e/2e781bfd-f8cb-4d20-b977-4359f3a21311.webp?1791578317",
      display:
        "https://cards.scryfall.io/display/front/2/e/2e781bfd-f8cb-4d20-b977-4359f3a21311.webp?1791578317",
      art: "https://cards.scryfall.io/art/front/2/e/2e781bfd-f8cb-4d20-b977-4359f3a21311.webp?1791578317",
      crop: "https://cards.scryfall.io/crop/front/2/e/2e781bfd-f8cb-4d20-b977-4359f3a21311.webp?1791578317",
      jpeg: "https://cards.scryfall.io/normal/front/2/e/2e781bfd-f8cb-4d20-b977-4359f3a21311.jpg?1791578317",
    },
    mana_cost: "",
    cmc: 0.0,
    type_line: "Basic Land — Forest",
    oracle_text: "({T}: Add {G}.)",
    colors: [],
    color_identity: ["G"],
    keywords: [],
    legalities: {
      commander: "legal",
      brawl: "legal",
    },
    set: "mdd",
    set_name: "Marvel: Darkhold Destiny",
    rarity: "common",
    flavor_text:
      '"You have only one mission, minions: protect me with your lives. In order to do this, you need to wear down Captain Britain\'s psyche. In order to do *that*, you need to burn down her precious lands. Am I understood?"\n—Morgan Le Fay',
    artist: "Samuele Bandini",
    prices: {
      usd: null,
      usd_foil: null,
      eur: null,
    },
  },
  /** Snow-Covered Forest (Kaldheim): a snow basic land, type line "Basic Snow Land — Forest". Recorded with `GET /cards/named?exact=Snow-Covered Forest`. */
  snowBasicLand: {
    id: "ca17acea-f079-4e53-8176-a2f5c5c408a1",
    oracle_id: "5f0d3be8-e63e-4ade-ae58-6b0c14f2ce6d",
    name: "Snow-Covered Forest",
    lang: "en",
    layout: "normal",
    image_uris: {
      small:
        "https://cards.scryfall.io/small/front/c/a/ca17acea-f079-4e53-8176-a2f5c5c408a1.jpg?1783928164",
      normal:
        "https://cards.scryfall.io/normal/front/c/a/ca17acea-f079-4e53-8176-a2f5c5c408a1.jpg?1783928164",
      large:
        "https://cards.scryfall.io/large/front/c/a/ca17acea-f079-4e53-8176-a2f5c5c408a1.jpg?1783928164",
      png: "https://cards.scryfall.io/png/front/c/a/ca17acea-f079-4e53-8176-a2f5c5c408a1.png?1783928164",
      art_crop:
        "https://cards.scryfall.io/art_crop/front/c/a/ca17acea-f079-4e53-8176-a2f5c5c408a1.jpg?1783928164",
      border_crop:
        "https://cards.scryfall.io/border_crop/front/c/a/ca17acea-f079-4e53-8176-a2f5c5c408a1.jpg?1783928164",
      thumb:
        "https://cards.scryfall.io/thumb/front/c/a/ca17acea-f079-4e53-8176-a2f5c5c408a1.webp?1783928164",
      grid: "https://cards.scryfall.io/grid/front/c/a/ca17acea-f079-4e53-8176-a2f5c5c408a1.webp?1783928164",
      display:
        "https://cards.scryfall.io/display/front/c/a/ca17acea-f079-4e53-8176-a2f5c5c408a1.webp?1783928164",
      art: "https://cards.scryfall.io/art/front/c/a/ca17acea-f079-4e53-8176-a2f5c5c408a1.webp?1783928164",
      crop: "https://cards.scryfall.io/crop/front/c/a/ca17acea-f079-4e53-8176-a2f5c5c408a1.webp?1783928164",
      jpeg: "https://cards.scryfall.io/normal/front/c/a/ca17acea-f079-4e53-8176-a2f5c5c408a1.jpg?1783928164",
    },
    mana_cost: "",
    cmc: 0.0,
    type_line: "Basic Snow Land — Forest",
    oracle_text: "({T}: Add {G}.)",
    colors: [],
    color_identity: ["G"],
    keywords: [],
    legalities: {
      commander: "legal",
      brawl: "legal",
    },
    set: "khm",
    set_name: "Kaldheim",
    rarity: "common",
    artist: "Adam Paquette",
    prices: {
      usd: "0.76",
      usd_foil: "0.83",
      eur: "0.66",
    },
  },
  /** Llanowar Elves (Foundations), French printing: lang "fr" and printed text. Recorded with `GET /cards/search?q=!"Llanowar Elves" lang:fr&include_multilingual=true&unique=prints, first result`. */
  localized: {
    id: "b164bd6d-260c-4f02-affe-fc774d433ae8",
    oracle_id: "68954295-54e3-4303-a6bc-fc4547a4e3a3",
    name: "Llanowar Elves",
    printed_name: "Elfes de Llanowar",
    lang: "fr",
    layout: "normal",
    image_uris: {
      small:
        "https://cards.scryfall.io/small/front/b/1/b164bd6d-260c-4f02-affe-fc774d433ae8.jpg?1791689302",
      normal:
        "https://cards.scryfall.io/normal/front/b/1/b164bd6d-260c-4f02-affe-fc774d433ae8.jpg?1791689302",
      large:
        "https://cards.scryfall.io/large/front/b/1/b164bd6d-260c-4f02-affe-fc774d433ae8.jpg?1791689302",
      png: "https://cards.scryfall.io/png/front/b/1/b164bd6d-260c-4f02-affe-fc774d433ae8.png?1791689302",
      art_crop:
        "https://cards.scryfall.io/art_crop/front/b/1/b164bd6d-260c-4f02-affe-fc774d433ae8.jpg?1791689302",
      border_crop:
        "https://cards.scryfall.io/border_crop/front/b/1/b164bd6d-260c-4f02-affe-fc774d433ae8.jpg?1791689302",
      thumb:
        "https://cards.scryfall.io/thumb/front/b/1/b164bd6d-260c-4f02-affe-fc774d433ae8.webp?1791689302",
      grid: "https://cards.scryfall.io/grid/front/b/1/b164bd6d-260c-4f02-affe-fc774d433ae8.webp?1791689302",
      display:
        "https://cards.scryfall.io/display/front/b/1/b164bd6d-260c-4f02-affe-fc774d433ae8.webp?1791689302",
      art: "https://cards.scryfall.io/art/front/b/1/b164bd6d-260c-4f02-affe-fc774d433ae8.webp?1791689302",
      crop: "https://cards.scryfall.io/crop/front/b/1/b164bd6d-260c-4f02-affe-fc774d433ae8.webp?1791689302",
      jpeg: "https://cards.scryfall.io/normal/front/b/1/b164bd6d-260c-4f02-affe-fc774d433ae8.jpg?1791689302",
    },
    mana_cost: "{G}",
    cmc: 1.0,
    type_line: "Creature — Elf Druid",
    printed_type_line: "Créature — elfe et druide",
    oracle_text: "{T}: Add {G}.",
    printed_text: "{T} : Ajoutez {G}.",
    power: "1",
    toughness: "1",
    colors: ["G"],
    color_identity: ["G"],
    keywords: [],
    legalities: {
      commander: "legal",
      brawl: "legal",
    },
    set: "fdn",
    set_name: "Foundations",
    rarity: "common",
    flavor_text:
      "Les elfes de la forêt de Llanowar la défendent depuis des générations. C'est leur devoir sacré d'empêcher toute influence extérieure de corrompre leur demeure ancestrale.",
    artist: "Kev Walker",
    prices: {
      usd: null,
      usd_foil: null,
      eur: null,
    },
  },
  /** Conjurer's Closet // Conjurer's Closet (Secret Lair Drop): a reversible card, whose card-level oracle_id, mana_cost, cmc and type_line are absent. Recorded with `GET /cards/search?q=layout:reversible_card&order=released, first result`. */
  reversible: {
    id: "dc791c6a-331a-44f6-ab40-7a1ff9673170",
    name: "Conjurer's Closet // Conjurer's Closet",
    lang: "en",
    layout: "reversible_card",
    color_identity: [],
    keywords: [],
    card_faces: [
      {
        name: "Conjurer's Closet",
        mana_cost: "{5}",
        type_line: "Artifact",
        oracle_text:
          "At the beginning of your end step, you may exile target creature you control, then return that card to the battlefield under your control.",
        colors: [],
        image_uris: {
          small:
            "https://cards.scryfall.io/small/front/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.jpg?1793956081",
          normal:
            "https://cards.scryfall.io/normal/front/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.jpg?1793956081",
          large:
            "https://cards.scryfall.io/large/front/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.jpg?1793956081",
          png: "https://cards.scryfall.io/png/front/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.png?1793956081",
          art_crop:
            "https://cards.scryfall.io/art_crop/front/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.jpg?1793956081",
          border_crop:
            "https://cards.scryfall.io/border_crop/front/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.jpg?1793956081",
          thumb:
            "https://cards.scryfall.io/thumb/front/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.webp?1793956081",
          grid: "https://cards.scryfall.io/grid/front/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.webp?1793956081",
          display:
            "https://cards.scryfall.io/display/front/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.webp?1793956081",
          art: "https://cards.scryfall.io/art/front/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.webp?1793956081",
          crop: "https://cards.scryfall.io/crop/front/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.webp?1793956081",
          jpeg: "https://cards.scryfall.io/normal/front/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.jpg?1793956081",
        },
      },
      {
        name: "Conjurer's Closet",
        mana_cost: "{5}",
        type_line: "Artifact",
        oracle_text:
          "At the beginning of your end step, you may exile target creature you control, then return that card to the battlefield under your control.",
        colors: [],
        image_uris: {
          small:
            "https://cards.scryfall.io/small/back/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.jpg?1793956081",
          normal:
            "https://cards.scryfall.io/normal/back/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.jpg?1793956081",
          large:
            "https://cards.scryfall.io/large/back/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.jpg?1793956081",
          png: "https://cards.scryfall.io/png/back/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.png?1793956081",
          art_crop:
            "https://cards.scryfall.io/art_crop/back/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.jpg?1793956081",
          border_crop:
            "https://cards.scryfall.io/border_crop/back/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.jpg?1793956081",
          thumb:
            "https://cards.scryfall.io/thumb/back/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.webp?1793956081",
          grid: "https://cards.scryfall.io/grid/back/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.webp?1793956081",
          display:
            "https://cards.scryfall.io/display/back/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.webp?1793956081",
          art: "https://cards.scryfall.io/art/back/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.webp?1793956081",
          crop: "https://cards.scryfall.io/crop/back/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.webp?1793956081",
          jpeg: "https://cards.scryfall.io/normal/back/d/c/dc791c6a-331a-44f6-ab40-7a1ff9673170.jpg?1793956081",
        },
      },
    ],
    legalities: {
      commander: "legal",
      brawl: "not_legal",
    },
    set: "sld",
    set_name: "Secret Lair Drop",
    rarity: "rare",
    artist: "",
    prices: {
      usd: null,
      usd_foil: null,
      eur: null,
    },
  },
};
