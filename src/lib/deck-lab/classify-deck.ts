/**
 * Classifies a Commander deck for Deck Lab (I-31 requirement 2, slice 2): one lab card per
 * main-deck copy, the commanders in the command zone, the player's overrides applied, and the
 * cards no rule matched counted.
 *
 * Context: deck analysis, Deck Lab. Pure and deterministic: no I/O, no store, no model (2.1), and
 * the same deck gives the same result whatever the order of its rows. Overrides are an input;
 * storing them is a later slice and a migration.
 *
 * @module deck-lab/classify-deck
 */
import type { Deck, DeckCard } from "@/lib/deck/types";

import { classifyCard } from "./classify-card";
import type { DeckClassification, LabCard, LabCardOverride } from "./types";

/** What `classifyDeck` reads. */
export interface ClassifyDeckInput {
  /** The deck: its command zone and its rows. `cards` never holds the command zone. */
  readonly deck: Pick<Deck, "commander" | "partner" | "cards">;
  /** The player's overrides for this deck, keyed by card name. */
  readonly overrides: ReadonlyMap<string, LabCardOverride>;
}

/**
 * The fields a card's rules are read from, joined: two rows of one card (two printings) give
 * the same key, so ordering by it is total on what the classifier reads.
 */
function rulesKey(card: DeckCard): string {
  return [
    card.name,
    card.typeLine,
    card.oracleText,
    card.manaCost,
    card.cmc,
  ].join("\u0000");
}

/** Code-unit order: the same in every JavaScript engine, unlike a locale comparison. */
function byRulesKey(a: DeckCard, b: DeckCard): number {
  const left = rulesKey(a);
  const right = rulesKey(b);
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

/**
 * The library's rows. CR 903.6: the cards left after the commander goes to the command zone
 * become the library. Sideboard (CR 100.4) and Considering rows are not in the deck.
 */
function libraryRows(cards: readonly DeckCard[]): readonly DeckCard[] {
  return cards.filter((card) => card.zone === "main").toSorted(byRulesKey);
}

/**
 * A lab card with the player's override applied, field by field. The rule id stays the
 * classifier's, so the player still sees what the rule said (requirement 2.2).
 */
function withOverride(
  card: LabCard,
  override: LabCardOverride | undefined
): LabCard {
  if (override === undefined) return card;
  return {
    ...card,
    kind: override.kind ?? card.kind,
    cost: override.cost ?? card.cost,
    produces: override.produces ?? card.produces,
    dependsOnOpponents: override.dependsOnOpponents ?? card.dependsOnOpponents,
    out: override.out ?? card.out,
    entersTapped: override.entersTapped ?? card.entersTapped,
    fetchTypes: override.fetchTypes ?? card.fetchTypes,
    drawN: override.drawN ?? card.drawN,
    toHand: override.toHand ?? card.toHand,
    key: override.key ?? card.key,
    overridden: true,
  };
}

/** One overridden lab card per copy of each row. */
function expandCopies(
  rows: readonly DeckCard[],
  overrides: ClassifyDeckInput["overrides"]
): readonly LabCard[] {
  return rows.flatMap((row) => {
    const card = withOverride(classifyCard(row), overrides.get(row.name));
    return Array.from({ length: row.quantity }, () => card);
  });
}

/** Whether a lab card fell back to a spell (requirement 2.3). */
function isFallback(card: LabCard): boolean {
  return card.ruleId === "spell-fallback" && !card.overridden;
}

/**
 * Classifies a deck for Deck Lab.
 *
 * @param input - the deck and the player's overrides
 * @returns the library, one lab card per copy ordered by name; the command zone, commander then
 *   partner (CR 903.6); and how many lab cards fell back to a spell
 */
export function classifyDeck({
  deck,
  overrides,
}: ClassifyDeckInput): DeckClassification {
  const commanders = [deck.commander, deck.partner].filter(
    (card) => card !== null
  );
  const library = expandCopies(libraryRows(deck.cards), overrides);
  const commandZone = expandCopies(commanders, overrides);
  return {
    library,
    commandZone,
    fallbackCount: [...library, ...commandZone].filter(isFallback).length,
  };
}
