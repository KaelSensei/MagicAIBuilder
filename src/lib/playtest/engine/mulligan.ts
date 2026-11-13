/**
 * The London mulligan: a new seven, then the player's own choice of cards to bottom.
 *
 * Context: playtest, the engine. `applyMulligan` and `applyBottomCards` are the two halves of
 * one mulligan; between them the game waits (`isChoosingBottom`), and every other transition
 * returns its state unchanged. The pure tallies (`mulliganBottomCount`, `keptOpeningHandSize`,
 * `maxMulligans`) are also read by the modal, the keep advice and the session validation.
 * Rules: the London mulligan and its limit (CR 103.5), the free first mulligan in multiplayer
 * and Brawl (CR 103.5c), a commander in hand returning to the command zone (CR 903.9b).
 * Not responsible for: whether a mulligan is still allowed once the game has moved on
 * (`PlaytestModal.tsx`), or whether the first one is free (`free-mulligan.ts`).
 *
 * @module playtest/engine/mulligan
 */

import type { DeckCard } from "@/lib/deck/types";
import { OPENING_HAND_SIZE } from "@/lib/deck/game-constants";
import { pushHistory } from "./history";
import { defaultPlaytestDeps, type PlaytestDeps } from "./ports";
import { shuffleCards } from "./shuffle";
import type { PlaytestEngine } from "./types";

// ─── Mulligan ─────────────────────────────────────────────────────────────
/**
 * True while a mulligan waits for the player to choose the cards to bottom.
 * Taking the mulligan is not finished until then (CR 103.5), so every other
 * game action waits; only that choice and undo apply.
 *
 * @param state - current engine state
 * @returns whether a bottom choice is pending
 */
export function isChoosingBottom(state: PlaytestEngine): boolean {
  return state.cardsToBottom > 0;
}

/** The mulligan facts that decide how many cards go to the bottom. */
export type MulliganTally = Pick<
  PlaytestEngine,
  "mulliganCount" | "firstMulliganFree"
>;

/**
 * Cards a London mulligan puts on the bottom: one per mulligan taken, except
 * that a free first mulligan does not count (CR 103.5, 103.5c).
 *
 * @param tally - mulligans taken and whether the first one is free
 * @returns how many cards go to the bottom, never below zero
 */
export function mulliganBottomCount(tally: MulliganTally): number {
  const counted = tally.firstMulliganFree
    ? tally.mulliganCount - 1
    : tally.mulliganCount;
  return Math.max(0, counted);
}

/**
 * Size of the opening hand once the mulligans taken are settled.
 *
 * @param tally - mulligans taken and whether the first one is free
 * @returns seven minus the cards bottomed, never below zero
 */
export function keptOpeningHandSize(tally: MulliganTally): number {
  return Math.max(0, OPENING_HAND_SIZE - mulliganBottomCount(tally));
}

/**
 * The most mulligans a player may take. CR 103.5: "A player can take mulligans until their
 * opening hand would be zero cards, after which they may not take further mulligans." Each
 * counted mulligan bottoms one more card, so seven of them leave a zero-card hand. A free first
 * mulligan does not count toward the mulligans a player may take (CR 103.5c), so a multiplayer
 * game allows one more than a duel.
 *
 * @param rule - whether the first mulligan is free
 * @returns the mulligan limit: 7, or 8 with a free first mulligan
 */
export function maxMulligans(
  rule: Pick<PlaytestEngine, "firstMulliganFree">
): number {
  const countedMulligans = OPENING_HAND_SIZE;
  return rule.firstMulliganFree ? countedMulligans + 1 : countedMulligans;
}

/**
 * Describes a mulligan for the action log.
 *
 * @param cardsToBottom - cards the player must now put on the bottom
 * @returns the log line
 */
function describeMulligan(cardsToBottom: number): string {
  if (cardsToBottom === 0) return "Free mulligan: drew a new seven";
  const cards = cardsToBottom === 1 ? "1 card" : `${cardsToBottom} cards`;
  return `Mulligan: drew a new seven, ${cards} to put on the bottom`;
}

/**
 * Takes a London mulligan (CR 103.5): the hand is shuffled back into the
 * library and a new hand of seven is drawn. The player then chooses which
 * cards to put on the bottom — one per mulligan taken — through
 * `applyBottomCards`. The choice is the point of London: the player keeps the
 * cards that fit the hand, so it is not the same as dealing `7 - N` at random.
 *
 * In a multiplayer game and in Brawl the first mulligan does not count
 * (CR 103.5c): it deals a fresh seven with nothing to bottom.
 *
 * A commander in the hand goes to the command zone instead of the library
 * (CR 903.9b); the command zone itself is never shuffled in.
 *
 * @param state - current game state
 * @param deps - `random` shuffles the hand back in; `clock` stamps the undo entry
 * @returns the state with a new seven and, unless the mulligan was free, a
 * pending bottom choice
 */
export function applyMulligan(
  state: PlaytestEngine,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (state.mulliganCount >= maxMulligans(state)) return state;

  const mulliganCount = state.mulliganCount + 1;
  const { commanders, rest } = setAsideCommanders(
    state.hand,
    state.commanderIds
  );
  const shuffled = shuffleCards([...rest, ...state.library], deps.random);
  const cardsToBottom = mulliganBottomCount({
    mulliganCount,
    firstMulliganFree: state.firstMulliganFree,
  });

  return pushHistory(
    state,
    deps.clock,
    {
      mulliganCount,
      cardsToBottom,
      hand: shuffled.slice(0, OPENING_HAND_SIZE),
      library: shuffled.slice(OPENING_HAND_SIZE),
      ...(commanders.length > 0
        ? { commandZone: [...state.commandZone, ...commanders] }
        : {}),
    },
    describeMulligan(cardsToBottom)
  );
}

/**
 * Splits the game's commanders out of a list of cards, in one pass.
 *
 * @param cards - cards about to be shuffled into the library
 * @param commanderIds - ids of the game's commanders
 * @returns the commanders and the remaining cards, each in their original order
 */
function setAsideCommanders(
  cards: readonly DeckCard[],
  commanderIds: readonly string[]
): {
  readonly commanders: readonly DeckCard[];
  readonly rest: readonly DeckCard[];
} {
  const ids = new Set(commanderIds);
  const commanders: DeckCard[] = [];
  const rest: DeckCard[] = [];
  for (const card of cards) {
    (ids.has(card.id) ? commanders : rest).push(card);
  }
  return { commanders, rest };
}

/**
 * Resolves a bottom choice against the hand.
 *
 * @param hand - the hand the cards must come from
 * @param cardIds - the chosen card ids, in the order chosen
 * @param count - how many cards the pending choice needs
 * @returns the chosen cards in order, or null unless they are exactly `count`
 * distinct hand cards
 */
function pickBottomCards(
  hand: readonly DeckCard[],
  cardIds: readonly string[],
  count: number
): readonly DeckCard[] | null {
  if (count === 0 || cardIds.length !== count) return null;
  if (new Set(cardIds).size !== cardIds.length) return null;

  const handById = new Map(hand.map((card) => [card.id, card]));
  const chosen: DeckCard[] = [];
  for (const id of cardIds) {
    const card = handById.get(id);
    if (card === undefined) return null;
    chosen.push(card);
  }
  return chosen;
}

/**
 * Completes a London mulligan: the chosen hand cards go to the bottom of the
 * library in the order chosen, so the last one chosen ends up bottom-most.
 *
 * @param state - a state whose bottom choice is pending
 * @param cardIds - exactly `cardsToBottom` distinct hand cards, in the order chosen
 * @param deps - only `clock` is read, to stamp the undo entry
 * @returns the state with the opening hand settled, or the same state when the
 * choice is not valid
 */
export function applyBottomCards(
  state: PlaytestEngine,
  cardIds: readonly string[],
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  const chosen = pickBottomCards(state.hand, cardIds, state.cardsToBottom);
  if (chosen === null) return state;

  const chosenIds = new Set(cardIds);
  return pushHistory(
    state,
    deps.clock,
    {
      cardsToBottom: 0,
      hand: state.hand.filter((card) => !chosenIds.has(card.id)),
      library: [...state.library, ...chosen],
    },
    `Put ${chosen.map((card) => card.name).join(", ")} on the bottom of the library`
  );
}
