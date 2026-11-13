/**
 * Dealing a deck into a playtest game: the library, the command zone and the opening hand.
 *
 * Context: playtest. `buildSetup` reads the deck and its format once into a `PlaytestSetup`:
 * the physical cards the library holds, the commanders that start in the command zone
 * (CR 903.6), and the session rules the table size decides: the starting life total
 * (CR 103.4c, 903.12f), the free first mulligan (CR 103.5c) and the first-turn draw
 * (CR 103.8a, 103.8c). `dealFrom` shuffles that setup and draws the opening hand of seven
 * (CR 103.5, 903.7) through the engine's `createPlaytestState`. The store keeps the setup so a
 * reset deals the same deck again, with the choices the session started with.
 *
 * Pure: the shuffle's random source comes in through `deps`, so a test deals a replayable
 * game. Copy ids derive from the deck row's id, not from a random source.
 * Not responsible for mulligans and later turns (`engine.ts`), nor for deciding the free
 * mulligan itself (`free-mulligan.ts`).
 *
 * @module playtest/deal
 */

import type { Deck, DeckCard } from "@/lib/deck/types";
import { getFormatConfig } from "@/lib/deck/formats";
import type { PlaytestDeps, PlaytestEngine } from "./engine";
import { createPlaytestState } from "./engine";
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

/**
 * Splits a deck into the library the engine shuffles and the command zone, and settles the
 * session rules the table size decides.
 *
 * `deck.cards` also holds the sideboard and the cards being considered; only the main deck is
 * dealt. The companion is not read at all: `deck.companion` is kept apart from `deck.cards`
 * when the deck loads, and a companion starts outside the game (CR 702.139a). A format without
 * a command zone shuffles any commander slot into the library, as it always has.
 *
 * @param deck - the deck being playtested
 * @param options - the player's choices for this session
 * @returns the library cards, the commanders and the session's starting rules
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
  const rules = { startingLife, multiplayer, firstMulliganFree };
  const commanders = [deck.commander, deck.partner].filter(
    (card): card is DeckCard => card !== null
  );
  const mainDeck = deck.cards
    .filter((card) => card.zone === "main")
    .flatMap(physicalCopies);

  return hasCommander
    ? { cards: mainDeck, commandZone: commanders, ...rules }
    : { cards: [...commanders, ...mainDeck], commandZone: [], ...rules };
}

/**
 * Deals a fresh game from the retained setup: shuffles the library and draws the opening
 * hand of seven (CR 103.5; CR 903.7 in Commander), with the commanders in the command zone.
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
      commandZone: setup.commandZone,
    },
    deps
  );
}
