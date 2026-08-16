/**
 * Turn-one playability: how often the opening hand can actually do something.
 *
 * A low curve looks good in `manaCurve` and a healthy land count looks good in
 * the stats panel, but neither says whether the two arrive *together*. This
 * answers that directly, as a probability over the opening seven.
 *
 * Two figures are reported, and deliberately not merged:
 *
 * - `anyPlay` ignores colour — a land and a one-drop, whatever they are.
 * - `byColor` requires a matching source, which is the stricter, truer read.
 *
 * They are kept apart because the per-colour events overlap: a hand can satisfy
 * green and blue at once, so the colour rows cannot simply be summed into an
 * overall figure without double-counting. Each row is exact on its own terms.
 *
 * The model is the opening hand only — no mulligans, no scry, no cantrips, and
 * no card that cheats mana. It is a floor, not a forecast.
 *
 * @module turn-one
 */

import { extractColorPips } from "../mana/parse";
import { OPENING_HAND_SIZE } from "../playtest/engine";

import { countColorSources, PIP_COLORS, type PipColor } from "./mana-alignment";
import type { DeckCard } from "./types";

/** One colour's chance of producing a turn-one play. */
export interface ColorPlayability {
  readonly color: PipColor;
  /** One-mana spells castable with this colour, counting quantities */
  readonly spells: number;
  /** Lands producing this colour, counting quantities */
  readonly sources: number;
  /** Chance the opening hand holds at least one of each (0–1) */
  readonly probability: number;
}

/** How likely the deck is to act on turn one. */
export interface TurnOnePlayability {
  /** Chance of a land plus a one-drop, ignoring colour (0–1) */
  readonly anyPlay: number;
  /** One row per colour that has a one-drop, in WUBRG order */
  readonly byColor: readonly ColorPlayability[];
  readonly oneDrops: number;
  readonly lands: number;
  /** Cards in the library — the commander sits in the command zone, not here */
  readonly deckSize: number;
}

/**
 * Number of ways to choose `k` items from `n`.
 *
 * Multiplied and divided in alternation so the running value stays small; the
 * factorials themselves would overflow a double long before a 100-card deck.
 *
 * @param n - size of the set
 * @param k - size of the selection
 * @returns the count, or 0 when the selection cannot be made
 */
function binomial(n: number, k: number): number {
  if (k < 0 || n < 0 || k > n) return 0;

  const smaller = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < smaller; i += 1) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

/**
 * Chance an opening hand contains at least one card from each of two groups.
 *
 * The groups must be disjoint — lands and spells, or sources and the spells
 * they cast. Computed by inclusion–exclusion on the complements, which is exact
 * rather than sampled:
 *
 *     P(both) = 1 − P(no A) − P(no B) + P(neither)
 *
 * @param deckSize - cards in the library
 * @param groupA - cards in the first group
 * @param groupB - cards in the second group, disjoint from the first
 * @param handSize - cards drawn; capped at the deck size
 * @returns the probability, in 0–1
 */
export function chanceOfBoth(
  deckSize: number,
  groupA: number,
  groupB: number,
  handSize: number
): number {
  if (deckSize <= 0 || groupA <= 0 || groupB <= 0) return 0;

  // Drawing more cards than the deck holds just means drawing all of it.
  const drawn = Math.min(handSize, deckSize);
  const total = binomial(deckSize, drawn);
  if (total === 0) return 0;

  const missingA = binomial(deckSize - groupA, drawn) / total;
  const missingB = binomial(deckSize - groupB, drawn) / total;
  const missingBoth = binomial(deckSize - groupA - groupB, drawn) / total;

  // Floating-point drift can push the sum a hair outside the range.
  return Math.min(1, Math.max(0, 1 - missingA - missingB + missingBoth));
}

/**
 * The colours a one-mana spell can be cast with.
 *
 * A hybrid one-drop belongs to every colour on its cost, since either will
 * cast it. That makes the colour rows overlap, which is why they are never
 * summed.
 *
 * @param card - the spell to inspect
 * @returns its castable colours, empty for a colourless cost
 */
function castableColors(card: DeckCard): readonly PipColor[] {
  const pips = extractColorPips(card.manaCost);
  return PIP_COLORS.filter((color) => (pips[color] ?? 0) > 0);
}

/**
 * Computes how likely the deck is to make a play on turn one.
 *
 * @param libraryCards - the main-zone cards; the commander must not be included
 * @returns the reading, or `null` when the deck has no one-mana spells
 */
export function buildTurnOnePlayability(
  libraryCards: readonly DeckCard[]
): TurnOnePlayability | null {
  const deckSize = libraryCards.reduce((sum, card) => sum + card.quantity, 0);
  if (deckSize === 0) return null;

  // A land is played, not cast, so its mana value never makes it a one-drop.
  const oneDropCards = libraryCards.filter(
    (card) => card.category !== "land" && card.cmc === 1
  );
  const oneDrops = oneDropCards.reduce((sum, card) => sum + card.quantity, 0);
  if (oneDrops === 0) return null;

  const lands = libraryCards
    .filter((card) => card.category === "land")
    .reduce((sum, card) => sum + card.quantity, 0);

  const sourcesByColor = countColorSources(libraryCards);

  const byColor: ColorPlayability[] = [];
  for (const color of PIP_COLORS) {
    const spells = oneDropCards
      .filter((card) => castableColors(card).includes(color))
      .reduce((sum, card) => sum + card.quantity, 0);
    if (spells === 0) continue;

    const sources = sourcesByColor[color];
    byColor.push({
      color,
      spells,
      sources,
      probability: chanceOfBoth(deckSize, sources, spells, OPENING_HAND_SIZE),
    });
  }

  return {
    anyPlay: chanceOfBoth(deckSize, lands, oneDrops, OPENING_HAND_SIZE),
    byColor,
    oneDrops,
    lands,
    deckSize,
  };
}
