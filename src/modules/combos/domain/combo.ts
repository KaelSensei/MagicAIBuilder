/**
 * A combo a deck holds, as Commander Spellbook lists it, in the words the rest
 * of the app uses (CONTEXT.md, "Combos").
 *
 * The published value type of the combos context: the panel shows it and
 * bracket scoring counts it. It is built once, by
 * `infrastructure/spellbook-variant.ts`, from Spellbook's `Variant`; no module
 * outside `infrastructure/` reads that wire shape (ADR 0004). Readonly data and
 * pure functions only (ADR 0003): a combo crosses the route's JSON and the
 * Server/Client Component boundary unchanged.
 *
 * @module combos/combo
 */

/** What a combo needs beyond its named cards, as Commander Spellbook lists it. */
export interface ComboPrerequisites {
  /** Generic extra pieces any matching card fills, e.g. "Permanent Castable for {C}". */
  readonly otherPieces: readonly string[];
  /** Game states to reach first; Spellbook's notable ones come before its easy ones. */
  readonly conditions: readonly string[];
  /** Mana spent while the combo runs, in `{X}` notation, or "" when Spellbook lists none. */
  readonly manaNeeded: string;
}

/** One combo the deck can assemble: the cards, what they do, and what else they need. */
export interface Combo {
  /** Spellbook's variant id, which also names its page on commanderspellbook.com. */
  readonly id: string;
  /** Names of the cards the combo uses. */
  readonly cards: readonly string[];
  /** Names of the effects the combo produces. */
  readonly effects: readonly string[];
  /** Spellbook's step-by-step description, or the effects joined when it has none. */
  readonly description: string;
  /** Whether an effect reads as infinite or game-winning; see `isTwoCardInfiniteCombo`. */
  readonly isInfinite: boolean;
  /** What else the combo needs before it works. */
  readonly prerequisites: ComboPrerequisites;
}

/**
 * Whether a combo counts as a two-card combo for bracket scoring: it is flagged
 * infinite and uses exactly two named cards.
 *
 * Wizards' Commander Brackets text restricts "two-card infinite combos":
 * Brackets 1 and 2 allow none, Bracket 3 none before turn 6, Brackets 4 and 5
 * allow them (bracket update of 2025-10-21,
 * https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025,
 * encoded as `twoCardCombos` in `BRACKET_DEFINITIONS`). The Comprehensive
 * Rules have no such rule: a bracket is a format guideline. `scoreBracket`
 * counts the combos this accepts, and `minimumBracket` turns a count above zero
 * into a Bracket 3 floor, never 4, since a list cannot show how early a combo
 * comes up.
 *
 * Only the named cards are counted. A generic third piece Spellbook lists in
 * `prerequisites.otherPieces` (Hullbreaker Horror + Sol Ring + any permanent
 * castable for {C}) does not stop the combo from counting; roadmap I-77 reviews
 * that reading.
 */
export function isTwoCardInfiniteCombo(combo: Combo): boolean {
  return combo.isInfinite && combo.cards.length === 2;
}
