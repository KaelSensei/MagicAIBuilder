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
  type RulebreakerException,
} from "@/modules/format-rules";
import type { Deck, DeckCard } from "./types";

export interface ColorIdentityViolation {
  readonly cardId: string;
  readonly cardName: string;
}

function buildCommanderIdentitySet(deck: Deck): ReadonlySet<string> {
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
  return commanderNameExceptions(
    [deck.commander, deck.partner].flatMap((card) => (card ? [card.name] : []))
  );
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

/** Whether the card's identity leaves the commander's and no rulebreaker exception admits it. */
function isOutside(
  commanderIdentity: ReadonlySet<string>,
  exceptions: readonly RulebreakerException[],
  card: Pick<DeckCard, "colorIdentity" | "typeLine" | "cmc">
): boolean {
  return (
    isCardOutsideColorIdentity(commanderIdentity, card) &&
    !isIdentityExempt({ typeLine: card.typeLine, manaValue: card.cmc }, exceptions)
  );
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
  const commanderIdentity = buildCommanderIdentitySet(deck);
  const exceptions = commandZoneExceptions(deck);
  const mainCards = deck.cards.filter((c) => c.zone === "main");

  const violations: ColorIdentityViolation[] = [];
  for (const c of mainCards) {
    if (!isOutside(commanderIdentity, exceptions, c)) continue;
    violations.push({ cardId: c.id, cardName: c.name });
  }
  return violations.sort((a, b) => {
    if (a.cardName !== b.cardName) return a.cardName < b.cardName ? -1 : 1;
    if (a.cardId !== b.cardId) return a.cardId < b.cardId ? -1 : 1;
    return 0;
  });
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
  card: Pick<DeckCard, "colorIdentity">
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
  return isOutside(buildCommanderIdentitySet(deck), commandZoneExceptions(deck), deck.companion);
}
