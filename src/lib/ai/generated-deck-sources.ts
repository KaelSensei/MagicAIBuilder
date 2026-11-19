/**
 * The mana sources an AI-generated list has and needs, read from Scryfall card
 * data for the size repair (`generated-deck-size.ts`): the colours a kept land
 * taps for, and each command-zone colour's source target (I-58 requirement 3).
 *
 * @module ai/generated-deck-sources
 */
import {
  colorsProducedBy,
  PIP_COLORS,
  type PipColor,
} from "@/lib/deck/mana-alignment";
import {
  sourceTargetsByColour,
  type SpellCost,
} from "@/lib/deck/source-targets";
import type { ScryfallCard } from "@/lib/scryfall/types";
import type { SourceNeed } from "./generated-deck-size";

/** The cost of the face a player casts first: the front face of a card with faces. */
function frontFaceCost(card: ScryfallCard): SpellCost {
  return {
    name: card.name,
    manaCost: card.card_faces?.[0]?.mana_cost ?? card.mana_cost ?? "",
  };
}

/**
 * The colours a card taps for when its front face is a land.
 *
 * @param card - Scryfall card data of a kept card
 * @returns The colours it produces; empty for a card whose front face is not a land
 */
export function producedColoursOf(card: ScryfallCard): readonly PipColor[] {
  const [frontTypeLine = ""] = card.type_line.split("//", 1);
  if (!/\bLand\b/.test(frontTypeLine)) return [];
  return [
    ...colorsProducedBy({
      typeLine: card.type_line,
      oracleText: card.oracle_text ?? "",
      colorIdentity: card.color_identity,
    }),
  ];
}

/**
 * Each colour of the command zone with its source target, set by the most
 * demanding of the commanders' and the kept cards' costs (I-58 requirement 3).
 *
 * @param commandZone - The commander and, when there is one, the partner or Background
 * @param kept - The card data of every kept list entry
 * @returns One need per colour of the command zone's identity, in WUBRG order
 */
export function sourceNeeds(
  commandZone: readonly ScryfallCard[],
  kept: readonly ScryfallCard[]
): readonly SourceNeed[] {
  const identity = new Set(commandZone.flatMap((card) => card.color_identity));
  const targets = sourceTargetsByColour(
    [...commandZone, ...kept].map(frontFaceCost)
  );
  return PIP_COLORS.filter((colour) => identity.has(colour)).map((colour) => ({
    colour,
    target: targets.get(colour)?.sources ?? 0,
  }));
}
