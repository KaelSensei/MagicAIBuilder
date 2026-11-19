/**
 * The colour identity restriction of a stored deck: which main-deck cards and
 * which companion fall outside the command zone's colours.
 *
 * Format-rules context (still under `lib/deck`, see architecture.md); read by
 * the deck stats, the deck editor, the companion zone and the AI deck check.
 * Rules: CR 903.5c, every colour of a card's identity must be in the
 * commander's (with two commanders, both identities, CR 702.124c). CR 903.5e:
 * a rulebreaker commander's exceptions (`modules/format-rules`, the
 * rulebreaker table) admit some cards whatever their identity. CR 113.6n: those
 * exceptions never change a card's legality or banned status, which this file
 * does not read.
 *
 * @module deck/color-identity
 */
import {
  deckConstructionExceptions,
  isIdentityExempt,
  rulebreakerAdmission,
  type RulebreakerAdmission,
  type RulebreakerException,
} from "@/modules/format-rules";
import type { Deck } from "./types";

export interface ColorIdentityViolation {
  readonly cardId: string;
  readonly cardName: string;
}

function buildCommanderIdentitySet(deck: Pick<Deck, "commander" | "partner">): ReadonlySet<string> {
  return new Set([...(deck.commander?.colorIdentity ?? []), ...(deck.partner?.colorIdentity ?? [])]);
}

/**
 * The exceptions the deck's commander and partner grant (CR 903.5e). A stored
 * card has no Oracle id, so the table finds it by its exact Oracle name.
 *
 * @param deck - The deck whose command zone is read; the companion and the 99 grant nothing
 * @returns The rulebreaker exceptions, empty for any other commander
 */
export function commandZoneExceptions(
  deck: Pick<Deck, "commander" | "partner">
): readonly RulebreakerException[] {
  return commanderNameExceptions(commandZoneNames(deck));
}

/** The commander's and the partner's names: never the companion or the 99. */
function commandZoneNames(deck: Pick<Deck, "commander" | "partner">): readonly string[] {
  return [deck.commander, deck.partner].flatMap((card) => (card ? [card.name] : []));
}

/**
 * The exceptions of command-zone cards known only by name (CR 903.5e): a
 * stored card, or a name a request sent, has no Oracle id, so the table
 * matches the exact Oracle name.
 *
 * @param names - The commander's and the partner's names; never a card of the 99
 * @returns The rulebreaker exceptions, empty when no name is a rulebreaker's
 */
export function commanderNameExceptions(
  names: readonly string[]
): readonly RulebreakerException[] {
  return deckConstructionExceptions(names.map((name) => ({ oracleId: null, name })));
}

/** What the identity rule reads of a card: a deck row, a package card or a Scryfall card. */
export interface IdentityCard {
  readonly colorIdentity: readonly string[];
  readonly typeLine: string;
  readonly cmc: number;
}

/** The colours a deck's command zone allows and its rulebreaker exceptions. */
export interface DeckIdentityRule {
  readonly colors: ReadonlySet<string>;
  readonly exceptions: readonly RulebreakerException[];
}

/**
 * Whether the card's identity leaves the command zone's (CR 903.5c) and no
 * rulebreaker exception admits it (CR 903.5e). Every identity reader asks
 * this one question; legality is not read (CR 113.6n).
 *
 * @param rule - The command zone's colours and exceptions
 * @param card - The card's identity letters, type line and mana value
 * @returns True when the card is outside the deck's colour identity
 */
export function isOutsideDeckIdentity(
  rule: DeckIdentityRule,
  card: IdentityCard
): boolean {
  return (
    isCardOutsideColorIdentity(rule.colors, card) &&
    !isIdentityExempt({ typeLine: card.typeLine, manaValue: card.cmc }, rule.exceptions)
  );
}

/** The identity rule of a stored deck's commander and partner. */
function deckIdentityRule(deck: Deck): DeckIdentityRule {
  return { colors: buildCommanderIdentitySet(deck), exceptions: commandZoneExceptions(deck) };
}

/**
 * The main-deck cards outside the command zone's colour identity (CR 903.5c),
 * less those a rulebreaker commander admits (CR 903.5e), by name then id.
 *
 * @param deck - The deck; only its main zone is checked
 * @returns The violations, empty when the deck has no commander
 */
export function getColorIdentityViolations(deck: Deck): readonly ColorIdentityViolation[] {
  if (!deck.commander) return [];
  const rule = deckIdentityRule(deck);
  const mainCards = deck.cards.filter((c) => c.zone === "main");

  const violations: ColorIdentityViolation[] = [];
  for (const c of mainCards) {
    if (!isOutsideDeckIdentity(rule, c)) continue;
    violations.push({ cardId: c.id, cardName: c.name });
  }
  return violations.sort((a, b) => {
    if (a.cardName !== b.cardName) return a.cardName < b.cardName ? -1 : 1;
    if (a.cardId !== b.cardId) return a.cardId < b.cardId ? -1 : 1;
    return 0;
  });
}

/**
 * The rulebreaker commander that admits a card whose identity leaves the
 * command zone's (CR 903.5c), and through which exception (CR 903.5e): why
 * an off-colour card is no violation. A card the colours already allow needs
 * no admission; a rulebreaker in the 99 grants nothing.
 *
 * @param deck - The deck whose commander and partner are read
 * @param card - The card's identity letters, type line and mana value
 * @returns The admission, or undefined when the card needs none or none applies
 */
export function admittedByRulebreaker(
  deck: Pick<Deck, "commander" | "partner">,
  card: IdentityCard
): RulebreakerAdmission | undefined {
  if (!deck.commander) return undefined;
  if (!isCardOutsideColorIdentity(buildCommanderIdentitySet(deck), card)) return undefined;
  // A stored card has no Oracle id: the table finds it by its exact name.
  const commandZone = commandZoneNames(deck).map((name) => ({ oracleId: null, name }));
  return rulebreakerAdmission(commandZone, { typeLine: card.typeLine, manaValue: card.cmc });
}

/**
 * Every main-deck card a rulebreaker commander admits, by row id: the cards
 * {@link getColorIdentityViolations} leaves out only because of an exception.
 *
 * @param deck - The deck; only its main zone is read
 * @returns The admissions, empty when the commander is no rulebreaker
 */
export function rulebreakerAdmissions(deck: Deck): ReadonlyMap<string, RulebreakerAdmission> {
  const admissions = new Map<string, RulebreakerAdmission>();
  for (const card of deck.cards) {
    const admission = card.zone === "main" ? admittedByRulebreaker(deck, card) : undefined;
    if (admission) admissions.set(card.id, admission);
  }
  return admissions;
}

/**
 * Whether a colour of the card's identity is missing from `commanderIdentity`
 * (CR 903.5c), before any rulebreaker exception.
 *
 * @param commanderIdentity - The command zone's colours
 * @param card - The card's identity letters
 * @returns True when the card's identity leaves the commander's
 */
export function isCardOutsideColorIdentity(
  commanderIdentity: ReadonlySet<string>,
  card: Pick<IdentityCard, "colorIdentity">
): boolean {
  return card.colorIdentity.some((color) => !commanderIdentity.has(color));
}

/**
 * Whether the companion's identity leaves the command zone's (CR 903.5c), and
 * no rulebreaker exception of the commander admits it (CR 903.5e).
 *
 * @param deck - The deck; false when it has no commander or no companion
 * @returns True when the companion is outside the deck's colour identity
 */
export function isCompanionOutsideColorIdentity(deck: Deck): boolean {
  if (!deck.commander || !deck.companion) return false;
  return isOutsideDeckIdentity(deckIdentityRule(deck), deck.companion);
}
