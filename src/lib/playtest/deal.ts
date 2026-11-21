/**
 * Dealing a deck into a playtest game: the library, the command zone and the opening hand.
 *
 * Context: playtest. `buildSetup` reads the deck and its format once into a `PlaytestSetup`:
 * the physical cards the library holds, the commanders that start in the command zone
 * (CR 903.6), and the session rules the table size decides: the starting life total
 * (CR 103.4c, 903.12f), the free first mulligan (CR 103.5c) and the first-turn draw
 * (CR 103.8a, 103.8c). `dealFrom` shuffles that setup and draws the opening hand of seven
 * (CR 103.5, 903.7) through the engine's `createPlaytestState`. It also settles how many
 * imagined opponents the commander-damage tally offers (CR 903.10a, 903.12h). The store keeps the setup so a
 * reset deals the same deck again, with the choices the session started with. A new-card trial
 * names main-deck copies to start in the opening hand (`trialCardChoices`, `isRandomDeal`).
 *
 * Pure: the shuffle's random source comes in through `deps`, so a test deals a replayable
 * game. Copy ids derive from the deck row's id, not from a random source.
 * Not responsible for mulligans and later turns (`engine.ts`), nor for deciding the free
 * mulligan itself (`free-mulligan.ts`).
 *
 * @module playtest/deal
 */

import type { Deck, DeckCard } from "@/lib/deck/types";
import { getFormatConfig, type DeckFormat } from "@/lib/deck/formats";
import { OPENING_HAND_SIZE } from "@/lib/deck/game-constants";
import type { PlaytestDeps, PlaytestEngine } from "./engine";
import { createPlaytestState, MAX_IMAGINED_OPPONENTS } from "./engine";
import { isFirstMulliganFree, isMultiplayerByDefault } from "./free-mulligan";

/** The deck as dealt at the start, so a reset does not depend on live zones. */
export interface PlaytestSetup {
  /** One entry per physical card the engine shuffles into the library. */
  readonly cards: readonly DeckCard[];
  /** Commanders, which start in the command zone instead (CR 903.6). */
  readonly commandZone: readonly DeckCard[];
  /** The format's starting life total at this session's table size. */
  readonly startingLife: number;
  /**
   * Whether the table has more than two players: the player's answer, or the format's usual
   * table when they gave none. Settled when the session starts, so a restart keeps it.
   */
  readonly multiplayer: boolean;
  /** Settled when the session starts, so a restart keeps the player's choice. */
  readonly firstMulliganFree: boolean;
  /** The imagined opponents the commander-damage tally offers; 0 when the format has none. */
  readonly commanderDamageOpponents: number;
  /**
   * The main-deck copies a new-card trial starts in the opening hand, never also in `cards`;
   * empty for a random deal. Kept so a reset deals them again.
   */
  readonly trialCards: readonly DeckCard[];
}

/**
 * The most copies a new-card trial may choose: a whole opening hand (CR 103.5: seven cards).
 */
export const MAX_TRIAL_CARDS = OPENING_HAND_SIZE;

/**
 * How many imagined opponents the commander-damage tally offers in a game of `format`.
 *
 * Only Commander uses the 21-damage rule (CR 903.10a, 704.6c): Brawl does not (CR 903.12h), and
 * neither Oathbreaker nor the constructed formats are in CR 903.10. A duel has one opponent; a
 * multiplayer table offers `MAX_IMAGINED_OPPONENTS`, since the app stores no pod size.
 */
function commanderDamageOpponents(
  format: DeckFormat,
  multiplayer: boolean
): number {
  if (format !== "commander") return 0;
  return multiplayer ? MAX_IMAGINED_OPPONENTS : 1;
}

/** What the player chooses before the opening hand is dealt. */
export interface PlaytestOptions {
  /**
   * Whether the game has more than two players, which makes the first
   * mulligan free (CR 103.5c), gives the starting player a draw on turn 1
   * (CR 103.8c) and sets Brawl's life total (CR 903.12f). The app stores no
   * pod size, so an unanswered question falls back on the format's usual
   * table (`isMultiplayerByDefault`).
   */
  readonly multiplayer?: boolean;
  /**
   * The physical copies to start in the opening hand, by the ids `trialCardChoices` gives.
   * An id that is not a main-deck copy (a commander, the sideboard, the cards being considered)
   * is ignored, a repeated id counts once, and only the first `MAX_TRIAL_CARDS` count.
   */
  readonly trialCardIds?: readonly string[];
}

/** One main-deck copy a new-card trial can start in the opening hand. */
export interface TrialCardChoice {
  /** The physical copy, with the id `PlaytestOptions.trialCardIds` names it by. */
  readonly card: DeckCard;
  /** Which copy of its deck row this is, from 1. */
  readonly copy: number;
  /** How many copies its deck row holds, so a picker can tell copies apart. */
  readonly copies: number;
}

/**
 * Turns a deck row into the physical cards it stands for.
 *
 * Zones find, tap and key cards by id, so every copy needs its own: the first
 * keeps the row's id and each further copy gets `<row id>#<copy number>`.
 *
 * @param card - a deck row holding `quantity` copies
 * @returns one single-copy card per physical copy
 */
function physicalCopies(card: DeckCard): readonly DeckCard[] {
  return Array.from({ length: card.quantity }, (_, index) => ({
    ...card,
    id: index === 0 ? card.id : `${card.id}#${index + 1}`,
    quantity: 1,
  }));
}

/** The physical copies of the main deck: the sideboard and the cards being considered are not dealt. */
function mainDeckCopies(cards: readonly DeckCard[]): readonly DeckCard[] {
  return cards.filter((card) => card.zone === "main").flatMap(physicalCopies);
}

/**
 * The copies a new-card trial can start in the opening hand: every physical copy of the main
 * deck, in deck order. Commanders are not offered, since they start in the command zone
 * (CR 903.6), nor the sideboard or the cards being considered, which are not dealt.
 *
 * @param cards - the deck's rows (`deck.cards`)
 * @returns one choice per main-deck copy
 */
export function trialCardChoices(
  cards: readonly DeckCard[]
): readonly TrialCardChoice[] {
  return cards
    .filter((card) => card.zone === "main")
    .flatMap((row) =>
      physicalCopies(row).map((card, index) => ({
        card,
        copy: index + 1,
        copies: row.quantity,
      }))
    );
}

/**
 * Whether a setup deals its opening hand at random. A new-card trial does not, so its opening
 * hand says nothing about the deck's real draws, and the game is not filed as a playtest session.
 *
 * @param setup - the retained setup of the session
 * @returns false when the session started with chosen cards
 */
export function isRandomDeal(
  setup: Pick<PlaytestSetup, "trialCards">
): boolean {
  return setup.trialCards.length === 0;
}

/**
 * Splits the main-deck copies into the chosen ones, in the order chosen, and the library.
 *
 * @param mainDeck - the main deck's physical copies
 * @param chosenIds - copy ids; unknown and repeated ids are skipped, and only the first
 *   `MAX_TRIAL_CARDS` known ones count
 */
function splitTrialCards(
  mainDeck: readonly DeckCard[],
  chosenIds: readonly string[]
): {
  readonly trialCards: readonly DeckCard[];
  readonly library: readonly DeckCard[];
} {
  const byId = new Map(mainDeck.map((card) => [card.id, card]));
  const trialCards = [...new Set(chosenIds)]
    .flatMap((id) => byId.get(id) ?? [])
    .slice(0, MAX_TRIAL_CARDS);
  const chosen = new Set(trialCards.map((card) => card.id));
  return {
    trialCards,
    library: mainDeck.filter((card) => !chosen.has(card.id)),
  };
}

/**
 * Splits a deck into the library the engine shuffles and the command zone, and settles the
 * session rules the table size decides.
 *
 * `deck.cards` also holds the sideboard and the cards being considered; only the main deck is
 * dealt. The companion is not read at all: `deck.companion` is kept apart from `deck.cards`
 * when the deck loads, and a companion starts outside the game (CR 702.139a). A format without
 * a command zone shuffles any commander slot into the library, as it always has. The copies a
 * new-card trial chose (`options.trialCardIds`) leave the library for `trialCards`.
 *
 * @param deck - the deck being playtested
 * @param options - the player's choices for this session
 * @returns the library cards, the chosen cards, the commanders and the session's starting rules
 */
export function buildSetup(
  deck: Deck,
  options: PlaytestOptions
): PlaytestSetup {
  const { hasCommander, startingLife: lifeByTable } = getFormatConfig(
    deck.format
  );
  const multiplayer =
    options.multiplayer ?? isMultiplayerByDefault(deck.format);
  // CR 903.12f: Brawl starts at 25 in a two-player game and at 30 in a multiplayer one.
  const startingLife = multiplayer
    ? lifeByTable.multiplayer
    : lifeByTable.twoPlayer;
  const firstMulliganFree = isFirstMulliganFree(deck.format, multiplayer);
  const rules = {
    startingLife,
    multiplayer,
    firstMulliganFree,
    commanderDamageOpponents: commanderDamageOpponents(
      deck.format,
      multiplayer
    ),
  };
  const commanders = [deck.commander, deck.partner].filter(
    (card): card is DeckCard => card !== null
  );
  const { trialCards, library } = splitTrialCards(
    mainDeckCopies(deck.cards),
    options.trialCardIds ?? []
  );

  return hasCommander
    ? { cards: library, commandZone: commanders, trialCards, ...rules }
    : {
        cards: [...commanders, ...library],
        commandZone: [],
        trialCards,
        ...rules,
      };
}

/**
 * Deals a fresh game from the retained setup: shuffles the library and draws the opening
 * hand of seven (CR 103.5; CR 903.7 in Commander), with the commanders in the command zone.
 * A new-card trial's chosen cards start the hand and the shuffle fills the rest of the seven.
 *
 * Deterministic for a given `deps.random`: the same source dealing the same setup gives
 * the same hand, which is how a test replays a game.
 *
 * @param setup - the deck and the format's starting rules
 * @param deps - the random source for the shuffle; a full `PlaytestDeps` is accepted
 * @returns a new engine with the format's life total, table size, mulligan rule and command zone
 */
export function dealFrom(
  setup: PlaytestSetup,
  deps: Pick<PlaytestDeps, "random">
): PlaytestEngine {
  return createPlaytestState(
    setup.cards,
    {
      lifeTotal: setup.startingLife,
      multiplayer: setup.multiplayer,
      firstMulliganFree: setup.firstMulliganFree,
      commanderDamageOpponents: setup.commanderDamageOpponents,
      commandZone: setup.commandZone,
      chosenHand: setup.trialCards,
    },
    deps
  );
}
