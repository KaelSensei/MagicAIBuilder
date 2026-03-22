// Shared utility for batched Scryfall card fetching
import { getCardCollection } from "@/lib/scryfall/client";
import type { ScryfallCard } from "@/lib/scryfall/types";

/** Max cards per Scryfall collection request */
const BATCH_SIZE = 75;

/** Fetch Scryfall cards in batches of 75 to stay within API limits */
export async function fetchInBatches(names: Array<{ name: string }>): Promise<ScryfallCard[]> {
  const found: ScryfallCard[] = [];
  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const result = await getCardCollection(names.slice(i, i + BATCH_SIZE));
    found.push(...result.data);
  }
  return found;
}
