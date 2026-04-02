// Shared utility for batched Scryfall card fetching
import { getCardCollection } from "@/lib/scryfall/client";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { scryfallCollectionLookupName } from "@/lib/scryfall/name-index";

/** Max cards per Scryfall collection request */
const BATCH_SIZE = 75;

/** Fetch Scryfall cards in batches of 75 to stay within API limits */
export async function fetchInBatches(names: Array<{ name: string }>): Promise<ScryfallCard[]> {
  const found: ScryfallCard[] = [];
  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const slice = names.slice(i, i + BATCH_SIZE);
    const identifiers = slice.map((n) => ({
      name: scryfallCollectionLookupName(n.name),
    }));
    const result = await getCardCollection(identifiers);
    found.push(...result.data);
  }
  return found;
}
