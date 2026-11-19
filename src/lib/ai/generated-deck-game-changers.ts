/**
 * The Game Changer limit of an AI-generated deck's bracket (I-02 spec,
 * requirement 5.1).
 *
 * Policy:
 * - A card counts when Scryfall's card data marks it `game_changer` at check
 *   time, never by a flag stored earlier (I-03: a count uses the current
 *   list). A card without the field counts as not one: Scryfall sends it on
 *   every collection answer (recorded in `scryfall/fixtures/game-changers-v1.ts`).
 * - The commander and partner count first and are never removed: choosing
 *   another commander is a deckbuilding decision, not a repair (the policy of
 *   `generated-deck-legality.ts`).
 * - The list's Game Changers are kept in the model's order until the limit;
 *   the later ones are removed, so one list always gives the same result.
 * - Bracket 1 allows none: a thematic exception is the player's to claim at
 *   the table, and the build prompt asks for none (`bracket-brief.ts`).
 *
 * @module ai/generated-deck-game-changers
 */
import {
  BRACKET_DEFINITIONS,
  type BracketLevel,
} from "@/lib/constants/brackets";
import type { ScryfallCard } from "@/lib/scryfall/types";

/** Whether Scryfall's card data puts the card on the official Game Changers list. */
function isGameChanger(card: ScryfallCard): boolean {
  return card.game_changer === true;
}

/** Why copies of a Game Changer were removed: the bracket asked for and its limit. */
export interface OverGameChangerLimit {
  readonly reason: "game_changer";
  readonly bracket: BracketLevel;
  /** The bracket's most Game Changers, the commanders included; `Infinity` when unlimited */
  readonly limit: number;
}

/** The Game Changer slots a bracket leaves to a generated list, handed out in list order. */
export interface GameChangerSlots {
  /** The cause of every removal these slots refuse */
  readonly cause: OverGameChangerLimit;
  /**
   * Takes slots for the copies of one listed card.
   *
   * @returns Every copy of a card that is not a Game Changer; otherwise as many as the slots left allow
   */
  readonly admit: (card: ScryfallCard, copies: number) => number;
}

/**
 * The Game Changer slots of a bracket once the command zone has taken its own.
 *
 * @param bracket - The bracket the player asked for
 * @param commandZone - The commander and, when there is one, the partner or Background
 * @returns Slots to call `admit` on once per listed card, in list order
 */
export function gameChangerSlots(
  bracket: BracketLevel,
  commandZone: readonly ScryfallCard[]
): GameChangerSlots {
  const limit = BRACKET_DEFINITIONS[bracket].maxGameChangers;
  let taken = commandZone.filter(isGameChanger).length;
  return {
    cause: { reason: "game_changer", bracket, limit },
    admit(card, copies) {
      if (!isGameChanger(card)) return copies;
      const admitted = Math.min(copies, Math.max(0, limit - taken));
      taken += admitted;
      return admitted;
    },
  };
}
