/**
 * Frank Karsten's published Commander mana-base numbers, as data and pure
 * functions: the 99-card land-count formula, the coloured-source column, the
 * weights of partial sources and modal double-faced lands, and his rule of
 * thumb.
 *
 * Deck analysis, I-58 slice 1. Later slices read these tables: the mana base
 * check, the wizard's basic split and the land proposal.
 * Sources, read through TCGplayer's content API on 2026-11-10:
 * - [1] "What's an Optimal Mana Curve and Land/Ramp Count for Commander?",
 *   2022-07-15. https://www.tcgplayer.com/content/article/What-s-an-Optimal-Mana-Curve-and-Land-Ramp-Count-for-Commander/e22caad1-b04b-4f8a-951b-a41e9f08da14/
 * - [2] "How Many Lands Do You Need in Your Deck? An Updated Analysis",
 *   2022-07-29, updated 2025-02-13. https://www.tcgplayer.com/content/article/How-Many-Lands-Do-You-Need-in-Your-Deck-An-Updated-Analysis/cd1c1a24-d439-4a8e-b369-b936edb0b38a/
 * - [3] "How Many Sources Do You Need to Consistently Cast Your Spells? A 2022
 *   Update", 2022-08-02, updated 2025-02-13. https://www.tcgplayer.com/content/article/How-Many-Sources-Do-You-Need-to-Consistently-Cast-Your-Spells-A-2022-Update/dc23a7d2-0a16-4c0b-ad36-586fcca03ad8/
 * Not responsible for: reading a deck (its average mana value, its cheap ramp
 * and draw, its drivers), classifying lands, or the proportional advice in
 * `mana-alignment.ts`. No AI client is reachable from here.
 *
 * @module deck/mana-base-tables
 */

/** Karsten's 99-card land-count formula [2]: 31.42 + 3.13 × a − 0.28 × c. */
const LAND_FORMULA = {
  intercept: 31.42,
  perAverageManaValue: 3.13,
  perCheapRampOrDraw: -0.28,
} as const;

/** The deck figures the land-count formula reads. */
export interface LandCountInputs {
  /** Average mana value of the 99's nonland cards, commander excluded */
  readonly averageManaValue: number;
  /**
   * Cards of mana value 2 or less that draw cards, add mana or search for
   * lands: Karsten's "cheap card draw or mana ramp" [2]
   */
  readonly cheapRampAndDraw: number;
}

/**
 * Why the formula has no answer, so a screen can say what is missing instead
 * of showing a number:
 * - `not-a-mana-value`: the average is negative or not a finite number.
 * - `not-a-card-count`: the cheap-piece count is negative or not whole.
 */
export type LandCountGap = "not-a-mana-value" | "not-a-card-count";

/** The formula's land count, or the reason there is none. */
export type LandCountTarget =
  | {
      readonly kind: "known";
      /** Lands, to two decimals, as Karsten's coefficients are published */
      readonly lands: number;
    }
  | { readonly kind: "unknown"; readonly reason: LandCountGap };

/**
 * Whether a value can be a number of cards: whole and not negative.
 *
 * @param count - the value to check
 */
function isCardCount(count: number): boolean {
  return Number.isInteger(count) && count >= 0;
}

/**
 * Rounds to two decimals, the precision of the published coefficients, so
 * 40.81 never reads as 40.809999999999995.
 *
 * @param value - the raw formula result
 */
function toHundredths(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Karsten's recommended land count for a 99-card Commander deck [2].
 *
 * The formula was fitted on 95,143 winning 60-card decks and scaled to 99
 * cards; its author calls it "an imprecise back-of-the-envelope estimate", so
 * a screen shows it as a labelled reference, never as the only answer.
 *
 * @example
 * landCountTarget({ averageManaValue: 3, cheapRampAndDraw: 10 });
 * // → { kind: "known", lands: 38.01 }
 *
 * @param inputs - the average mana value and the cheap ramp and draw count
 * @returns the land count, or `unknown` with the input that cannot be used
 */
export function landCountTarget(inputs: LandCountInputs): LandCountTarget {
  const { averageManaValue, cheapRampAndDraw } = inputs;
  if (!Number.isFinite(averageManaValue) || averageManaValue < 0) {
    return { kind: "unknown", reason: "not-a-mana-value" };
  }
  if (!isCardCount(cheapRampAndDraw)) {
    return { kind: "unknown", reason: "not-a-card-count" };
  }
  const lands =
    LAND_FORMULA.intercept +
    LAND_FORMULA.perAverageManaValue * averageManaValue +
    LAND_FORMULA.perCheapRampOrDraw * cheapRampAndDraw;
  return { kind: "known", lands: toHundredths(lands) };
}

/**
 * Karsten's 99-card column [3]: for each number of pips of one colour, the
 * sources needed, indexed by the generic part of the cost (0 for C, CC…, 1 for
 * 1C, 1CC…). "Consistent" means at least (89 + M)% on the play to hold the
 * sources by turn M, given M lands, assuming 41 lands and the free mulligan.
 */
const SOURCES_BY_PIPS: ReadonlyMap<number, readonly number[]> = new Map([
  [1, [19, 19, 18, 16, 15, 14]],
  [2, [30, 28, 26, 23, 22, 20]],
  [3, [36, 33, 30, 28, 26]],
  [4, [39, 36]],
]);

/** One spell's cost, seen from one colour. */
export interface ColourCost {
  /** The spell's mana value */
  readonly manaValue: number;
  /** Pips of the colour being checked, such as 2 for {1}{G}{G} and green */
  readonly pips: number;
}

/**
 * Why a cost has no source target:
 * - `not-a-cost`: a count that is negative or not whole, or more pips than
 *   the mana value holds.
 * - `pips-not-in-table`: no pip of the colour, or more pips than the column
 *   publishes (five and up). Nothing is extrapolated.
 */
export type SourceTargetGap = "not-a-cost" | "pips-not-in-table";

/** The sources a colour needs to cast one cost on curve. */
export type SourceTarget =
  | {
      readonly kind: "exact";
      /** The column entry, such as "1CC" */
      readonly entry: string;
      readonly sources: number;
    }
  | {
      readonly kind: "nearest-lower";
      /** The cost that was asked, such as "6CC" */
      readonly asked: string;
      /** The entry used instead: same pips, nearest lower mana value */
      readonly entry: string;
      readonly sources: number;
    }
  | { readonly kind: "outside-table"; readonly reason: SourceTargetGap };

/**
 * Writes a cost the way the column does: the generic part, then one C per
 * pip, such as "2CC".
 *
 * @param generic - the generic mana in the cost
 * @param pips - the pips of one colour
 */
function costPattern(generic: number, pips: number): string {
  const coloured = "C".repeat(pips);
  return generic === 0 ? coloured : `${generic}${coloured}`;
}

/**
 * Karsten's 99-card source target for one cost and one colour [3].
 *
 * A cost in the column returns its entry. A cost with more generic mana than
 * the column lists uses the entry with the same pips and the nearest lower
 * mana value, and says so, as I-58 requirement 3.1 asks. A gold spell's extra
 * source per colour is the caller's to add.
 *
 * @example
 * sourceTarget({ manaValue: 3, pips: 2 }); // {1}{G}{G}
 * // → { kind: "exact", entry: "1CC", sources: 28 }
 *
 * @param cost - the mana value and the pips of the colour
 * @returns the sources, or `outside-table` with the reason there is no number
 */
export function sourceTarget(cost: ColourCost): SourceTarget {
  const { manaValue, pips } = cost;
  if (!isCardCount(manaValue) || !isCardCount(pips) || pips > manaValue) {
    return { kind: "outside-table", reason: "not-a-cost" };
  }
  const column = SOURCES_BY_PIPS.get(pips) ?? [];
  const generic = manaValue - pips;
  const listed = Math.min(generic, column.length - 1);
  const sources = column[listed];
  if (sources === undefined) {
    return { kind: "outside-table", reason: "pips-not-in-table" };
  }
  const entry = costPattern(listed, pips);
  if (listed === generic) return { kind: "exact", entry, sources };
  return {
    kind: "nearest-lower",
    asked: costPattern(generic, pips),
    entry,
    sources,
  };
}

/** Whether a modal double-faced card is mythic: its weights depend on it. */
export type MdfcRarity = "mythic" | "non-mythic";

/** What a spell with a land on its back counts for. */
export interface MdfcWeights {
  /** Share of a land in the land count [2] */
  readonly land: number;
  /** Share of a coloured source in the source count [3] */
  readonly source: number;
}

/**
 * Karsten's weights for a modal double-faced card whose back is a land, such
 * as Shatterskull Smashing: a spell that can be a land, neither a full land
 * nor zero (I-58 requirements 2.2 and 2.7). A card that transforms into a land
 * later, such as Treasure Map, is a spell and takes no weight here.
 *
 * @param rarity - whether the card is mythic
 * @returns its share of a land [2] and of a source [3]
 */
export function mdfcWeights(rarity: MdfcRarity): MdfcWeights {
  switch (rarity) {
    case "mythic":
      return { land: 0.74, source: 1 };
    case "non-mythic":
      return { land: 0.38, source: 0.8 };
  }
  const exhaustive: never = rarity;
  return exhaustive;
}

/** A card kind Karsten counts as part of a coloured source [3]. */
export type PartialSourceKind =
  | "fetchLand"
  | "signet"
  | "manaDork"
  | "twoManaLandRamp"
  | "treasureMaker"
  | "exoticOrchard"
  | "fellwarStone";

/** How much one card of a partial-source kind counts, and when. */
export interface PartialSource {
  /** Share of a source of each colour it can make */
  readonly weight: number;
  /** The spells it counts for: some ramp only helps cast three-drops and up */
  readonly countsFor: "any-spell" | "mana-value-3-or-more";
  /** True when the colours depend on the opponents' decks, unknown here */
  readonly dependsOnOpponents: boolean;
}

/**
 * Karsten's partial-source weights [3]. A fetch land is a full source of each
 * colour it can find; Karsten lowers that to about two-thirds for Fabled
 * Passage-type fetches in heavy three-plus-colour decks, a choice I-58 leaves
 * open (open question 6). Exotic Orchard and Fellwar Stone count only when the
 * opponents' colours are unknown, so they carry the "depends on opponents"
 * flag. Modal double-faced lands are in `mdfcWeights`.
 */
export const KARSTEN_PARTIAL_SOURCES: Readonly<
  Record<PartialSourceKind, PartialSource>
> = {
  fetchLand: { weight: 1, countsFor: "any-spell", dependsOnOpponents: false },
  signet: {
    weight: 0.75,
    countsFor: "mana-value-3-or-more",
    dependsOnOpponents: false,
  },
  manaDork: { weight: 0.5, countsFor: "any-spell", dependsOnOpponents: false },
  twoManaLandRamp: {
    weight: 0.75,
    countsFor: "mana-value-3-or-more",
    dependsOnOpponents: false,
  },
  treasureMaker: {
    weight: 0.25,
    countsFor: "any-spell",
    dependsOnOpponents: false,
  },
  exoticOrchard: {
    weight: 0.75,
    countsFor: "any-spell",
    dependsOnOpponents: true,
  },
  fellwarStone: { weight: 0.5, countsFor: "any-spell", dependsOnOpponents: true },
};
