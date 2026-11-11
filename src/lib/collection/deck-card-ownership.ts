/**
 * Whether the player's collection holds the copies a deck card row needs: the
 * Owned / Buy badge on each row of the deck editor's list view.
 *
 * Collection context. `DeckCardOwnershipBadge` asks it for one row; the deck's
 * collection panel answers the same question for the whole deck with
 * `getDeckCardStatuses` (`shopping-list.ts`), and neither asks the player to
 * buy a basic land.
 * Copies are counted per printing (Scryfall id), as the collection records
 * them: another printing of the same card does not count. Each row is compared
 * on its own, so copies used by the player's other decks still count here; the
 * acquisition plan (`acquisition-plan.ts`) is the place that shares them out.
 *
 * @module collection/deck-card-ownership
 */
import type { DeckCard } from "@/lib/deck/types";
import { isBasicLand } from "@/lib/scryfall/type-line";

/**
 * What a deck card row tells the player about their collection.
 *
 * - `basicLand`: nothing to report; the player is never asked to buy one.
 * - `owned`: the collection holds at least the copies the row needs.
 * - `buy`: it holds fewer; `missingQuantity` is at least 1.
 */
export type DeckCardOwnership =
  | { readonly kind: "basicLand" }
  | { readonly kind: "owned"; readonly ownedQuantity: number }
  | {
      readonly kind: "buy";
      readonly ownedQuantity: number;
      readonly missingQuantity: number;
    };

/**
 * Compares the copies a deck row needs (`quantity`) with the copies of its
 * printing in the collection.
 *
 * @param ownedQuantity - copies of the row's printing in the collection, foil
 *   and non-foil together
 */
export function deckCardOwnership(
  card: Pick<DeckCard, "typeLine" | "quantity">,
  ownedQuantity: number
): DeckCardOwnership {
  // CR 205.4c: a land with the basic supertype is basic, Snow-Covered basics
  // included. The shopping list leaves them out too (`buildShoppingList`).
  if (isBasicLand(card.typeLine)) return { kind: "basicLand" };

  const missingQuantity = card.quantity - ownedQuantity;
  return missingQuantity > 0
    ? { kind: "buy", ownedQuantity, missingQuantity }
    : { kind: "owned", ownedQuantity };
}
