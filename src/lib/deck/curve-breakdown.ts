/**
 * The mana curve's breakdown: which deck rows a curve bar counts, how many of them are permanents
 * and how many spells, and the cards behind one bar.
 *
 * Context: deck statistics (I-37 Editor depth, requirement 10.3): "a clickable figure is computed
 * from the same predicate as its filter". `inCurveBucket` is that predicate for a curve bar, so the
 * in-deck filter bar (I-37 slice 6) can reuse it and its count equals the bar's figure.
 *
 * It counts the rows `buildManaCurve` counts (`lib/deck/stats.ts`): the commander, the partner and
 * the main deck, lands left out by category. It reads the builder's `deckAnalysisCards`, where the
 * commander and partner rows hold zone `main` (`apiCardToDeckCard` defaults it, and
 * `store-card-faces.ts` sets it) and the companion is absent.
 *
 * @module deck/curve-breakdown
 */
import { facesOf, hasCardType } from "@/lib/deck-lab/card-faces";
import { extractColorPips } from "@/lib/mana/parse";
import type { DeckCard } from "./types";

/** The top bucket of the curve: it holds every card of mana value 7 or more. */
export const CURVE_TOP_BUCKET = 7;

/** The two parts of a curve bar. */
export type CurveSide = "permanent" | "spell";

/** A curve bar's copies, split by side. */
export interface CurveParts {
  readonly permanents: number;
  readonly spells: number;
}

/**
 * CR 110.4: the permanent card types. A land is a permanent too, though the curve leaves lands out
 * by category; a land-typed row filed under another category still counts as a permanent.
 */
const PERMANENT_TYPES = [
  "Artifact",
  "Battle",
  "Creature",
  "Enchantment",
  "Land",
  "Planeswalker",
] as const;

/**
 * Whether the curve counts a row: a main-deck row (the commander and partner rows included) that
 * is not filed as a land. The same rows as `buildManaCurve`.
 *
 * @param card - a row of the builder's deck analysis cards
 * @returns true when a curve bar counts its copies
 */
export function isCurveRow(card: Pick<DeckCard, "zone" | "category">): boolean {
  return card.zone === "main" && card.category !== "land";
}

/**
 * The curve bucket of a mana value: the value itself, or the top bucket for 7 and more.
 *
 * @param cmc - a card's mana value as stored (Scryfall's `cmc`)
 * @returns the bucket it falls in
 */
export function curveBucketOf(cmc: number): number {
  return Math.min(cmc, CURVE_TOP_BUCKET);
}

/**
 * The curve bar predicate (I-37 10.3): whether a row is one of a bucket's cards.
 *
 * @param card - a row of the builder's deck analysis cards
 * @param bucket - a bucket from 0 to `CURVE_TOP_BUCKET`
 * @returns true when the row's copies count in that bar
 */
export function inCurveBucket(card: DeckCard, bucket: number): boolean {
  return isCurveRow(card) && curveBucketOf(card.cmc) === bucket;
}

/**
 * Whether a card is a permanent or a spell. CR 712.8a: a double-faced card has only its front
 * face's characteristics outside the stack and the battlefield, so the front face decides.
 *
 * @param card - a deck card
 * @returns "permanent" when the front face has a permanent card type (CR 110.4), else "spell"
 */
export function curveSideOf(card: DeckCard): CurveSide {
  const { front } = facesOf(card);
  return PERMANENT_TYPES.some((type) => hasCardType(front, type))
    ? "permanent"
    : "spell";
}

/** Adds a row's copies to the side it belongs to. */
function addToParts(parts: CurveParts, card: DeckCard): CurveParts {
  return curveSideOf(card) === "permanent"
    ? { ...parts, permanents: parts.permanents + card.quantity }
    : { ...parts, spells: parts.spells + card.quantity };
}

/** No copies on either side. */
export const NO_PARTS: CurveParts = { permanents: 0, spells: 0 };

/**
 * Every curve bar's permanents and spells. Each bar's two parts add up to `buildManaCurve`'s
 * figure for that bucket.
 *
 * @param cards - the builder's deck analysis cards (commander, partner and every zone)
 * @returns the parts of each bucket that holds at least one copy
 */
export function curvePartsByBucket(
  cards: readonly DeckCard[]
): ReadonlyMap<number, CurveParts> {
  const parts = new Map<number, CurveParts>();
  for (const card of cards) {
    if (!isCurveRow(card)) continue;
    const bucket = curveBucketOf(card.cmc);
    parts.set(bucket, addToParts(parts.get(bucket) ?? NO_PARTS, card));
  }
  return parts;
}

/**
 * The curve's figures: the copies of each bucket, the sum of its two parts. They equal
 * `buildManaCurve`'s for the same cards, so a view without the builder's statistics (the shared
 * deck view) draws the bars its parts and card lists add up to.
 *
 * @param cards - the builder's deck analysis cards (commander, partner and every zone)
 * @returns copies per bucket, for each bucket that holds at least one copy
 */
export function manaCurveOf(
  cards: readonly DeckCard[]
): Readonly<Record<number, number>> {
  const curve: Record<number, number> = {};
  for (const [bucket, { permanents, spells }] of curvePartsByBucket(cards)) {
    curve[bucket] = permanents + spells;
  }
  return curve;
}

/** A mana value held by a number of copies. */
interface WeightedValue {
  readonly value: number;
  readonly weight: number;
}

/** The value of the copy at a 0-based position, copies sorted by value. */
function valueAt(sorted: readonly WeightedValue[], index: number): number {
  let seen = 0;
  const entry = sorted.find(({ weight }) => {
    seen += weight;
    return index < seen;
  });
  return entry?.value ?? 0;
}

/** The median over every copy: the mean of the two middle copies when the count is even. */
function weightedMedian(entries: readonly WeightedValue[]): number | null {
  const total = entries.reduce((sum, { weight }) => sum + weight, 0);
  if (total === 0) return null;
  const sorted = entries.toSorted((a, b) => a.value - b.value);
  const lower = valueAt(sorted, Math.floor((total - 1) / 2));
  const upper = valueAt(sorted, Math.floor(total / 2));
  return (lower + upper) / 2;
}

/** The curve's medians, without and with lands; both null when the curve counts no copy. */
export interface CurveMedians {
  readonly withoutLands: number | null;
  readonly withLands: number | null;
}

/**
 * The median mana value of the curve's copies, and of those copies with the same zones' lands.
 *
 * It reads `cmc` as stored, not the 7+ bucket. CR 202.3a: a card with no mana cost, a land
 * included, has mana value 0. CR 202.3e: X counts as 0 outside the stack, as Scryfall's `cmc`
 * already does.
 *
 * @param cards - the builder's deck analysis cards (commander, partner and every zone)
 * @returns both medians, or both null when the deck has no nonland card
 */
export function curveMedians(cards: readonly DeckCard[]): CurveMedians {
  const nonland = cards
    .filter(isCurveRow)
    .map(({ cmc, quantity }) => ({ value: cmc, weight: quantity }));
  const withoutLands = weightedMedian(nonland);
  if (withoutLands === null) return { withoutLands: null, withLands: null };
  const lands = cards
    .filter((card) => card.zone === "main" && card.category === "land")
    .reduce((sum, { quantity }) => sum + quantity, 0);
  return {
    withoutLands,
    withLands: weightedMedian([...nonland, { value: 0, weight: lands }]),
  };
}

/**
 * The deck's total mana value (CR 202.3): mana value times quantity over the commander, the
 * partner and the main deck. Lands add nothing; the curve leaves them out.
 *
 * @param cards - the builder's deck analysis cards (commander, partner and every zone)
 * @returns the sum, 0 for a deck with no nonland card
 */
export function totalManaValue(cards: readonly DeckCard[]): number {
  return cards
    .filter(isCurveRow)
    .reduce((sum, { cmc, quantity }) => sum + cmc * quantity, 0);
}

/** The five colours in WUBRG order (CR 105.1), then colourless. */
export const CURVE_COLOURS = ["W", "U", "B", "R", "G", "C"] as const;

/** A colour a curve bar's cards are counted in. */
export type CurveColour = (typeof CURVE_COLOURS)[number];

/** The copies of a bar's cards in one colour. */
export interface CurveColourCount {
  readonly colour: CurveColour;
  readonly copies: number;
}

/** The cards behind one curve bar. */
export interface CurveBucketCards {
  /** The bar's rows, by name. */
  readonly rows: readonly DeckCard[];
  /** Their copies: always the bar's figure. */
  readonly count: number;
  readonly parts: CurveParts;
  /** Copies per colour, WUBRG then colourless; a colour with no copy is left out. */
  readonly colours: readonly CurveColourCount[];
}

/**
 * The colours a card counts in, by the colour distribution panel's rule (`lib/deck/stats.ts`):
 * the coloured symbols of its mana cost (CR 105.2, 202.2), or its colour identity when it has no
 * mana cost. A card with neither counts as colourless.
 */
function coloursOf(card: DeckCard): readonly CurveColour[] {
  const named = card.manaCost
    ? Object.keys(extractColorPips(card.manaCost))
    : card.colorIdentity;
  const colours = CURVE_COLOURS.filter(
    (colour) => colour !== "C" && named.includes(colour)
  );
  return colours.length > 0 ? colours : ["C"];
}

/** Copies per colour; a multicoloured card counts once in each of its colours. */
function colourCounts(rows: readonly DeckCard[]): readonly CurveColourCount[] {
  const copies = new Map<CurveColour, number>();
  for (const row of rows) {
    for (const colour of coloursOf(row)) {
      copies.set(colour, (copies.get(colour) ?? 0) + row.quantity);
    }
  }
  return CURVE_COLOURS.flatMap((colour) => {
    const count = copies.get(colour);
    return count === undefined ? [] : [{ colour, copies: count }];
  });
}

/**
 * The cards behind one curve bar, through the bar's own predicate (`inCurveBucket`), so their
 * count is the bar's figure (I-37 10.3).
 *
 * @param cards - the builder's deck analysis cards (commander, partner and every zone)
 * @param bucket - a bucket from 0 to `CURVE_TOP_BUCKET`
 * @returns the bar's rows by name, their count, their parts and their colours
 */
export function curveBucketCards(
  cards: readonly DeckCard[],
  bucket: number
): CurveBucketCards {
  const rows = cards
    .filter((card) => inCurveBucket(card, bucket))
    .toSorted((a, b) => a.name.localeCompare(b.name));
  return {
    rows,
    count: rows.reduce((sum, { quantity }) => sum + quantity, 0),
    parts: rows.reduce((parts, card) => addToParts(parts, card), NO_PARTS),
    colours: colourCounts(rows),
  };
}
