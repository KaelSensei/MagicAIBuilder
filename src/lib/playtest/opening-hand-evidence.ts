import type { DeckCard } from "@/lib/deck/types";
import { colorsProducedBy, PIP_COLORS, type PipColor } from "@/lib/deck/mana-alignment";
import { parseManaCost, type ManaToken } from "@/lib/mana/parse";

/** Land-balance verdict for an opening hand. */
export type OpeningHandLandStatus = "land-light" | "balanced" | "land-heavy";

/** Deterministic land evidence shown before the first turn progresses. */
export interface OpeningHandLandEvidence {
  readonly landCount: number;
  readonly status: OpeningHandLandStatus;
}

/** Castability evidence for the opening hand at its current land count. */
export interface OpeningHandEvidence {
  readonly landCount: number;
  readonly landStatus: OpeningHandLandStatus;
  readonly missingColors: readonly PipColor[];
  readonly hasPlayableSpell: boolean;
  readonly isDead: boolean;
}

/** Maximum land count that is considered land-light in a seven-card hand. */
const LAND_LIGHT_MAX = 1;

/** Minimum land count that is considered land-heavy in a seven-card hand. */
const LAND_HEAVY_MIN = 5;

/**
 * Classifies the land balance of an opening hand.
 *
 * Double-faced cards with a land face count as lands because their type line
 * contains `Land`, even when the deck category was customized by the player.
 *
 * @param hand - cards currently held before play begins
 * @returns the number of lands and an actionable balance verdict
 */
export function analyzeOpeningHandLands(
  hand: readonly DeckCard[]
): OpeningHandLandEvidence {
  let landCount = 0;
  for (const card of hand) {
    if (card.typeLine.includes("Land")) landCount += 1;
  }

  if (landCount <= LAND_LIGHT_MAX) return { landCount, status: "land-light" };
  if (landCount >= LAND_HEAVY_MIN) return { landCount, status: "land-heavy" };
  return { landCount, status: "balanced" };
}

function coloredOptions(token: ManaToken): readonly PipColor[] {
  if (token.kind === "color") {
    return isPipColor(token.color) ? [token.color] : [];
  }
  if (token.kind !== "hybrid") return [];

  const options: PipColor[] = [];
  for (const symbol of [token.left, token.right]) {
    if (isPipColor(symbol)) options.push(symbol);
  }
  return options;
}

function isPipColor(symbol: string): symbol is PipColor {
  return symbol === "W" || symbol === "U" || symbol === "B" || symbol === "R" || symbol === "G";
}

function missingColorsForSpell(
  card: DeckCard,
  availableColors: ReadonlySet<PipColor>
): readonly PipColor[] {
  const missing = new Set<PipColor>();
  for (const token of parseManaCost(card.manaCost)) {
    const options = coloredOptions(token);
    if (options.length === 0 || options.some((color) => availableColors.has(color))) continue;
    for (const color of options) missing.add(color);
  }
  return PIP_COLORS.filter((color) => missing.has(color));
}

/**
 * Identifies whether the opening hand can deploy a spell with its visible lands.
 *
 * This is intentionally a deterministic snapshot, not a keep recommendation:
 * it does not predict future draws or infer conditional mana abilities.
 *
 * @param hand - cards currently held before play begins
 * @returns land balance, missing colors and immediate spell playability
 */
export function analyzeOpeningHand(hand: readonly DeckCard[]): OpeningHandEvidence {
  const landEvidence = analyzeOpeningHandLands(hand);
  const availableColors = new Set<PipColor>();
  const affordableSpells: DeckCard[] = [];

  for (const card of hand) {
    if (card.typeLine.includes("Land")) {
      for (const color of colorsProducedBy(card)) availableColors.add(color);
    } else if (card.cmc <= landEvidence.landCount) {
      affordableSpells.push(card);
    }
  }

  const missing = new Set<PipColor>();
  let hasPlayableSpell = false;
  for (const card of affordableSpells) {
    const spellMissingColors = missingColorsForSpell(card, availableColors);
    if (spellMissingColors.length === 0) hasPlayableSpell = true;
    for (const color of spellMissingColors) missing.add(color);
  }

  return {
    landCount: landEvidence.landCount,
    landStatus: landEvidence.status,
    missingColors: PIP_COLORS.filter((color) => missing.has(color)),
    hasPlayableSpell,
    isDead: landEvidence.status === "balanced" && !hasPlayableSpell,
  };
}
