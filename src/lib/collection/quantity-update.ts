import { logger } from "@/lib/logger";
import { parseCollectionCard } from "./parse";
import type { CollectionCard } from "./types";

/** State required by the collection quantity update workflow. */
interface CollectionQuantityState {
  readonly collectionCards: Readonly<Record<string, CollectionCard>>;
  readonly collectionCardsFoil: Readonly<Record<string, CollectionCard>>;
}

type CollectionQuantityPatch = Partial<{
  readonly collectionCards: Record<string, CollectionCard>;
  readonly collectionCardsFoil: Record<string, CollectionCard>;
}>;

/** Dependencies supplied by the collection store. */
interface CollectionQuantityContext {
  readonly getState: () => CollectionQuantityState;
  readonly setState: (
    update: (state: CollectionQuantityState) => CollectionQuantityPatch
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
function findCard(state: CollectionQuantityState, id: string): CollectionCardLocation {
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
  state: CollectionQuantityState,
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
 * Removes a collection row from whichever state map contains it.
 *
 * @param state - Current collection quantity state.
 * @param id - Collection row identifier to remove.
 * @returns A state patch with the row removed.
 */
function removeCardPatch(
  state: CollectionQuantityState,
  id: string
): CollectionQuantityPatch {
  const collectionCards = { ...state.collectionCards };
  const collectionCardsFoil = { ...state.collectionCardsFoil };
  for (const [key, card] of Object.entries(collectionCards)) {
    if (card.id === id) delete collectionCards[key];
  }
  for (const [key, card] of Object.entries(collectionCardsFoil)) {
    if (card.id === id) delete collectionCardsFoil[key];
  }
  return { collectionCards, collectionCardsFoil };
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
      const response = await fetch(`/api/collection/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error("Failed to update quantity");
      const raw: unknown = await response.json();

      if (quantityUpdateQueues.get(id) !== request) return;
      if (
        typeof raw === "object" &&
        raw !== null &&
        "deleted" in raw &&
        raw.deleted === true
      ) {
        context.setState((state) => removeCardPatch(state, id));
        return;
      }

      const updated = parseCollectionCard(raw);
      if (!updated) throw new Error("Invalid quantity update response");
      const updatedLocation = findCard(context.getState(), id);
      if (updatedLocation) {
        context.setState((state) => cardPatch(state, updatedLocation, updated));
      }
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
