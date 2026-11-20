/**
 * The cards of Deck Lab's classification table (I-31 testing strategy), recorded from Scryfall
 * for the card classifier (`classifyDeck` in `../classify-deck.ts`).
 *
 * Recorded on 2026-11-19 (18:47 UTC) with one `POST https://api.scryfall.com/cards/collection`
 * naming each card, sent with the app's User-Agent
 * (`MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`). The response came as
 * `Content-Type: application/json; charset=utf-8`, with an empty `not_found`.
 *
 * The classifier reads a deck card, which `makeDeckCard` builds from these fields, so each card
 * keeps only what that mapper reads for the rules: `id`, `name`, `layout`, `mana_cost`, `cmc`,
 * `type_line`, `oracle_text`, `color_identity`, and for the modal double-faced card its two
 * `card_faces` with their `name`, `mana_cost`, `type_line` and `oracle_text`. Every other field
 * (images, prices, legalities, printing details) was trimmed; nothing was changed. The Oracle
 * text is Scryfall's current wording, such as "This land enters tapped." (the 2024 Foundations
 * template).
 *
 * The first twelve are the spec's table; Forest, Harmonize, Phyrexian Arena, Counterspell,
 * Fellwar Stone and Rampant Growth cover the remaining kinds and the fallback. Treasure Map,
 * Hengegate Pathway, Glacial Fortress, Maze of Ith and Explosive Vegetation are edge cases, from
 * a second `POST /cards/collection` the same day (18:56 UTC), trimmed the same way.
 *
 * @module deck-lab/fixtures/scryfall-lab-cards-v1
 */
import type { ScryfallCard } from "@/lib/scryfall/types";

/** The recorded cards, keyed by a short handle the tests name them by. */
export const RECORDED_LAB_CARDS = {
  solRing: {
    id: "fc817e07-c1f3-469f-9cf7-0945dea7400f",
    name: "Sol Ring",
    layout: "normal",
    mana_cost: "{1}",
    cmc: 1,
    type_line: "Artifact",
    oracle_text: "{T}: Add {C}{C}.",
    color_identity: [],
  },
  arcaneSignet: {
    id: "795df2ee-fbfc-4961-852c-e3ec50cc52da",
    name: "Arcane Signet",
    layout: "normal",
    mana_cost: "{2}",
    cmc: 2,
    type_line: "Artifact",
    oracle_text:
      "{T}: Add one mana of any color in your commander's color identity.",
    color_identity: [],
  },
  azoriusSignet: {
    id: "af690536-b0bc-4d85-8bb8-f6856b9f927b",
    name: "Azorius Signet",
    layout: "normal",
    mana_cost: "{2}",
    cmc: 2,
    type_line: "Artifact",
    oracle_text: "{1}, {T}: Add {W}{U}.",
    color_identity: ["U", "W"],
  },
  commandTower: {
    id: "a73297d2-580c-4174-a427-265f6916d09f",
    name: "Command Tower",
    layout: "normal",
    mana_cost: "",
    cmc: 0,
    type_line: "Land",
    oracle_text:
      "{T}: Add one mana of any color in your commander's color identity.",
    color_identity: [],
  },
  cultivate: {
    id: "a78f5d3f-74d6-4ec1-89c4-e24639d3f4ba",
    name: "Cultivate",
    layout: "normal",
    mana_cost: "{2}{G}",
    cmc: 3,
    type_line: "Sorcery",
    oracle_text:
      "Search your library for up to two basic land cards, reveal those cards, put one onto the battlefield tapped and the other into your hand, then shuffle.",
    color_identity: ["G"],
  },
  llanowarElves: {
    id: "6a0b230b-d391-4998-a3f7-7b158a0ec2cd",
    name: "Llanowar Elves",
    layout: "normal",
    mana_cost: "{G}",
    cmc: 1,
    type_line: "Creature — Elf Druid",
    oracle_text: "{T}: Add {G}.",
    color_identity: ["G"],
  },
  floodedStrand: {
    id: "8f85e12c-196b-4459-b81f-0c9c854e9f57",
    name: "Flooded Strand",
    layout: "normal",
    mana_cost: "",
    cmc: 0,
    type_line: "Land",
    oracle_text:
      "{T}, Pay 1 life, Sacrifice this land: Search your library for a Plains or Island card, put it onto the battlefield, then shuffle.",
    color_identity: [],
  },
  evolvingWilds: {
    id: "6e01ec28-d815-47a8-ab0f-d383a4736ebe",
    name: "Evolving Wilds",
    layout: "normal",
    mana_cost: "",
    cmc: 0,
    type_line: "Land",
    oracle_text:
      "{T}, Sacrifice this land: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
    color_identity: [],
  },
  hallowedFountain: {
    id: "b7285986-7e08-4969-86ef-452dc5bfdd9f",
    name: "Hallowed Fountain",
    layout: "normal",
    mana_cost: "",
    cmc: 0,
    type_line: "Land — Plains Island",
    oracle_text:
      "({T}: Add {W} or {U}.)\nAs this land enters, you may pay 2 life. If you don't, it enters tapped.",
    color_identity: ["U", "W"],
  },
  tranquilCove: {
    id: "1c4efa6c-4f29-41cd-a728-bf0e479ace05",
    name: "Tranquil Cove",
    layout: "normal",
    mana_cost: "",
    cmc: 0,
    type_line: "Land",
    oracle_text:
      "This land enters tapped.\nWhen this land enters, you gain 1 life.\n{T}: Add {W} or {U}.",
    color_identity: ["U", "W"],
  },
  shatterskullSmashing: {
    id: "bc7239ea-f8aa-4a6f-87bd-c35359635673",
    name: "Shatterskull Smashing // Shatterskull, the Hammer Pass",
    layout: "modal_dfc",
    cmc: 2,
    type_line: "Sorcery // Land",
    color_identity: ["R"],
    card_faces: [
      {
        name: "Shatterskull Smashing",
        mana_cost: "{X}{R}{R}",
        type_line: "Sorcery",
        oracle_text:
          "Shatterskull Smashing deals X damage divided as you choose among up to two target creatures and/or planeswalkers. If X is 6 or more, Shatterskull Smashing deals twice X damage divided as you choose among them instead.",
      },
      {
        name: "Shatterskull, the Hammer Pass",
        mana_cost: "",
        type_line: "Land",
        oracle_text:
          "As this land enters, you may pay 3 life. If you don't, it enters tapped.\n{T}: Add {R}.",
      },
    ],
  },
  exoticOrchard: {
    id: "0a4a51a3-fb8b-4611-8f94-fbcab547423c",
    name: "Exotic Orchard",
    layout: "normal",
    mana_cost: "",
    cmc: 0,
    type_line: "Land",
    oracle_text:
      "{T}: Add one mana of any color that a land an opponent controls could produce.",
    color_identity: [],
  },
  forest: {
    id: "2e781bfd-f8cb-4d20-b977-4359f3a21311",
    name: "Forest",
    layout: "normal",
    mana_cost: "",
    cmc: 0,
    type_line: "Basic Land — Forest",
    oracle_text: "({T}: Add {G}.)",
    color_identity: ["G"],
  },
  harmonize: {
    id: "4e9c9e24-7f41-402c-b346-e553cee90c58",
    name: "Harmonize",
    layout: "normal",
    mana_cost: "{2}{G}{G}",
    cmc: 4,
    type_line: "Sorcery",
    oracle_text: "Draw three cards.",
    color_identity: ["G"],
  },
  phyrexianArena: {
    id: "0784b6f0-9ebf-43d2-ba0f-a6bc93ba0c48",
    name: "Phyrexian Arena",
    layout: "normal",
    mana_cost: "{1}{B}{B}",
    cmc: 3,
    type_line: "Enchantment",
    oracle_text:
      "At the beginning of your upkeep, you draw a card and lose 1 life.",
    color_identity: ["B"],
  },
  counterspell: {
    id: "4f616706-ec97-4923-bb1e-11a69fbaa1f8",
    name: "Counterspell",
    layout: "normal",
    mana_cost: "{U}{U}",
    cmc: 2,
    type_line: "Instant",
    oracle_text: "Counter target spell.",
    color_identity: ["U"],
  },
  fellwarStone: {
    id: "3ef87948-0ad9-4757-a692-2262c8e24367",
    name: "Fellwar Stone",
    layout: "normal",
    mana_cost: "{2}",
    cmc: 2,
    type_line: "Artifact",
    oracle_text:
      "{T}: Add one mana of any color that a land an opponent controls could produce.",
    color_identity: [],
  },
  rampantGrowth: {
    id: "099c081d-06ae-4ca5-ab3b-f70d01509258",
    name: "Rampant Growth",
    layout: "normal",
    mana_cost: "{1}{G}",
    cmc: 2,
    type_line: "Sorcery",
    oracle_text:
      "Search your library for a basic land card, put that card onto the battlefield tapped, then shuffle.",
    color_identity: ["G"],
  },
  treasureMap: {
    id: "a924fe1e-a85e-4e14-88d2-ac55130638ab",
    name: "Treasure Map // Treasure Cove",
    layout: "transform",
    cmc: 2,
    type_line: "Artifact // Land",
    color_identity: [],
    card_faces: [
      {
        name: "Treasure Map",
        mana_cost: "{2}",
        type_line: "Artifact",
        oracle_text:
          '{1}, {T}: Scry 1. Put a landmark counter on this artifact. Then if there are three or more landmark counters on it, remove those counters, transform this artifact, and create three Treasure tokens. (They\'re artifacts with "{T}, Sacrifice this token: Add one mana of any color.")',
      },
      {
        name: "Treasure Cove",
        mana_cost: "",
        type_line: "Land",
        oracle_text:
          "(Transforms from Treasure Map.)\n{T}: Add {C}.\n{T}, Sacrifice a Treasure: Draw a card.",
      },
    ],
  },
  hengegatePathway: {
    id: "7ef37cb3-d803-47d7-8a01-9c803aa2eadc",
    name: "Hengegate Pathway // Mistgate Pathway",
    layout: "modal_dfc",
    cmc: 0,
    type_line: "Land // Land",
    color_identity: ["U", "W"],
    card_faces: [
      {
        name: "Hengegate Pathway",
        mana_cost: "",
        type_line: "Land",
        oracle_text: "{T}: Add {W}.",
      },
      {
        name: "Mistgate Pathway",
        mana_cost: "",
        type_line: "Land",
        oracle_text: "{T}: Add {U}.",
      },
    ],
  },
  glacialFortress: {
    id: "d306154a-7adb-4b35-b0cf-9c8d2fc1f72f",
    name: "Glacial Fortress",
    layout: "normal",
    mana_cost: "",
    cmc: 0,
    type_line: "Land",
    oracle_text:
      "This land enters tapped unless you control a Plains or an Island.\n{T}: Add {W} or {U}.",
    color_identity: ["U", "W"],
  },
  mazeOfIth: {
    id: "5889fde1-730d-43d0-aaa4-499784a80530",
    name: "Maze of Ith",
    layout: "normal",
    mana_cost: "",
    cmc: 0,
    type_line: "Land",
    oracle_text:
      "{T}: Untap target attacking creature. Prevent all combat damage that would be dealt to and dealt by that creature this turn.",
    color_identity: [],
  },
  explosiveVegetation: {
    id: "8de3fdf8-d55e-4ffc-8f8b-6314d4d467ce",
    name: "Explosive Vegetation",
    layout: "normal",
    mana_cost: "{3}{G}",
    cmc: 4,
    type_line: "Sorcery",
    oracle_text:
      "Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.",
    color_identity: ["G"],
  },
} satisfies Record<string, ScryfallCard>;

/** A handle of one recorded card. */
export type RecordedLabCardHandle = keyof typeof RECORDED_LAB_CARDS;
