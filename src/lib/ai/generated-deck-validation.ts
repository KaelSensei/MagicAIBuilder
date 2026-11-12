import type { AIDeckResponse } from "@/app/api/ai/build/types";

/**
 * Validate the shape of an AI deck reply before it is checked against card data.
 *
 * Only what needs no card data is checked here: the response shape, a
 * non-empty commander, named cards and positive integer quantities. Copy
 * limits, colour identity, legality and the deck size need card data and are
 * checked, and repaired where possible, by `checkGeneratedDeckLegality`.
 *
 * @param value - Untrusted provider output
 * @returns A list of validation issues, empty when the reply has a usable shape
 */
export function validateGeneratedDeck(value: unknown): readonly string[] {
  if (!isAIDeckResponse(value)) {
    return ["The AI returned an invalid deck structure."];
  }

  const issues: string[] = [];

  if (value.commander.trim().length === 0) {
    issues.push("The generated deck has no commander.");
  }

  for (const card of value.cards) {
    const name = card.name.trim();

    if (name.length === 0) {
      issues.push("The generated deck contains a card without a name.");
    } else if (!Number.isInteger(card.quantity) || card.quantity < 1) {
      issues.push(`${name} has an invalid quantity.`);
    }
  }

  return issues;
}

/**
 * Narrows untrusted provider output to the decklist shape.
 *
 * @param value - parsed provider output
 * @returns true when the value has a commander, a partner field and typed cards
 */
export function isAIDeckResponse(value: unknown): value is AIDeckResponse {
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
