/**
 * Who put a card in a heuristic term of the bracket estimate: a classifier
 * rule, or the deck's owner (I-77 requirements 2.5 and 3.2).
 *
 * A card's stored `category` is what the builder counts. It comes from
 * `categorizeCard` when the card is added, and the owner may move it. Running
 * the classifier again on the stored text tells the two apart: the same
 * category means a rule placed it, another means the owner did. Not
 * responsible for counting the cards (`stats.ts`) or scoring a term
 * (`bracket-terms.ts`).
 *
 * @module deck/bracket-card-placement
 */
import { categorizeCard } from "./categories";
import type { TermCard } from "./bracket-assessment";
import { compareByNameThenId } from "./card-name-order";
import type { CardCategory, DeckCard } from "./types";

/**
 * The category the classifier gives a stored card. A double-faced card is
 * read from its front face, as `categorizeDfcCard` reads it when the card is
 * added.
 */
function ruleCategoryOf(card: DeckCard): CardCategory {
  const front = card.cardFaces?.[0];
  return categorizeCard({
    id: card.id,
    name: card.name,
    cmc: card.cmc,
    mana_cost: card.manaCost,
    type_line: front?.typeLine ?? card.typeLine,
    oracle_text: front?.oracleText ?? card.oracleText,
    color_identity: card.colorIdentity,
    layout: card.layout,
  });
}

/**
 * The id of the classifier rule that gives a category, for the audit's
 * "Estimated" badge and for a challenge to name (I-77 3.3, 10.1).
 *
 * @param category - a category `categorizeCard` returns
 * @returns the rule id, such as `categories/ramp`
 */
export function classifierRuleId(category: CardCategory): string {
  return `categories/${category}`;
}

/**
 * Places one card of a term: by the classifier rule when its stored category
 * is the one the rule gives its text, by the owner otherwise.
 *
 * @param card - a main-deck or command-zone card a term counts
 * @returns the card with who placed it
 */
export function placementOf(card: DeckCard): TermCard {
  if (ruleCategoryOf(card) !== card.category) {
    return { by: "owner", cardId: card.id, name: card.name };
  }
  return {
    by: "rule",
    cardId: card.id,
    name: card.name,
    ruleId: classifierRuleId(card.category),
  };
}

/**
 * Orders term cards by name, then id, then rule, so the same list gives the
 * same audit whatever order its rows arrive in (I-77 1.5).
 *
 * @param left - one card
 * @param right - another card
 * @returns a negative, zero or positive number, as `Array.prototype.sort` expects
 */
export function compareTermCards(left: TermCard, right: TermCard): number {
  return (
    compareByNameThenId(left, right) ||
    ruleIdOf(left).localeCompare(ruleIdOf(right), "en")
  );
}

function ruleIdOf(card: TermCard): string {
  return card.by === "rule" ? card.ruleId : "";
}
