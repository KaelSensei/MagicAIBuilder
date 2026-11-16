/**
 * The construction rules an AI-generated Commander list is held to, read from
 * its resolved command zone: the colour identity, a rulebreaker commander's
 * exceptions, and the size the repaired list must come to.
 *
 * AI copilot context; `generated-deck-legality.ts` is its caller.
 * Rules: CR 903.5c (colour identity, both commanders' with a partner,
 * CR 702.124c); CR 903.5a (100 cards, the command zone included); CR 903.5e (a
 * rulebreaker commander's exceptions, the format-rules rulebreaker table);
 * CR 113.6n (those exceptions never change legality, which this file does not
 * read).
 *
 * @module ai/generated-deck-construction
 */
import { isCardOutsideColorIdentity } from "@/lib/deck/color-identity";
import { COMMANDER_DECK_SIZE } from "@/lib/deck/deck-size";
import type { ScryfallCard } from "@/lib/scryfall/types";
import {
  deckConstructionExceptions,
  deckSizeRule,
  isIdentityExempt,
  type RulebreakerException,
} from "@/modules/format-rules";
import type { KeptCard } from "./generated-deck-size";

/** The command zone's colours and its rulebreaker exceptions. */
export interface CommandZoneIdentity {
  readonly identity: ReadonlySet<string>;
  readonly exceptions: readonly RulebreakerException[];
}

/** The rulebreaker exceptions of the resolved commanders, found by Oracle id. */
function exceptionsOf(
  commandZone: readonly ScryfallCard[]
): readonly RulebreakerException[] {
  return deckConstructionExceptions(
    commandZone.map((card) => ({
      oracleId: card.oracle_id ?? null,
      name: card.name,
    }))
  );
}

/**
 * The identity rule of a resolved command zone.
 *
 * @param commandZone - The commander and, when the deck has one, its partner or Background
 * @returns Their combined colours and the exceptions a rulebreaker among them grants
 */
export function commandZoneIdentityOf(
  commandZone: readonly ScryfallCard[]
): CommandZoneIdentity {
  return {
    identity: new Set(commandZone.flatMap((card) => card.color_identity)),
    exceptions: exceptionsOf(commandZone),
  };
}

/**
 * Whether a listed card leaves the command zone's identity (CR 903.5c) and no
 * rulebreaker exception admits it (CR 903.5e).
 *
 * @param card - The listed card as Scryfall resolved it
 * @param rule - From {@link commandZoneIdentityOf}
 * @returns True when the card must be removed as outside the colour identity
 */
export function isOutsideCommandZoneIdentity(
  card: ScryfallCard,
  { identity, exceptions }: CommandZoneIdentity
): boolean {
  return (
    isCardOutsideColorIdentity(identity, {
      colorIdentity: card.color_identity,
    }) &&
    !isIdentityExempt(
      { typeLine: card.type_line, manaValue: card.cmc },
      exceptions
    )
  );
}

/**
 * The copies the listed cards must come to once repaired: 100 less the command
 * zone (CR 903.5a). Under a commander that lifts the maximum (CR 903.5e,
 * Whtz) a list that reaches the minimum keeps its length; only a short one is
 * filled.
 *
 * @param commandZone - The resolved commander and partner
 * @param kept - The listed cards kept after the legality and identity checks
 * @returns The copies `fitToDeckSize` brings the list to
 */
export function repairedListSize(
  commandZone: readonly ScryfallCard[],
  kept: readonly KeptCard[]
): number {
  const rule = deckSizeRule(COMMANDER_DECK_SIZE, exceptionsOf(commandZone));
  if (rule.maximum !== null) return rule.maximum - commandZone.length;
  const keptCopies = kept.reduce((sum, { card }) => sum + card.quantity, 0);
  return Math.max(rule.minimum - commandZone.length, keptCopies);
}
