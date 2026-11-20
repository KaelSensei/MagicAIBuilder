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

/**
 * The zones a combo piece can start in, as Spellbook's `zoneLocations` names
 * them (CR 400.1, plus the command zone, CR 408). I-65 reads them to attach
 * graveyard and exile answers to a route (requirement 7.2).
 */
export const COMBO_ZONES = [
  "hand",
  "battlefield",
  "commandZone",
  "exile",
  "graveyard",
  "library",
] as const;

/** One of {@link COMBO_ZONES}. */
export type ComboZone = (typeof COMBO_ZONES)[number];

/**
 * Commander Spellbook's own bracket tag for a combo, from its `BracketTagEnum`
 * (https://backend.commanderspellbook.com/schema/, API 7.4.4, read 2026-11-20).
 * It is Spellbook's label, not this app's bracket estimate: I-65 shows it
 * beside a route, and I-03 owns the estimate.
 */
export const COMBO_BRACKET_TAGS = [
  "ruthless",
  "spicy",
  "powerful",
  "oddball",
  "core",
  "exhibition",
  "banned",
] as const;

/** One of {@link COMBO_BRACKET_TAGS}. */
export type ComboBracketTag = (typeof COMBO_BRACKET_TAGS)[number];

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
  /**
   * The zones each named card must start in, keyed by its name in `cards`;
   * several zones mean any one of them.
   */
  readonly startZones: Readonly<Record<string, readonly ComboZone[]>>;
  /**
   * The effects Spellbook marks Standalone, a notable result on its own, in
   * Spellbook's order. Empty for an engine, such as infinite mana that another
   * combo consumes (I-65 requirement 2.5); `comboResultKind` reads each one.
   */
  readonly standaloneResults: readonly string[];
  /** Total mana value of the pieces to cast, by Spellbook's count; I-65's speed band reads it. */
  readonly manaValueNeeded: number;
  /** Spellbook's bracket tag, or `null` when it sent a tag this app does not know. */
  readonly bracketTag: ComboBracketTag | null;
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
