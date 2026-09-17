interface CollectionQuantity {
  readonly id: string;
  readonly quantity: number;
}

export interface CollectionRemoval {
  readonly id: string;
  readonly nextQuantity: number;
}

/**
 * Plan quantity updates that remove one deck's requirements from a collection.
 *
 * @param requiredQuantities Quantities used by the deck, keyed by Scryfall id.
 * @param normalCards Owned non-foil entries, keyed by Scryfall id.
 * @param foilCards Owned foil entries, keyed by Scryfall id.
 * @returns Quantity updates, consuming non-foil copies before foil copies.
 */
export function planCollectionRemoval(
  requiredQuantities: Readonly<Record<string, number>>,
  normalCards: Readonly<Record<string, CollectionQuantity>>,
  foilCards: Readonly<Record<string, CollectionQuantity>>
): readonly CollectionRemoval[] {
  const updates: CollectionRemoval[] = [];
  for (const [scryfallId, requiredQuantity] of Object.entries(requiredQuantities)) {
    let remaining = Math.max(0, requiredQuantity);
    for (const entry of [normalCards[scryfallId], foilCards[scryfallId]]) {
      if (!entry || remaining === 0) continue;
      const removed = Math.min(entry.quantity, remaining);
      updates.push({ id: entry.id, nextQuantity: entry.quantity - removed });
      remaining -= removed;
    }
  }
  return updates;
}
