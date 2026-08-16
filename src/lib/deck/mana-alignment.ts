/**
 * Mana base alignment: do the deck's lands produce the colours its spells need?
 *
 * `computeDeckStats` already reports the colour distribution of the *spells*
 * via their pips. It says nothing about the other half of the equation — what
 * the lands actually tap for — so a deck can read as perfectly balanced while
 * being unable to cast half its cards. This module supplies the land side and
 * compares the two.
 *
 * Unlike `format-stats`, this is deliberately **not** gated on a `FormatConfig`
 * flag. The obvious candidate, `hasColorIdentity`, encodes the Commander
 * colour-identity rule, not whether mana alignment is worth measuring — and a
 * two-colour Modern list needs this read at least as much as a Commander deck.
 * The gate is the data instead: a deck with no coloured pips has nothing to
 * align, and gets `null`.
 *
 * Scryfall's `produced_mana` is not stored anywhere in this codebase, so what a
 * land taps for is derived from its printed text. That derivation is a
 * heuristic — see `colorsProducedBy`.
 *
 * @module mana-alignment
 */

import { extractColorPips } from "../mana/parse";

import { MANA_IMBALANCE_THRESHOLD } from "./constants";
import type { DeckCard } from "./types";

/** The five real colours. Colourless and snow do not participate in alignment. */
export type PipColor = "W" | "U" | "B" | "R" | "G";

/** Canonical WUBRG ordering, used for every colour list this module returns. */
const PIP_COLORS: readonly PipColor[] = ["W", "U", "B", "R", "G"];

/** Basic land subtype to the colour it taps for. */
const SUBTYPE_COLORS: ReadonlyMap<string, PipColor> = new Map([
  ["Plains", "W"],
  ["Island", "U"],
  ["Swamp", "B"],
  ["Mountain", "R"],
  ["Forest", "G"],
]);

/** How a colour's share of sources compares to its share of pips. */
export type AlignmentStatus = "under" | "aligned" | "over";

/** One colour's side-by-side read of demand (pips) against supply (sources). */
export interface ColorAlignment {
  readonly color: PipColor;
  /** Coloured pips the deck's spells ask for, hybrids counted as halves */
  readonly pips: number;
  /** `pips` as a share of all coloured pips (0–1) */
  readonly pipShare: number;
  /** Lands that can tap for this colour, counting quantities */
  readonly sources: number;
  /** `sources` as a share of all lands (0–1) */
  readonly sourceShare: number;
  /** `sourceShare - pipShare`, in percentage points; negative means starved */
  readonly gap: number;
  readonly status: AlignmentStatus;
  /** Sources this colour would have if the land slots mirrored the pips */
  readonly recommendedSources: number;
}

/** The mana base read for a whole deck. */
export interface ManaAlignment {
  /** One entry per colour the deck either asks for or produces, in WUBRG order */
  readonly colors: readonly ColorAlignment[];
  readonly totalPips: number;
  /** Every land in the deck, colour-producing or not */
  readonly totalSources: number;
  /** Lands that produce no coloured mana at all */
  readonly colorlessSources: number;
  /** True when no colour deviates by more than `MANA_IMBALANCE_THRESHOLD` points */
  readonly isAligned: boolean;
}

/** A zeroed tally, one slot per colour. */
function emptyTally(): Record<PipColor, number> {
  return { W: 0, U: 0, B: 0, R: 0, G: 0 };
}

/**
 * Pulls the subtypes off a type line — everything after the em dash.
 *
 * Reading only the subtype half matters: "Land — Mountain Valley" taps for
 * nothing red, and matching "Mountain" against the whole line would invent a
 * red source.
 *
 * @param typeLine - the card's printed type line
 * @returns the subtype portion, or an empty string when there is none
 */
function subtypesOf(typeLine: string): string {
  const dash = typeLine.indexOf("—");
  return dash === -1 ? "" : typeLine.slice(dash + 1);
}

/**
 * Collects the colours a land's own "Add …" clauses produce.
 *
 * Only text following an "Add" is read, up to the end of that sentence. A land
 * whose activation *costs* {W} does not thereby produce white, and scanning the
 * whole oracle text would credit it anyway.
 *
 * @param oracleText - the land's printed text
 * @returns the colours it adds; every colour when it adds mana of any colour
 */
function colorsFromOracleText(oracleText: string): ReadonlySet<PipColor> {
  const found = new Set<PipColor>();
  const lower = oracleText.toLowerCase();

  let cursor = lower.indexOf("add");
  while (cursor !== -1) {
    const sentenceEnd = oracleText.slice(cursor).search(/[.\n]/);
    const clause = sentenceEnd === -1 ? oracleText.slice(cursor) : oracleText.slice(cursor, cursor + sentenceEnd);

    // "Add one mana of any color" — a single source for all five.
    if (clause.toLowerCase().includes("any color")) {
      for (const color of PIP_COLORS) found.add(color);
      return found;
    }

    for (const match of clause.matchAll(/\{([WUBRG])\}/g)) {
      found.add(match[1] as PipColor);
    }
    cursor = lower.indexOf("add", cursor + 3);
  }

  return found;
}

/**
 * Works out which colours a single land can tap for.
 *
 * Three passes, most reliable first: printed subtypes, then the land's own
 * "Add …" clauses, then colour identity as a last resort. Colour identity is
 * the weakest signal — on a land it usually does reflect production, but it
 * also picks up activation costs — so it is only consulted when the first two
 * find nothing.
 *
 * @param card - the land to inspect
 * @returns the colours it produces, empty for a colourless-only land
 */
export function colorsProducedBy(card: DeckCard): ReadonlySet<PipColor> {
  const colors = new Set<PipColor>();

  const subtypes = subtypesOf(card.typeLine);
  for (const [subtype, color] of SUBTYPE_COLORS) {
    if (subtypes.includes(subtype)) colors.add(color);
  }

  for (const color of colorsFromOracleText(card.oracleText)) colors.add(color);

  if (colors.size === 0) {
    for (const symbol of card.colorIdentity) {
      if ((PIP_COLORS as readonly string[]).includes(symbol)) colors.add(symbol as PipColor);
    }
  }

  return colors;
}

/**
 * Counts the lands producing each colour, respecting quantities.
 *
 * Only cards categorised as lands count. A mana creature or a signet fixes
 * colours too, but it has to be drawn *and* cast first, so folding it into the
 * same number would overstate how reliably the deck produces that colour.
 *
 * @param cards - every card in the deck; non-lands are ignored
 * @returns one count per colour
 */
export function countColorSources(cards: readonly DeckCard[]): Readonly<Record<PipColor, number>> {
  const tally = emptyTally();

  for (const card of cards) {
    if (card.category !== "land") continue;
    for (const color of colorsProducedBy(card)) {
      tally[color] += card.quantity;
    }
  }

  return tally;
}

/**
 * Counts the coloured pips the deck's spells ask for, respecting quantities.
 *
 * @param cards - every card in the deck; lands are ignored
 * @returns one count per colour, hybrids counted as halves
 */
function countColorPips(cards: readonly DeckCard[]): Record<PipColor, number> {
  const tally = emptyTally();

  for (const card of cards) {
    if (card.category === "land") continue;
    const pips = extractColorPips(card.manaCost);
    for (const [symbol, count] of Object.entries(pips)) {
      if ((PIP_COLORS as readonly string[]).includes(symbol)) {
        tally[symbol as PipColor] += count * card.quantity;
      }
    }
  }

  return tally;
}

/**
 * Compares what the deck's spells cost against what its lands produce.
 *
 * The recommendation is proportional: if a third of the coloured pips are red,
 * a third of the land slots should tap for red. That is a starting point rather
 * than a target — it ignores curve position, and a colour needed on turn one
 * deserves more sources than its pip share alone suggests.
 *
 * @param cards - every card in the deck, lands included
 * @returns the alignment read, or `null` when no spell asks for coloured mana
 */
export function buildManaAlignment(cards: readonly DeckCard[]): ManaAlignment | null {
  const pipTally = countColorPips(cards);
  const totalPips = PIP_COLORS.reduce((sum, color) => sum + pipTally[color], 0);
  if (totalPips === 0) return null;

  const sourceTally = countColorSources(cards);
  const lands = cards.filter((card) => card.category === "land");
  const totalSources = lands.reduce((sum, card) => sum + card.quantity, 0);
  const colorlessSources = lands.reduce(
    (sum, card) => (colorsProducedBy(card).size === 0 ? sum + card.quantity : sum),
    0
  );

  const colors: ColorAlignment[] = [];
  for (const color of PIP_COLORS) {
    const pips = pipTally[color];
    const sources = sourceTally[color];
    if (pips === 0 && sources === 0) continue;

    const pipShare = pips / totalPips;
    // A deck with no lands is degenerate but reachable mid-build; report a zero
    // share rather than NaN, which would render as "NaN%".
    const sourceShare = totalSources === 0 ? 0 : sources / totalSources;
    const gap = (sourceShare - pipShare) * 100;

    let status: AlignmentStatus = "aligned";
    if (gap < -MANA_IMBALANCE_THRESHOLD) status = "under";
    else if (gap > MANA_IMBALANCE_THRESHOLD) status = "over";

    colors.push({
      color,
      pips,
      pipShare,
      sources,
      sourceShare,
      gap,
      status,
      recommendedSources: Math.round(pipShare * totalSources),
    });
  }

  return {
    colors,
    totalPips,
    totalSources,
    colorlessSources,
    isAligned: colors.every((entry) => entry.status === "aligned"),
  };
}
