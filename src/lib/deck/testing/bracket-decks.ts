/**
 * Fixture decks for the bracket estimate (I-77 slice 1): Commander lists built
 * from cards whose stored category is the one `categorizeCard` gives their
 * text, so every card reads as placed by a rule unless a test moves it.
 *
 * Shared by `explain-bracket.test.ts` and `bracket-projection.test.ts`. The
 * card texts are minimal Oracle wordings the classifier reads; the names are
 * only labels, except where a real card is named for its Game Changer status.
 *
 * @module deck/testing/bracket-decks
 */
import type { Combo } from "@/modules/combos";
import type { DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";

/** A basic land: category `land`, left out of the average mana value. */
export function aBasicLand(index: number): DeckCard {
  return aDeckCard({
    id: `land-${index}`,
    name: `Forest ${index}`,
    typeLine: "Basic Land — Forest",
    oracleText: "({T}: Add {G}.)",
    category: "land",
  });
}

/** A mana rock the classifier reads as ramp ("add {"). */
export function aRampCard(index: number, cmc = 3): DeckCard {
  return aDeckCard({
    id: `ramp-${index}`,
    name: `Mana Rock ${index}`,
    cmc,
    typeLine: "Artifact",
    oracleText: "{T}: Add {C}.",
    category: "ramp",
  });
}

/** A sorcery the classifier reads as draw. */
export function aDrawCard(index: number, cmc = 3): DeckCard {
  return aDeckCard({
    id: `draw-${index}`,
    name: `Divination ${index}`,
    cmc,
    typeLine: "Sorcery",
    oracleText: "Draw two cards.",
    category: "draw",
  });
}

/** An instant the classifier reads as removal ("destroy target"). */
export function aRemovalCard(index: number, cmc = 3): DeckCard {
  return aDeckCard({
    id: `removal-${index}`,
    name: `Murder ${index}`,
    cmc,
    typeLine: "Instant",
    oracleText: "Destroy target creature.",
    category: "removal",
  });
}

/** A vanilla creature: no term counts it, only the average mana value. */
export function aCreature(index: number, cmc = 4): DeckCard {
  return aDeckCard({
    id: `creature-${index}`,
    name: `Bear ${index}`,
    cmc,
    typeLine: "Creature — Bear",
    category: "creature",
  });
}

/** Drannith Magistrate, a Game Changer on Wizards' list, read as a creature. */
export function drannithMagistrate(): DeckCard {
  return aDeckCard({
    id: "gc-drannith",
    name: "Drannith Magistrate",
    cmc: 2,
    typeLine: "Creature — Human Wizard",
    oracleText:
      "Your opponents can't cast spells from anywhere other than their hands.",
    category: "creature",
    isGameChanger: true,
  });
}

/** `count` cards from `make`, numbered from 0. */
export function cards(
  count: number,
  make: (index: number) => DeckCard
): DeckCard[] {
  return Array.from({ length: count }, (_, index) => make(index));
}

/**
 * A 99-card Core list: 37 lands, 8 ramp, 8 draw, 6 removal at mana value 3,
 * and 40 creatures at mana value 4. Its terms read ramp 2, draw 2, removal 2,
 * win speed 1 and average mana value 1, so the heuristic is 1.6, a 2.
 */
export function aCoreList(): DeckCard[] {
  return [
    ...cards(37, aBasicLand),
    ...cards(8, (i) => aRampCard(i)),
    ...cards(8, (i) => aDrawCard(i)),
    ...cards(6, (i) => aRemovalCard(i)),
    ...cards(40, (i) => aCreature(i)),
  ];
}

/** The Core list with one creature swapped for Drannith Magistrate. */
export function aCoreListWithOneGameChanger(): DeckCard[] {
  return [...aCoreList().slice(0, -1), drannithMagistrate()];
}

/**
 * A 30-card list: 10 lands, then 5 ramp, 5 draw, 5 removal and 5 creatures
 * at mana value 2. Under the 60-card cut of I-77 requirement 2.6.
 */
export function aThirtyCardList(): DeckCard[] {
  return [
    ...cards(10, aBasicLand),
    ...cards(5, (i) => aRampCard(i, 2)),
    ...cards(5, (i) => aDrawCard(i, 2)),
    ...cards(5, (i) => aRemovalCard(i, 2)),
    ...cards(5, (i) => aCreature(i, 2)),
  ];
}

/** A Commander Spellbook variant: an infinite combo of exactly two cards. */
export function aTwoCardInfinite(first: string, second: string): Combo {
  return {
    id: `${first}+${second}`,
    cards: [first, second],
    isInfinite: true,
    effects: ["Infinite tokens"],
    description: "",
    prerequisites: { otherPieces: [], conditions: [], manaNeeded: "" },
  };
}
