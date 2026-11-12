import type { ScryfallCard } from "@/lib/scryfall/types";

/**
 * Scryfall card data for the generated-deck legality tests.
 *
 * Each entry carries only the fields the check reads: name, type line, oracle
 * text, colour identity, keywords and Commander legality.
 */
type FixtureCard = Omit<ScryfallCard, "id" | "cmc">;

function card(fields: FixtureCard): ScryfallCard {
  return {
    id: fields.name.toLowerCase().replaceAll(/\W+/g, "-"),
    cmc: 0,
    ...fields,
  };
}

const LEGAL = { commander: "legal" } as const;

/** Commander-legal cards, keyed by the name a model would write. */
export const GENERATED_DECK_CARDS = {
  talrand: card({
    name: "Talrand, Sky Summoner",
    type_line: "Legendary Creature — Merfolk Wizard",
    oracle_text:
      "Whenever you cast an instant or sorcery spell, create a 2/2 blue Drake creature token with flying.",
    color_identity: ["U"],
    legalities: LEGAL,
  }),
  tymna: card({
    name: "Tymna the Weaver",
    type_line: "Legendary Creature — Human Cleric",
    oracle_text:
      "Lifelink\nPartner (You can have two commanders if both have partner.)",
    color_identity: ["W", "B"],
    keywords: ["Lifelink", "Partner"],
    legalities: LEGAL,
  }),
  thrasios: card({
    name: "Thrasios, Triton Hero",
    type_line: "Legendary Creature — Merfolk Wizard",
    oracle_text:
      "{4}: Scry 1, then reveal the top card of your library.\nPartner (You can have two commanders if both have partner.)",
    color_identity: ["G", "U"],
    keywords: ["Partner"],
    legalities: LEGAL,
  }),
  wilson: card({
    name: "Wilson, Refined Grizzly",
    type_line: "Legendary Creature — Bear Warrior",
    oracle_text:
      "Choose a Background (You can have a Background as a second commander.)",
    color_identity: ["G"],
    legalities: LEGAL,
  }),
  raisedByGiants: card({
    name: "Raised by Giants",
    type_line: "Legendary Enchantment — Background",
    oracle_text:
      "Commander creatures you own have base power and toughness 10/10 and are Giants in addition to their other types.",
    color_identity: ["G"],
    legalities: LEGAL,
  }),
  grizzlyBears: card({
    name: "Grizzly Bears",
    type_line: "Creature — Bear",
    color_identity: ["G"],
    legalities: LEGAL,
  }),
  leovold: card({
    name: "Leovold, Emissary of Trest",
    type_line: "Legendary Creature — Elf Advisor",
    oracle_text: "Each opponent can't draw more than one card each turn.",
    color_identity: ["B", "G", "U"],
    legalities: { commander: "banned" },
  }),
  solRing: card({
    name: "Sol Ring",
    type_line: "Artifact",
    oracle_text: "{T}: Add {C}{C}.",
    color_identity: [],
    legalities: LEGAL,
  }),
  counterspell: card({
    name: "Counterspell",
    type_line: "Instant",
    oracle_text: "Counter target spell.",
    color_identity: ["U"],
    legalities: LEGAL,
  }),
  lightningBolt: card({
    name: "Lightning Bolt",
    type_line: "Instant",
    oracle_text: "Lightning Bolt deals 3 damage to any target.",
    color_identity: ["R"],
    legalities: LEGAL,
  }),
  manaCrypt: card({
    name: "Mana Crypt",
    type_line: "Artifact",
    oracle_text: "{T}: Add {C}{C}.",
    color_identity: [],
    legalities: { commander: "banned" },
  }),
  moxLotus: card({
    name: "Mox Lotus",
    type_line: "Artifact",
    oracle_text: "{T}: Add {∞}.",
    color_identity: [],
    legalities: { commander: "not_legal" },
  }),
  persistentPetitioners: card({
    name: "Persistent Petitioners",
    type_line: "Creature — Human Advisor",
    oracle_text:
      "A deck can have any number of cards named Persistent Petitioners.",
    color_identity: ["U"],
    legalities: LEGAL,
  }),
  nazgul: card({
    name: "Nazgûl",
    type_line: "Creature — Wraith Knight",
    oracle_text: "Deathtouch\nA deck can have up to nine cards named Nazgûl.",
    color_identity: ["B"],
    legalities: LEGAL,
  }),
  plains: card({
    name: "Plains",
    type_line: "Basic Land — Plains",
    color_identity: ["W"],
    legalities: LEGAL,
  }),
  island: card({
    name: "Island",
    type_line: "Basic Land — Island",
    color_identity: ["U"],
    legalities: LEGAL,
  }),
  forest: card({
    name: "Forest",
    type_line: "Basic Land — Forest",
    color_identity: ["G"],
    legalities: LEGAL,
  }),
} as const satisfies Record<string, ScryfallCard>;

/** Every fixture card, in the shape Scryfall's collection endpoint returns. */
export const ALL_GENERATED_DECK_CARDS: readonly ScryfallCard[] =
  Object.values(GENERATED_DECK_CARDS);
