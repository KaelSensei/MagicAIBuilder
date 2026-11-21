/**
 * Opening-hand lands: how many lands an opening seven holds on average, how
 * often it holds each count from 0 to 7, and the chance of having drawn at
 * least N lands by turn N.
 *
 * Deck analysis, I-97. Every figure is an exact count of equally likely hands
 * (the hypergeometric distribution), never a simulated or recorded game, so
 * the same library always gets the same digits.
 * Not responsible for: the library and land count (`countLibrary` in
 * `draw-odds-library.ts`), the cards drawn by a turn (`cardsDrawnBy` in
 * `cards-drawn.ts`), mulligans, ramp or colours, or the section that shows the
 * figures (`components/deck/OpeningHandLands.tsx`).
 *
 * @module deck/opening-hand-lands
 */

import { binomial } from "./binomial";
import { cardsDrawnBy, type TableSize } from "./cards-drawn";
import { chanceOfAtLeast } from "./draw-odds";
import type { LibraryCount } from "./draw-odds-library";
import { OPENING_HAND_SIZE } from "./game-constants";

/** The chance that an opening seven holds exactly `lands` lands. */
export interface LandCountChance {
  /** Lands in the hand, from 0 to 7 */
  readonly lands: number;
  /** Chance of exactly that many, in 0–1 */
  readonly probability: number;
}

/**
 * The chance of having drawn at least `turn` lands by the end of the draw
 * step of the player's turn `turn`: one land drop a turn (CR 305.2).
 */
export interface LandDropChance {
  /** The player's turn, from 1 */
  readonly turn: number;
  /** Cards drawn by then, opening seven included (`cardsDrawnBy`) */
  readonly drawn: number;
  /** Chance of at least `turn` lands among them, in 0–1 */
  readonly probability: number;
}

/**
 * Why a library has no land figures, so the section names what is missing
 * instead of a table of zeros:
 * - `empty-library`: the main deck holds no card yet;
 * - `no-lands`: the library holds no land (I-97 AC-97-05);
 * - `more-drawn-than-library`: the library holds fewer than seven cards, so no
 *   opening hand can be dealt from it.
 */
export type OpeningHandLandsGap =
  "empty-library" | "no-lands" | "more-drawn-than-library";

/** The land figures of a library, or the reason it has none. */
export type OpeningHandLands =
  | OpeningHandLandFigures
  | { readonly kind: "unknown"; readonly reason: OpeningHandLandsGap };

/** The opening-hand land figures of a library. */
export interface OpeningHandLandFigures {
  readonly kind: "known";
  /** Lands an opening seven holds on average: 7 × lands / library size */
  readonly averageLands: number;
  /** The chance of each land count from 0 to 7, in that order; sums to 1 */
  readonly spread: readonly LandCountChance[];
  /**
   * The chance of N lands by turn N, for each turn from 1 to 7 whose draw the
   * library can cover, in turn order
   */
  readonly landDrops: readonly LandDropChance[];
}

/**
 * The last turn the land drops look at: turn 7, as many turns as an opening
 * hand holds cards, so the table matches the spread's 0 to 7.
 */
const LAST_LAND_DROP_TURN = 7;

/**
 * The chance that an opening seven holds exactly `lands` lands: the
 * hypergeometric term C(lands in library, lands) · C(others, 7 − lands), over
 * C(library, 7). A count the library cannot produce, such as 7 lands from a
 * library with 5, is a known 0.
 *
 * @param library - an answerable library (at least seven cards)
 * @param lands - the land count asked about
 */
function chanceOfExactly(library: LibraryCount, lands: number): number {
  const { librarySize, matching } = library;
  const handsWithLands =
    binomial(matching, lands) *
    binomial(librarySize - matching, OPENING_HAND_SIZE - lands);
  return handsWithLands / binomial(librarySize, OPENING_HAND_SIZE);
}

/**
 * The chance of every land count an opening seven can hold, from 0 to 7.
 *
 * @param library - an answerable library (at least seven cards)
 */
function spreadOf(library: LibraryCount): readonly LandCountChance[] {
  return Array.from({ length: OPENING_HAND_SIZE + 1 }, (_, lands) => ({
    lands,
    probability: chanceOfExactly(library, lands),
  }));
}

/**
 * The land-drop chance of one turn, or nothing when the library holds fewer
 * cards than that turn draws: a short library has no land drop to show past
 * its last card, and a zero there would read as a measured chance.
 *
 * @param library - the library and its lands
 * @param turn - the player's turn, from 1
 * @param table - the table, which decides whether turn 1 draws (CR 103.8)
 */
function landDropOn(
  library: LibraryCount,
  turn: number,
  table: TableSize
): readonly LandDropChance[] {
  const drawn = cardsDrawnBy({ kind: "turn", turn }, table);
  const odds = chanceOfAtLeast({ ...library, drawn, minimum: turn });
  return odds.kind === "known"
    ? [{ turn, drawn, probability: odds.probability }]
    : [];
}

/**
 * The land-drop chances of turns 1 to 7, in turn order.
 *
 * @param library - the library and its lands
 * @param table - the table, which decides whether turn 1 draws (CR 103.8)
 */
function landDropsOf(
  library: LibraryCount,
  table: TableSize
): readonly LandDropChance[] {
  return Array.from({ length: LAST_LAND_DROP_TURN }, (_, index) =>
    landDropOn(library, index + 1, table)
  ).flat();
}

/**
 * The reason a library has no land figures, checked in the order a player
 * would fix it: add cards first, then lands.
 *
 * @param library - the library and its lands
 * @returns the gap, or `null` when the figures can be counted
 */
function findGap(library: LibraryCount): OpeningHandLandsGap | null {
  if (library.librarySize === 0) return "empty-library";
  if (library.matching === 0) return "no-lands";
  if (library.librarySize < OPENING_HAND_SIZE) return "more-drawn-than-library";
  return null;
}

/**
 * The land figures of a library's opening hand and first turns: the average
 * lands in an opening seven, the chance of each count from 0 to 7, and the
 * chance of N lands by turn N for turns 1 to 7.
 *
 * Counts the opening seven (CR 103.5) and the draws only: no mulligan, no
 * ramp, no card that fetches or draws a land, and no colour. The average is
 * the hypergeometric mean, 7 × lands / library size; each spread term is
 * exact; each land drop is `chanceOfAtLeast` over the cards `cardsDrawnBy`
 * gives for that turn at the table. No randomness and no stored result.
 *
 * @example
 * // A 99-card library with 36 lands, at a Commander table:
 * openingHandLands({ librarySize: 99, matching: 36 }, "multiplayer");
 * // → averageLands ≈ 2.545; spread[2].probability ≈ 0.2975
 * //   (1,133,685 / 3,811,324); landDrops[2] = { turn: 3, drawn: 10,
 * //   probability ≈ 0.7805 }
 *
 * @param library - the library and its lands, as `countLibrary` gives them
 *   for the lands target
 * @param table - the table the game is played at, for the turn draws
 * @returns the figures, or `unknown` with the reason there are none; never a
 *   table of zeros standing in for a missing value
 */
export function openingHandLands(
  library: LibraryCount,
  table: TableSize
): OpeningHandLands {
  const gap = findGap(library);
  if (gap !== null) return { kind: "unknown", reason: gap };
  return {
    kind: "known",
    averageLands: (OPENING_HAND_SIZE * library.matching) / library.librarySize,
    spread: spreadOf(library),
    landDrops: landDropsOf(library, table),
  };
}
