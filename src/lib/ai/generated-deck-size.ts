/**
 * Size repair of an AI-generated Commander list, after its illegal cards are gone.
 *
 * A short list is filled with basic lands of the command zone's colours
 * (Wastes when colourless), split by Karsten's source targets: each basic goes
 * to the colour whose sources fall furthest below its target, so the surplus
 * over the targets ends as even as possible (I-58 requirements 9.1 and 5.2).
 * A long list loses basic lands, largest stack first; it is rejected when its
 * basic lands cannot absorb the excess, because cutting a chosen spell is a
 * deckbuilding decision, not a repair.
 *
 * @module ai/generated-deck-size
 */
import type { AICard, DeckCorrection } from "@/app/api/ai/build/types";
import type { PipColor } from "@/lib/deck/mana-alignment";

/** A card kept from the model's list, with what the size step needs to know. */
export interface KeptCard {
  readonly card: AICard;
  readonly isBasicLand: boolean;
  /** Colours the card taps for when it is a land; empty for any other card */
  readonly producedColours: readonly PipColor[];
}

/** One colour of the command zone and the sources it needs. */
export interface SourceNeed {
  readonly colour: PipColor;
  /** Karsten's source target for the colour, 0 when no spell sets one */
  readonly target: number;
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

/** The basic lands of one name to add. */
interface BasicLandsToAdd {
  readonly name: string;
  readonly quantity: number;
}

/** Copies in `kept` of lands that tap for `colour`. */
function sourcesOf(kept: readonly KeptCard[], colour: PipColor): number {
  return kept
    .filter(({ producedColours }) => producedColours.includes(colour))
    .reduce((sum, { card }) => sum + card.quantity, 0);
}

/**
 * Splits `missing` basics over the colours: one at a time, to the colour with
 * the smallest surplus of sources over its target, the first in `needs` on a
 * tie. With no target anywhere, this evens the colours' sources.
 */
function splitByTargets(
  kept: readonly KeptCard[],
  missing: number,
  needs: readonly SourceNeed[]
): readonly BasicLandsToAdd[] {
  const tally = needs.map(({ colour, target }) => ({
    name: BASIC_LAND_FOR[colour],
    surplus: sourcesOf(kept, colour) - target,
    quantity: 0,
  }));
  const [first, ...others] = tally;
  if (!first) return [];
  for (let basic = 0; basic < missing; basic += 1) {
    const neediest = others.reduce(
      (lowest, entry) => (entry.surplus < lowest.surplus ? entry : lowest),
      first
    );
    neediest.surplus += 1;
    neediest.quantity += 1;
  }
  return tally;
}

/** Adds `missing` basic lands split by the colours' source targets, onto existing stacks first. */
function addBasicLands(
  kept: readonly KeptCard[],
  missing: number,
  needs: readonly SourceNeed[]
): SizeRepair {
  const toAddByName =
    needs.length > 0
      ? splitByTargets(kept, missing, needs)
      : [{ name: COLORLESS_BASIC_LAND, quantity: missing }];
  const corrections = toAddByName
    .filter(({ quantity }) => quantity > 0)
    .map(({ name, quantity }): DeckCorrection => ({
      action: "added",
      name,
      quantity,
      reason: "fill_to_size",
    }));

  const toAdd = new Map(
    corrections.map(({ name, quantity }) => [name, quantity])
  );
  const merged = kept.map(({ card }) => {
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
 * @param needs - The command zone's colours in WUBRG order with their source targets; empty when colourless
 * @returns The fitted list with each basic land added or trimmed, or why it cannot fit
 */
export function fitToDeckSize(
  kept: readonly KeptCard[],
  size: number,
  needs: readonly SourceNeed[]
): SizeRepair {
  const total = kept.reduce((sum, { card }) => sum + card.quantity, 0);
  if (total > size) return trimBasicLands(kept, total - size);
  return total < size
    ? addBasicLands(kept, size - total, needs)
    : {
        status: "fitted",
        cards: kept.map(({ card }) => card),
        corrections: [],
      };
}
