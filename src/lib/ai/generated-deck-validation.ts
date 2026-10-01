import type { AIDeckResponse } from "@/app/api/ai/build/types";
import { CAPPED_MULTIPLES } from "@/lib/deck/multiples";

const COMMANDER_DECK_CARD_COUNT = 99;
const BASIC_LANDS = new Set([
  "plains",
  "island",
  "swamp",
  "mountain",
  "forest",
  "wastes",
]);
const CAPPED_MULTIPLES_BY_NAME = new Map(
  Object.entries(CAPPED_MULTIPLES).map(([name, limit]) => [name.toLocaleLowerCase(), limit])
);

/**
 * Validate the structural invariants required before an AI deck reaches the client.
 *
 * @param value - Untrusted provider output
 * @returns A list of actionable validation issues, empty when the deck is structurally valid
 */
export function validateGeneratedDeck(value: unknown): readonly string[] {
  if (!isAIDeckResponse(value)) {
    return ["The AI returned an invalid deck structure."];
  }

  const issues: string[] = [];
  const expectedCardCount = COMMANDER_DECK_CARD_COUNT - (value.partner ? 1 : 0);
  const quantitiesByName = new Map<string, number>();
  let totalCards = 0;

  if (value.commander.trim().length === 0) {
    issues.push("The generated deck has no commander.");
  }

  for (const card of value.cards) {
    const name = card.name.trim();
    const normalizedName = name.toLocaleLowerCase();

    if (name.length === 0) {
      issues.push("The generated deck contains a card without a name.");
      continue;
    }

    if (!Number.isInteger(card.quantity) || card.quantity < 1) {
      issues.push(`${name} has an invalid quantity.`);
      continue;
    }

    totalCards += card.quantity;

    if (normalizedName === value.commander.trim().toLocaleLowerCase()) {
      issues.push(`The commander ${name} is duplicated in the card list.`);
    }

    const previousQuantity = quantitiesByName.get(normalizedName) ?? 0;
    const cappedLimit = CAPPED_MULTIPLES_BY_NAME.get(normalizedName);
    if (previousQuantity > 0 && !BASIC_LANDS.has(normalizedName) && cappedLimit === undefined) {
      issues.push(`${name} is duplicated in the generated deck.`);
    }
    const combinedQuantity = previousQuantity + card.quantity;
    quantitiesByName.set(normalizedName, combinedQuantity);

    if (cappedLimit !== undefined && combinedQuantity > cappedLimit && previousQuantity <= cappedLimit) {
      issues.push(`${name} exceeds the ${cappedLimit}-copy limit.`);
    } else if (card.quantity > 1 && !BASIC_LANDS.has(normalizedName) && cappedLimit === undefined) {
      issues.push(`${name} has more than one copy but is not a basic land.`);
    }
  }

  if (totalCards !== expectedCardCount) {
    issues.push(
      `The generated deck contains ${totalCards} cards; expected ${expectedCardCount}.`
    );
  }

  return issues;
}

function isAIDeckResponse(value: unknown): value is AIDeckResponse {
  if (typeof value !== "object" || value === null) return false;
  if (!("commander" in value) || typeof value.commander !== "string") return false;
  if (!("partner" in value) || (value.partner !== null && typeof value.partner !== "string")) {
    return false;
  }
  if (!("cards" in value) || !Array.isArray(value.cards)) return false;

  return value.cards.every(
    (card) =>
      typeof card === "object" &&
      card !== null &&
      "name" in card &&
      typeof card.name === "string" &&
      "quantity" in card &&
      typeof card.quantity === "number" &&
      "category" in card &&
      typeof card.category === "string"
  );
}
