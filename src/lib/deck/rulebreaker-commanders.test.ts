/**
 * A rulebreaker commander's deck-construction exceptions, at the deck-rules
 * boundary every reader shares: the identity violations, the companion check
 * and the deck size rule.
 *
 * CR 903.5e (edition effective 2026-11-06): a rulebreaker ability modifies
 * deck construction and applies only when that card is the deck's commander.
 * CR 113.6n: it never changes a card's format legality or banned status.
 * The commanders are the recorded Scryfall cards of `rulebreaker-cards-v1.ts`.
 */
import { describe, expect, it } from "vitest";
import {
  RECORDED_RULEBREAKER_CARDS,
  type RecordedRulebreakerCard,
} from "@/modules/format-rules/domain/fixtures/rulebreaker-cards-v1";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import {
  getColorIdentityViolations,
  isCompanionOutsideColorIdentity,
} from "./color-identity";
import { deckSizeStatus } from "@/modules/format-rules";
import {
  COMMANDER_DECK_SIZE,
  deckSizeRuleOf,
  formatDeckCount,
} from "./deck-size";
import { computeDeckStats } from "./stats";
import type { DeckCard } from "./types";

/** The recorded card as the deck stores its commander. */
function asCommander(card: RecordedRulebreakerCard): DeckCard {
  return aDeckCard({
    id: `commander-${card.oracle_id}`,
    scryfallId: card.id,
    name: card.name,
    manaCost: card.mana_cost,
    cmc: card.cmc,
    typeLine: card.type_line,
    oracleText: card.oracle_text,
    colorIdentity: [...card.color_identity],
    category: "commander",
  });
}

/** Fallen Angel, a mono-black Angel ({3}{B}{B}). */
const MONO_BLACK_ANGEL = aDeckCard({
  id: "fallen-angel",
  name: "Fallen Angel",
  cmc: 5,
  typeLine: "Creature — Angel",
  colorIdentity: ["B"],
});

const { grizzlegom, maular, seluma } = RECORDED_RULEBREAKER_CARDS;

/** The five basic lands with a colour, in WUBRG order. */
const BASICS = [
  { name: "Plains", colour: "W" },
  { name: "Island", colour: "U" },
  { name: "Swamp", colour: "B" },
  { name: "Mountain", colour: "R" },
  { name: "Forest", colour: "G" },
] as const;

/** Gravedigger, a mono-black Zombie ({3}{B}). */
const MONO_BLACK_ZOMBIE = aDeckCard({
  id: "gravedigger",
  name: "Gravedigger",
  cmc: 4,
  typeLine: "Creature — Zombie",
  colorIdentity: ["B"],
});

/** The names of the deck's identity violations. */
function violationNames(
  commander: DeckCard,
  cards: readonly DeckCard[]
): readonly string[] {
  return getColorIdentityViolations(
    aDeck({ commander, cards: [...cards] })
  ).map(({ cardName }) => cardName);
}

describe("a deck led by a rulebreaker commander (CR 903.5e)", () => {
  it("reports no identity violation for a mono-black Angel under Seluma", () => {
    const deck = aDeck({
      commander: asCommander(seluma),
      cards: [MONO_BLACK_ANGEL],
    });

    expect(getColorIdentityViolations(deck)).toEqual([]);
  });

  it("still reports a mono-black card that is no Angel under Seluma", () => {
    expect(
      violationNames(asCommander(seluma), [MONO_BLACK_ANGEL, MONO_BLACK_ZOMBIE])
    ).toEqual(["Gravedigger"]);
  });

  it("admits an off-colour nonbasic land under Grizzlegom, but no off-colour spell", () => {
    const underground = aDeckCard({
      id: "underground-river",
      name: "Underground River",
      typeLine: "Land",
      colorIdentity: ["B", "U"],
    });

    expect(
      violationNames(asCommander(grizzlegom), [underground, MONO_BLACK_ZOMBIE])
    ).toEqual(["Gravedigger"]);
  });

  it("reads a double-faced card by its front face: Grizzlegom does not admit a spell whose back is a land (CR 712.8a)", () => {
    const hagra = aDeckCard({
      id: "hagra",
      name: "Hagra Mauling // Hagra Broodpit",
      cmc: 4,
      typeLine: "Instant // Land",
      colorIdentity: ["B"],
    });

    expect(violationNames(asCommander(grizzlegom), [hagra])).toEqual([
      "Hagra Mauling // Hagra Broodpit",
    ]);
  });

  it("admits off-colour creatures of mana value 7 or more under Maular, not of 6 or a 7-mana sorcery", () => {
    const koma = aDeckCard({
      id: "koma",
      name: "Koma, Cosmos Serpent",
      cmc: 9,
      typeLine: "Legendary Creature — Serpent",
      colorIdentity: ["G", "U"],
    });
    const archon = aDeckCard({
      id: "archon",
      name: "Archon of Cruelty",
      cmc: 8,
      typeLine: "Creature — Archon",
      colorIdentity: ["B"],
    });
    const sixDrop = aDeckCard({
      id: "six",
      name: "Grave Titan",
      cmc: 6,
      typeLine: "Creature — Giant",
      colorIdentity: ["B"],
    });
    const sorcery = aDeckCard({
      id: "sorcery",
      name: "Decree of Pain",
      cmc: 8,
      typeLine: "Sorcery",
      colorIdentity: ["B"],
    });

    expect(
      violationNames(asCommander(maular), [koma, archon, sixDrop, sorcery])
    ).toEqual(["Decree of Pain", "Grave Titan"]);
  });

  it("admits off-colour artifact creatures and Equipment under The Everforger, not other artifacts", () => {
    const cards = [
      aDeckCard({
        id: "a",
        name: "Etherium Sculptor",
        typeLine: "Artifact Creature — Vedalken Artificer",
        colorIdentity: ["U"],
      }),
      aDeckCard({
        id: "b",
        name: "Embercleave",
        typeLine: "Artifact — Equipment",
        colorIdentity: ["R"],
      }),
      aDeckCard({
        id: "c",
        name: "Arcane Signet",
        typeLine: "Artifact",
        colorIdentity: ["U"],
      }),
    ];

    expect(
      violationNames(asCommander(RECORDED_RULEBREAKER_CARDS.everforger), cards)
    ).toEqual(["Arcane Signet"]);
  });

  it("admits off-colour Auras under The Unluckiest Planeswalker", () => {
    const aura = aDeckCard({
      id: "aura",
      name: "Rancor",
      typeLine: "Enchantment — Aura",
      colorIdentity: ["G"],
    });

    expect(
      violationNames(
        asCommander(RECORDED_RULEBREAKER_CARDS.unluckiestPlaneswalker),
        [aura, MONO_BLACK_ZOMBIE]
      )
    ).toEqual(["Gravedigger"]);
  });

  it("admits off-colour Phyrexians under Valko Indorian", () => {
    const phyrexian = aDeckCard({
      id: "phyrexian",
      name: "Elesh Norn, Mother of Machines",
      typeLine: "Legendary Creature — Phyrexian Praetor",
      colorIdentity: ["W"],
    });
    const angel = { ...MONO_BLACK_ANGEL, colorIdentity: ["W"] };

    expect(
      violationNames(asCommander(RECORDED_RULEBREAKER_CARDS.valko), [
        phyrexian,
        angel,
      ])
    ).toEqual(["Fallen Angel"]);
  });

  it("currently still reports an off-colour instant under Tolabow: the deck stores no chosen colour (pinned; follow-up)", () => {
    const bolt = aDeckCard({
      id: "bolt",
      name: "Lightning Bolt",
      cmc: 1,
      typeLine: "Instant",
      colorIdentity: ["R"],
    });

    expect(
      violationNames(asCommander(RECORDED_RULEBREAKER_CARDS.tolabow), [bolt])
    ).toEqual(["Lightning Bolt"]);
  });

  const recorded: readonly RecordedRulebreakerCard[] = Object.values(
    RECORDED_RULEBREAKER_CARDS
  );
  describe.each(recorded)("an off-colour basic land under $name", (card) => {
    const offColour = BASICS.find(
      ({ colour }) => !card.color_identity.includes(colour)
    );
    const grantsBasics = /any (basic )?land cards/.test(card.oracle_text);

    it(`is ${grantsBasics ? "admitted" : "reported"}, as its Oracle text says`, () => {
      const basic = aDeckCard({
        id: "basic",
        name: offColour?.name,
        typeLine: `Basic Land — ${offColour?.name}`,
        colorIdentity: [offColour?.colour ?? ""],
      });

      expect(violationNames(asCommander(card), [basic])).toHaveLength(
        grantsBasics ? 0 : 1
      );
    });
  });
});

describe("a deck whose commander is no rulebreaker", () => {
  it("reports an off-colour Angel when Seluma is in the 99, not the command zone (CR 903.5e)", () => {
    const commander = aDeckCard({
      id: "commander",
      name: "Giada, Font of Hope",
      typeLine: "Legendary Creature — Angel",
      colorIdentity: ["W"],
      category: "commander",
    });
    const selumaInThe99 = {
      ...asCommander(seluma),
      id: "seluma-99",
      category: "creature" as const,
    };

    expect(
      violationNames(commander, [selumaInThe99, MONO_BLACK_ANGEL])
    ).toEqual(["Fallen Angel"]);
  });

  it("finds a stored commander by its exact Oracle name only: 'seluma, light of aysen' grants nothing (pinned until DeckCard stores an Oracle id)", () => {
    const lowerCase = {
      ...asCommander(seluma),
      name: "seluma, light of aysen",
    };
    const noComma = { ...asCommander(seluma), name: "Seluma Light of Aysen" };

    expect(violationNames(lowerCase, [MONO_BLACK_ANGEL])).toEqual([
      "Fallen Angel",
    ]);
    expect(violationNames(noComma, [MONO_BLACK_ANGEL])).toEqual([
      "Fallen Angel",
    ]);
  });
});

describe("legality under a rulebreaker commander (CR 113.6n)", () => {
  it("keeps a banned Angel among the banned cards while Seluma admits its colours", () => {
    const bannedAngel = { ...MONO_BLACK_ANGEL, isBanned: true };
    const stats = computeDeckStats(
      aDeck({ commander: asCommander(seluma), cards: [bannedAngel] })
    );

    expect(stats.colorIdentityViolations).toEqual([]);
    expect(stats.bannedCards).toEqual(["Fallen Angel"]);
  });
});

describe("the companion under a rulebreaker commander (CR 903.5e)", () => {
  it("is inside the identity when the commander admits it: Gyruda, mana value 8, under Maular", () => {
    const gyruda = aDeckCard({
      id: "gyruda",
      name: "Gyruda, Doom of Depths",
      cmc: 8,
      typeLine: "Legendary Creature — Demon Kraken",
      colorIdentity: ["B", "U"],
      category: "companion",
    });
    const deck = aDeck({ commander: asCommander(maular), companion: gyruda });

    expect(isCompanionOutsideColorIdentity(deck)).toBe(false);
  });
});

describe("the deck size under a rulebreaker commander (CR 903.5e)", () => {
  const whtz = asCommander(RECORDED_RULEBREAKER_CARDS.whtz);

  it("reads a 200-card Whtz deck as legal: the deck has no maximum size", () => {
    const rule = deckSizeRuleOf(
      aDeck({ commander: whtz }),
      COMMANDER_DECK_SIZE
    );

    expect(deckSizeStatus(200, rule)).toBe("legal");
  });

  it("shows a Whtz deck's count without a maximum, and still reads 99 cards as short", () => {
    const rule = deckSizeRuleOf(
      aDeck({ commander: whtz }),
      COMMANDER_DECK_SIZE
    );

    expect(formatDeckCount(200, rule, "/")).toBe("200");
    expect(deckSizeStatus(99, rule)).toBe("short");
  });

  it("keeps the 100-card maximum when Whtz is in the 99 rather than the command zone", () => {
    const commander = aDeckCard({
      id: "commander",
      name: "Talrand, Sky Summoner",
      category: "commander",
    });
    const rule = deckSizeRuleOf(
      aDeck({
        commander,
        cards: [{ ...whtz, id: "whtz-99", category: "creature" }],
      }),
      COMMANDER_DECK_SIZE
    );

    expect(deckSizeStatus(200, rule)).toBe("over");
    expect(formatDeckCount(200, rule, " / ")).toBe("200 / 100");
  });

  it("lifts the maximum for Whtz as the second commander too", () => {
    const commander = aDeckCard({
      id: "commander",
      name: "Thrasios, Triton Hero",
      category: "commander",
    });
    const rule = deckSizeRuleOf(
      aDeck({ commander, partner: whtz }),
      COMMANDER_DECK_SIZE
    );

    expect(rule.maximum).toBeNull();
  });
});
