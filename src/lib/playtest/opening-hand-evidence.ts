import type { DeckCard } from "@/lib/deck/types";

/** Land-balance verdict for an opening hand. */
export type OpeningHandLandStatus = "land-light" | "balanced" | "land-heavy";

/** Deterministic land evidence shown before the first turn progresses. */
export interface OpeningHandLandEvidence {
  readonly landCount: number;
  readonly status: OpeningHandLandStatus;
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
