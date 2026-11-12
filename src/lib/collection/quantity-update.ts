/**
 * Optimistic quantity edits for collection rows.
 *
 * The new quantity shows at once; the PATCH requests for one row run one at a
 * time, in the order the user made them. Only the newest request's answer is
 * applied, and only a failed newest request rolls the row back.
 *
 * @module collection/quantity-update
 */

import { logger } from "@/lib/logger";
import {
  applyCollectionPatchResult,
  patchCollectionCard,
  type CollectionMaps,
} from "./card-patch";
import type { CollectionCard } from "./types";

type CollectionQuantityPatch = Partial<{
  readonly collectionCards: Record<string, CollectionCard>;
  readonly collectionCardsFoil: Record<string, CollectionCard>;
}>;

/** Dependencies supplied by the collection store. */
interface CollectionQuantityContext {
  readonly getState: () => CollectionMaps;
  readonly setState: (
    update: (state: CollectionMaps) => CollectionQuantityPatch
  ) => void;
  readonly setSyncing: (isSyncing: boolean) => void;
}

type CollectionCardLocation =
  | { readonly kind: "normal"; readonly scryfallId: string; readonly card: CollectionCard }
  | { readonly kind: "foil"; readonly scryfallId: string; readonly card: CollectionCard }
  | null;

const quantityUpdateQueues = new Map<string, Promise<void>>();

/**
 * Finds a collection card and the map that owns it.
 *
 * @param state - Current collection quantity state.
 * @param id - Collection row identifier.
 * @returns The card location, or null when absent.
 */
function findCard(state: CollectionMaps, id: string): CollectionCardLocation {
  for (const [scryfallId, card] of Object.entries(state.collectionCards)) {
    if (card.id === id) return { kind: "normal", scryfallId, card };
  }
  for (const [scryfallId, card] of Object.entries(state.collectionCardsFoil)) {
    if (card.id === id) return { kind: "foil", scryfallId, card };
  }
  return null;
}

/**
 * Applies a card value to its normal or foil state map.
 *
 * @param state - Current collection quantity state.
 * @param location - Map and Scryfall key that own the card.
 * @param card - Replacement card value.
 * @returns A minimal state patch for the owning map.
 */
function cardPatch(
  state: CollectionMaps,
  location: Exclude<CollectionCardLocation, null>,
  card: CollectionCard
): CollectionQuantityPatch {
  if (location.kind === "foil") {
    return {
      collectionCardsFoil: {
        ...state.collectionCardsFoil,
        [location.scryfallId]: card,
      },
    };
  }
  return {
    collectionCards: {
      ...state.collectionCards,
      [location.scryfallId]: card,
    },
  };
}

/**
 * Optimistically updates a quantity and serializes persistence for that card.
 *
 * @param id - Collection row identifier.
 * @param quantity - Desired absolute quantity.
 * @param context - Store accessors used to read and update collection state.
 * @returns A promise that settles after this quantity has persisted or rolled back.
 */
export async function updateCollectionQuantity(
  id: string,
  quantity: number,
  context: CollectionQuantityContext
): Promise<void> {
  const previousLocation = findCard(context.getState(), id);
  context.setSyncing(true);
  if (previousLocation) {
    context.setState((state) =>
      cardPatch(state, previousLocation, { ...previousLocation.card, quantity })
    );
  }

  const previousUpdate = quantityUpdateQueues.get(id) ?? Promise.resolve();
  const request = previousUpdate.then(async () => {
    try {
      const result = await patchCollectionCard(id, { quantity });
      if (quantityUpdateQueues.get(id) !== request) return;
      context.setState((state) =>
        applyCollectionPatchResult(state, id, result)
      );
    } catch (error) {
      if (previousLocation && quantityUpdateQueues.get(id) === request) {
        context.setState((state) => cardPatch(state, previousLocation, previousLocation.card));
      }
      logger.error("Unexpected error", "updateQuantity", error);
    }
  });

  quantityUpdateQueues.set(id, request);
  await request;
  if (quantityUpdateQueues.get(id) === request) {
    quantityUpdateQueues.delete(id);
    context.setSyncing(false);
  }
}
