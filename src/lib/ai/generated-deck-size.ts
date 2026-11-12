/**
 * Size repair of an AI-generated Commander list, after its illegal cards are gone.
 *
 * A short list is filled with basic lands of the command zone's colours
 * (Wastes when colourless). A long list loses basic lands, largest stack first;
 * it is rejected when its basic lands cannot absorb the excess, because cutting
 * a chosen spell is a deckbuilding decision, not a repair.
 *
 * @module ai/generated-deck-size
 */
import type { AICard, DeckCorrection } from "@/app/api/ai/build/types";
import type { PipColor } from "@/lib/deck/mana-alignment";

/** A card kept from the model's list, with what the size step needs to know. */
export interface KeptCard {
  readonly card: AICard;
  readonly isBasicLand: boolean;
}

/** The list at the exact deck size with the basic lands changed, or why it cannot get there. */
export type SizeRepair =
  | {
      readonly status: "fitted";
      readonly cards: readonly AICard[];
      readonly corrections: readonly DeckCorrection[];
    }
  | { readonly status: "rejected"; readonly reasons: readonly string[] };

/** The basic land that taps for each colour. */
const BASIC_LAND_FOR: Readonly<Record<PipColor, string>> = {
  W: "Plains",
  U: "Island",
  B: "Swamp",
  R: "Mountain",
  G: "Forest",
};

/** The basic land a colourless command zone may run. */
const COLORLESS_BASIC_LAND = "Wastes";

/** Adds `missing` basic lands spread over the colours in WUBRG order, onto existing stacks first. */
function addBasicLands(
  cards: readonly AICard[],
  missing: number,
  colors: readonly PipColor[]
): SizeRepair {
  const basics =
    colors.length > 0
      ? colors.map((color) => BASIC_LAND_FOR[color])
      : [COLORLESS_BASIC_LAND];
  const corrections = basics
    .map((name, index): DeckCorrection => ({
      action: "added",
      name,
      quantity:
        Math.floor(missing / basics.length) +
        (index < missing % basics.length ? 1 : 0),
      reason: "fill_to_size",
    }))
    .filter((correction) => correction.quantity > 0);

  const toAdd = new Map(
    corrections.map(({ name, quantity }) => [name, quantity])
  );
  const merged = cards.map((card) => {
    const extra = toAdd.get(card.name);
    if (extra === undefined) return card;
    toAdd.delete(card.name);
    return { ...card, quantity: card.quantity + extra };
  });
  const appended = [...toAdd].map(([name, quantity]) => ({
    name,
    quantity,
    category: "land",
  }));
  return { status: "fitted", cards: [...merged, ...appended], corrections };
}

/** Removes `excess` basic lands, largest stack first, or rejects when the basics cannot absorb it. */
function trimBasicLands(kept: readonly KeptCard[], excess: number): SizeRepair {
  const stacks = kept
    .map(({ card, isBasicLand }, index) => ({ card, isBasicLand, index }))
    .filter(({ isBasicLand }) => isBasicLand)
    .toSorted((left, right) => right.card.quantity - left.card.quantity);

  const trimmedByIndex = new Map<number, number>();
  const corrections: DeckCorrection[] = [];
  let remaining = excess;
  for (const { card, index } of stacks) {
    if (remaining === 0) break;
    const trimmed = Math.min(remaining, card.quantity);
    trimmedByIndex.set(index, trimmed);
    corrections.push({
      action: "removed",
      name: card.name,
      quantity: trimmed,
      reason: "over_size",
    });
    remaining -= trimmed;
  }
  if (remaining > 0) {
    return {
      status: "rejected",
      reasons: [
        `The generated deck has ${excess} ${excess === 1 ? "card" : "cards"} too many and not enough basic lands to trim.`,
      ],
    };
  }

  const cards = kept.flatMap(({ card }, index) => {
    const quantity = card.quantity - (trimmedByIndex.get(index) ?? 0);
    return quantity > 0 ? [{ ...card, quantity }] : [];
  });
  return { status: "fitted", cards, corrections };
}

/**
 * Brings the kept cards to exactly `size` copies with basic lands.
 *
 * @param kept - The legal cards of the model's list, in list order
 * @param size - Copies the list must hold: the deck size minus the command zone
 * @param colors - The command zone's colours in WUBRG order; empty when colourless
 * @returns The fitted list with each basic land added or trimmed, or why it cannot fit
 */
export function fitToDeckSize(
  kept: readonly KeptCard[],
  size: number,
  colors: readonly PipColor[]
): SizeRepair {
  const total = kept.reduce((sum, { card }) => sum + card.quantity, 0);
  if (total > size) return trimBasicLands(kept, total - size);
  const cards = kept.map(({ card }) => card);
  return total < size
    ? addBasicLands(cards, size - total, colors)
    : { status: "fitted", cards, corrections: [] };
}
