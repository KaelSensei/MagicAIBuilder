import type { CardCategory, DeckCard } from "./types";

export type CardRoleExplanation =
  | { readonly kind: "commander" }
  | { readonly kind: "companion" }
  | { readonly kind: "category"; readonly category: CardCategory };

/**
 * Explains the saved role of a card without reinterpreting mutable Oracle text.
 */
export function getCardRoleExplanation(card: DeckCard): CardRoleExplanation {
  if (card.category === "commander") return { kind: "commander" };
  if (card.category === "companion") return { kind: "companion" };
  return { kind: "category", category: card.category };
}
