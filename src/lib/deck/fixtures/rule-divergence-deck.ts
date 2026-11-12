/**
 * One Commander deck that sets every analysis divergence apart, for the
 * characterization suites that pin them (P1-10).
 *
 * Tatyova, Benthic Druid leads with Keruga, the Macrosage as companion. The
 * deck holds what makes today's counters disagree: basic lands in rows of
 * many copies, a land the player re-filed as ramp, a Game Changer in the main
 * deck and another in "Considering" (the maybeboard). Prices are round test
 * values, not market data.
 *
 * Used by `lib/deck/rule-divergences.characterization.test.ts` (analysis
 * functions and hooks) and `components/deck/ShareDeckView.test.tsx` (the
 * shared deck page), so both read the same deck.
 *
 * @module deck/fixtures/rule-divergence-deck
 */
import type { ApiCard, ApiSharedDeck } from "@/lib/deck/share-types";
import type { Deck, DeckCard } from "@/lib/deck/types";

/** A deck row with the fields no divergence depends on filled in. */
export function divergenceCard(
  overrides: Partial<DeckCard> & Pick<DeckCard, "name">
): DeckCard {
  return {
    id: `row-${overrides.name}`,
    manaCost: "",
    cmc: 0,
    typeLine: "",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "other",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

const TATYOVA = divergenceCard({
  name: "Tatyova, Benthic Druid",
  manaCost: "{3}{G}{U}",
  cmc: 5,
  typeLine: "Legendary Creature — Merfolk Druid",
  colorIdentity: ["G", "U"],
  category: "commander",
  price: 0.25,
});

const KERUGA = divergenceCard({
  name: "Keruga, the Macrosage",
  manaCost: "{3}{G/U}{G/U}",
  cmc: 5,
  typeLine: "Legendary Creature — Dinosaur Hippo",
  colorIdentity: ["G", "U"],
  category: "companion",
  price: 0.75,
});

const MAIN_DECK: readonly DeckCard[] = [
  divergenceCard({
    name: "Forest",
    typeLine: "Basic Land — Forest",
    colorIdentity: ["G"],
    category: "land",
    quantity: 10,
    price: 0.1,
  }),
  divergenceCard({
    name: "Island",
    typeLine: "Basic Land — Island",
    colorIdentity: ["U"],
    category: "land",
    quantity: 9,
    price: 0.1,
  }),
  // A land the player dragged into the Ramp group: its type line still says Land.
  divergenceCard({
    name: "Evolving Wilds",
    typeLine: "Land",
    category: "ramp",
    price: 0.2,
  }),
  divergenceCard({
    name: "Rhystic Study",
    manaCost: "{2}{U}",
    cmc: 3,
    typeLine: "Enchantment",
    colorIdentity: ["U"],
    isGameChanger: true,
    category: "draw",
    price: 30,
  }),
  divergenceCard({
    name: "Cultivate",
    manaCost: "{2}{G}",
    cmc: 3,
    typeLine: "Sorcery",
    colorIdentity: ["G"],
    category: "ramp",
    price: 0.5,
  }),
  divergenceCard({
    name: "Kodama's Reach",
    manaCost: "{2}{G}",
    cmc: 3,
    typeLine: "Sorcery — Arcane",
    colorIdentity: ["G"],
    category: "ramp",
    price: 0.4,
  }),
];

const THE_ONE_RING = divergenceCard({
  name: "The One Ring",
  manaCost: "{4}",
  cmc: 4,
  typeLine: "Legendary Artifact",
  isGameChanger: true,
  category: "draw",
  price: 50,
  zone: "maybeboard",
  isMaybeboard: true,
});

/**
 * The deck as the deck store holds it: `cards` lists every non-command row,
 * "Considering" included, and `maybeboard` mirrors the "Considering" rows.
 */
export const RULE_DIVERGENCE_DECK: Deck = {
  id: "deck-rule-divergences",
  name: "Tatyova lands",
  commander: TATYOVA,
  partner: null,
  companion: KERUGA,
  pairingType: "none",
  cards: [...MAIN_DECK, THE_ONE_RING],
  maybeboard: [THE_ONE_RING],
  format: "commander",
  // Rows, as a full load derives it (`apiDeckToStoreDeck`); no analysis reads it.
  cardCount: 9,
  targetBracket: 3,
  manualBracket: null,
  budget: null,
  description: "",
  tags: [],
  shareToken: null,
  shareEnabled: false,
  isPublic: false,
  isAIGenerated: false,
  createdAt: new Date("2026-11-11T00:00:00.000Z"),
  updatedAt: new Date("2026-11-11T00:00:00.000Z"),
};

function sharedRow(
  card: DeckCard,
  flags: Pick<ApiCard, "isCommander" | "isPartner">
): ApiCard {
  return {
    id: card.id,
    name: card.name,
    manaCost: card.manaCost,
    cmc: card.cmc,
    colorIdentity: card.colorIdentity,
    imageUri: card.imageUri,
    artCropUri: card.artCropUri,
    category: card.category,
    quantity: card.quantity,
    isGameChanger: card.isGameChanger,
    ...flags,
  };
}

/**
 * The same deck as `GET /api/share/[token]` serves it to `ShareDeckView`:
 * one row per deck card, command zone included, flagged the way the store
 * saves them (a partner row is `isCommander` and `isPartner`; a companion row
 * is neither and has the `companion` category). The share select carries no
 * `zone`, so a "Considering" row looks like a main-deck row.
 */
export function sharedDeckOf(deck: Deck): ApiSharedDeck {
  const commandRows = [
    ...(deck.commander
      ? [sharedRow(deck.commander, { isCommander: true, isPartner: false })]
      : []),
    ...(deck.partner
      ? [sharedRow(deck.partner, { isCommander: true, isPartner: true })]
      : []),
    ...(deck.companion
      ? [sharedRow(deck.companion, { isCommander: false, isPartner: false })]
      : []),
  ];
  return {
    id: deck.id,
    name: deck.name,
    format: deck.format,
    targetBracket: deck.targetBracket,
    budget: deck.budget,
    cards: [
      ...commandRows,
      ...deck.cards.map((card) =>
        sharedRow(card, { isCommander: false, isPartner: false })
      ),
    ],
  };
}
