// Shared utility for batched Scryfall card fetching
import { getCardCollection } from "@/lib/scryfall/client";
import type {
  ScryfallCard,
  ScryfallCollectionIdentifier,
} from "@/lib/scryfall/types";
import { scryfallCollectionLookupName } from "@/lib/scryfall/name-index";
import { forEachSequential } from "@/lib/async/sequential";

/** Max cards per Scryfall collection request */
const BATCH_SIZE = 75;

/** Send identifiers to Scryfall's collection endpoint, 75 per request, one request after another. */
async function collectInBatches(
  identifiers: readonly ScryfallCollectionIdentifier[]
): Promise<ScryfallCard[]> {
  const found: ScryfallCard[] = [];
  const offsets = Array.from(
    { length: Math.ceil(identifiers.length / BATCH_SIZE) },
    (_, index) => index * BATCH_SIZE
  );
  await forEachSequential(offsets, async (i) => {
    const result = await getCardCollection(
      identifiers.slice(i, i + BATCH_SIZE)
    );
    found.push(...result.data);
  });
  return found;
}

/** Fetch Scryfall cards in batches of 75 to stay within API limits */
export async function fetchInBatches(
  names: Array<{ name: string }>
): Promise<ScryfallCard[]> {
  return collectInBatches(
    names.map((n) => ({ name: scryfallCollectionLookupName(n.name) }))
  );
}

/**
 * Fetch Scryfall cards by printing id, 75 per request; a repeated id is asked for once.
 * @param ids - Scryfall printing ids, duplicates allowed
 * @returns The cards Scryfall found; ids it did not find are absent
 */
export async function fetchCardsByIdInBatches(
  ids: readonly string[]
): Promise<ScryfallCard[]> {
  return collectInBatches([...new Set(ids)].map((id) => ({ id })));
}
