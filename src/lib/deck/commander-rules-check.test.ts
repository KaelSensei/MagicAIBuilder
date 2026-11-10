import { describe, expect, it } from "vitest";
import type { Deck, DeckCard } from "./types";
import {
  COMMANDER_RULE_CITATIONS,
  getCommanderRuleIssues,
} from "./commander-rules-check";

// Oracle text below is copied from Scryfall (2026-11-09). Each card keeps its
// real wording, so a pattern that drifts from Oracle fails here first.

function makeCard(overrides: Partial<DeckCard>): DeckCard {
  return {
    id: "card",
    name: "Card",
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

const ARCANE_SIGNET = makeCard({
  id: "arcane-signet",
  name: "Arcane Signet",
  typeLine: "Artifact",
  oracleText:
    "{T}: Add one mana of any color in your commander's color identity.",
});

const COMMAND_TOWER = makeCard({
  id: "command-tower",
  name: "Command Tower",
  typeLine: "Land",
  oracleText:
    "{T}: Add one mana of any color in your commander's color identity.",
});

const PATH_OF_ANCESTRY = makeCard({
  id: "path-of-ancestry",
  name: "Path of Ancestry",
  typeLine: "Land",
  oracleText:
    "This land enters tapped.\n{T}: Add one mana of any color in your commander's color identity. When that mana is spent to cast a creature spell that shares a creature type with your commander, scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
});

/** Karn, Silver Golem: a colorless commander with no color choice. */
const KARN = makeCard({
  id: "karn",
  name: "Karn, Silver Golem",
  manaCost: "{5}",
  typeLine: "Legendary Artifact Creature — Golem",
  category: "commander",
  oracleText:
    "Whenever Karn blocks or becomes blocked, it gets -4/+4 until end of turn.\n{1}: Target noncreature artifact becomes an artifact creature with power and toughness each equal to its mana value until end of turn.",
  colorIdentity: [],
});

const GIADA = makeCard({
  id: "giada",
  name: "Giada, Font of Hope",
  manaCost: "{1}{W}",
  typeLine: "Legendary Creature — Angel",
  category: "commander",
  oracleText:
    "Flying, vigilance\nEach other Angel you control enters with an additional +1/+1 counter on it for each Angel you already control.\n{T}: Add {W}. Spend this mana only to cast an Angel spell.",
  colorIdentity: ["W"],
});

const SELVALA = makeCard({
  id: "selvala",
  name: "Selvala, Heart of the Wilds",
  manaCost: "{1}{G}{G}",
  typeLine: "Legendary Creature — Elf Scout",
  category: "commander",
  oracleText:
    "Whenever another creature enters, its controller may draw a card if its power is greater than each other creature's power.\n{G}, {T}: Add X mana in any combination of colors, where X is the greatest power among creatures you control.",
  colorIdentity: ["G"],
});

function makeDeck(overrides: Partial<Deck>): Deck {
  return {
    id: "deck",
    name: "Deck",
    format: "commander",
    commander: KARN,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    cardCount: 0,
    targetBracket: 2,
    manualBracket: null,
    budget: null,
    tags: [],
    description: "",
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    shareToken: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

/** Names the rules check flags for one card in a deck led by `deck`'s commanders. */
function flaggedNames(
  card: DeckCard,
  deck: Partial<Deck> = {}
): readonly string[] {
  return getCommanderRuleIssues(makeDeck({ ...deck, cards: [card] })).map(
    (issue) => issue.cardName
  );
}

describe("getCommanderRuleIssues: commander color identity mana", () => {
  it.each([
    { label: "Arcane Signet", card: ARCANE_SIGNET },
    { label: "Command Tower", card: COMMAND_TOWER },
    {
      label: "Path of Ancestry (enters tapped, scry rider, reminder text)",
      card: PATH_OF_ANCESTRY,
    },
    {
      label: "Path of Ancestry in its pre-2024 Oracle wording",
      card: makeCard({
        ...PATH_OF_ANCESTRY,
        oracleText:
          "Path of Ancestry enters the battlefield tapped.\n{T}: Add one mana of any color in your commander's color identity. When that mana is spent to cast a creature spell that shares a creature type with your commander, scry 1. (Look at the top card of your library. You may put that card on the bottom of your library.)",
      }),
    },
    {
      label: "Arcane Signet stored with a typographic apostrophe",
      card: makeCard({
        ...ARCANE_SIGNET,
        oracleText:
          "{T}: Add one mana of any color in your commander’s color identity.",
      }),
    },
  ])("flags $label under a colorless commander", ({ card }) => {
    expect(flaggedNames(card)).toEqual([card.name]);
  });

  it.each([
    {
      label: "Commander's Sphere (it can still be sacrificed to draw)",
      card: makeCard({
        name: "Commander's Sphere",
        typeLine: "Artifact",
        oracleText:
          "{T}: Add one mana of any color in your commander's color identity.\nSacrifice this artifact: Draw a card.",
      }),
    },
    {
      label: "Opal Palace (its first ability still adds {C})",
      card: makeCard({
        name: "Opal Palace",
        typeLine: "Land",
        oracleText:
          "{T}: Add {C}.\n{1}, {T}: Add one mana of any color in your commander's color identity. If you spend this mana to cast your commander, it enters with a number of additional +1/+1 counters on it equal to the number of times it's been cast from the command zone this game.",
      }),
    },
    {
      label: "Hidden Hideout (its lifelink ability still works)",
      card: makeCard({
        name: "Hidden Hideout",
        typeLine: "Land",
        oracleText:
          "This land enters tapped.\n{T}: Add one mana of any color in your commander's color identity.\n{2}, {T}: Target creature you control with a counter on it gains lifelink until end of turn.",
      }),
    },
    {
      label: "Commander's Plate (protection from every color)",
      card: makeCard({
        name: "Commander's Plate",
        typeLine: "Artifact — Equipment",
        oracleText:
          "Equipped creature gets +3/+3 and has protection from each color that's not in your commander's color identity.\nEquip commander {3}\nEquip {5}",
      }),
    },
    {
      label: "Fellwar Stone (opponents' lands, not the commander)",
      card: makeCard({
        name: "Fellwar Stone",
        typeLine: "Artifact",
        oracleText:
          "{T}: Add one mana of any color that a land an opponent controls could produce.",
      }),
    },
    {
      label: "Exotic Orchard (opponents' lands, not the commander)",
      card: makeCard({
        name: "Exotic Orchard",
        typeLine: "Land",
        oracleText:
          "{T}: Add one mana of any color that a land an opponent controls could produce.",
      }),
    },
    {
      label: "Sol Ring",
      card: makeCard({
        name: "Sol Ring",
        typeLine: "Artifact",
        oracleText: "{T}: Add {C}{C}.",
      }),
    },
    {
      label:
        "Treasure Map // Treasure Cove (both faces read; reminder text ignored)",
      card: makeCard({
        name: "Treasure Map // Treasure Cove",
        typeLine: "Artifact // Land",
        layout: "transform",
        oracleText:
          '{1}, {T}: Scry 1. Put a landmark counter on this artifact. Then if there are three or more landmark counters on it, remove those counters, transform this artifact, and create three Treasure tokens. (They\'re artifacts with "{T}, Sacrifice this token: Add one mana of any color.")',
        cardFaces: [
          {
            name: "Treasure Map",
            manaCost: "{2}",
            typeLine: "Artifact",
            oracleText:
              '{1}, {T}: Scry 1. Put a landmark counter on this artifact. Then if there are three or more landmark counters on it, remove those counters, transform this artifact, and create three Treasure tokens. (They\'re artifacts with "{T}, Sacrifice this token: Add one mana of any color.")',
            imageUri: "",
            artCropUri: "",
          },
          {
            name: "Treasure Cove",
            manaCost: "",
            typeLine: "Land",
            oracleText:
              "(Transforms from Treasure Map.)\n{T}: Add {C}.\n{T}, Sacrifice a Treasure: Draw a card.",
            imageUri: "",
            artCropUri: "",
          },
        ],
      }),
    },
  ])("does not flag $label under a colorless commander", ({ card }) => {
    expect(flaggedNames(card)).toEqual([]);
  });

  it.each([
    { label: "a mono-white commander", deck: { commander: GIADA } },
    {
      label:
        "a colorless commander with a green second commander (CR 702.124c)",
      deck: { partner: SELVALA },
    },
    {
      label:
        "The Prismatic Piper, whose color is chosen before the game (CR 903.4b)",
      deck: {
        commander: makeCard({
          id: "piper",
          name: "The Prismatic Piper",
          typeLine: "Legendary Creature — Shapeshifter",
          category: "commander",
          oracleText:
            "If The Prismatic Piper is your commander, choose a color before the game begins. The Prismatic Piper is the chosen color.\nPartner (You can have two commanders if both have partner.)",
          colorIdentity: [],
        }),
      },
    },
    {
      label: "Clara Oswald, whose color is chosen before the game (CR 903.4b)",
      deck: {
        commander: makeCard({
          id: "clara",
          name: "Clara Oswald",
          typeLine: "Legendary Creature — Human Advisor",
          category: "commander",
          oracleText:
            "Impossible Girl — If Clara Oswald is your commander, choose a color before the game begins. Clara Oswald is the chosen color.\nIf a triggered ability of a Doctor you control triggers, that ability triggers an additional time.\nDoctor's companion (You can have two commanders if the other is the Doctor.)",
          colorIdentity: [],
        }),
      },
    },
    {
      label: "Faceless One as the second commander (CR 903.4b)",
      deck: {
        partner: makeCard({
          id: "faceless-one",
          name: "Faceless One",
          typeLine: "Legendary Enchantment Creature — Background",
          category: "commander",
          oracleText:
            "If Faceless One is your commander, choose a color before the game begins. Faceless One is the chosen color.\nChoose a Background (You can have a Background as a second commander.)",
          colorIdentity: [],
        }),
      },
    },
    {
      label: "a white commander stored without its color identity",
      deck: { commander: { ...GIADA, colorIdentity: [] } },
    },
    { label: "no commander yet", deck: { commander: null } },
    {
      label: "an Oathbreaker deck (not covered by CR 903)",
      deck: { format: "oathbreaker" as const },
    },
    { label: "a Standard deck", deck: { format: "standard" as const } },
  ])("does not flag Arcane Signet with $label", ({ deck }) => {
    expect(flaggedNames(ARCANE_SIGNET, deck)).toEqual([]);
  });

  it.each([
    { label: "a Brawl deck (CR 903.12a)", deck: { format: "brawl" as const } },
    {
      label: "a commander whose identity is stored with the colorless marker",
      deck: { commander: makeCard({ ...KARN, colorIdentity: ["C"] }) },
    },
  ])("flags Arcane Signet with $label", ({ deck }) => {
    expect(flaggedNames(ARCANE_SIGNET, deck)).toEqual(["Arcane Signet"]);
  });

  it("ignores cards outside the main deck", () => {
    const deck = makeDeck({
      cards: [
        { ...ARCANE_SIGNET, zone: "sideboard" },
        { ...COMMAND_TOWER, zone: "maybeboard" },
      ],
    });

    expect(getCommanderRuleIssues(deck)).toEqual([]);
  });

  it("reports each flagged card with its rule, ordered by name then id", () => {
    const deck = makeDeck({
      cards: [
        PATH_OF_ANCESTRY,
        COMMAND_TOWER,
        { ...ARCANE_SIGNET, id: "signet-b" },
        { ...ARCANE_SIGNET, id: "signet-a" },
      ],
    });

    expect(getCommanderRuleIssues(deck)).toEqual([
      {
        cardId: "signet-a",
        cardName: "Arcane Signet",
        rule: "colorless-identity-mana",
      },
      {
        cardId: "signet-b",
        cardName: "Arcane Signet",
        rule: "colorless-identity-mana",
      },
      {
        cardId: "command-tower",
        cardName: "Command Tower",
        rule: "colorless-identity-mana",
      },
      {
        cardId: "path-of-ancestry",
        cardName: "Path of Ancestry",
        rule: "colorless-identity-mana",
      },
    ]);
  });

  it("cites the color identity and undefined-mana rules", () => {
    expect(COMMANDER_RULE_CITATIONS["colorless-identity-mana"]).toEqual([
      "903.4",
      "106.5",
    ]);
  });
});
