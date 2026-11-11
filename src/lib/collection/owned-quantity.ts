/**
 * Fine-grained reads of the collection store for components that show one
 * card's ownership.
 *
 * Collection context, browser side. Each hook selects a number or a boolean,
 * so a component re-renders exactly when that value changes. Selecting the
 * store's `getTotalOwned` helper instead hands back the same function on every
 * update, and the component keeps the count it read on its first render.
 *
 * @module collection/owned-quantity
 */
import { useCollectionStore } from "./store";

/**
 * Live count of one printing in the player's collection, foil and non-foil
 * copies together. 0 for a guest and until the collection has loaded.
 */
export function useOwnedQuantity(scryfallId: string): number {
  return useCollectionStore(
    (state) =>
      (state.collectionCards[scryfallId]?.quantity ?? 0) +
      (state.collectionCardsFoil[scryfallId]?.quantity ?? 0)
  );
}

/**
 * Whether the player's collection holds any card. False for a guest, for a
 * player who has recorded nothing, and until the collection has loaded.
 */
export function useHasCollectionCards(): boolean {
  return useCollectionStore(
    (state) =>
      Object.keys(state.collectionCards).length > 0 ||
      Object.keys(state.collectionCardsFoil).length > 0
  );
}
