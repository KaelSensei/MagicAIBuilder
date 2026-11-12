/**
 * Batched Scryfall card lookups: names or printing ids, 75 per collection request, one request
 * after another through the client's queue.
 *
 * The one place the deck dialogs ask Scryfall for a list of cards. A request that breaks (timeout,
 * network, error status) surfaces as a `CardLookupError`, so a dialog can tell the player the
 * lookup did not answer without reading the exception's own words.
 *
 * @module deck/batch-fetch
 */
import { getCardCollection } from "@/lib/scryfall/client";
import type {
  ScryfallCard,
  ScryfallCollectionIdentifier,
  ScryfallCollectionResponse,
} from "@/lib/scryfall/types";
import { CardLookupError } from "./card-lookup-error";
import { scryfallCollectionLookupName } from "@/lib/scryfall/name-index";
import { forEachSequential } from "@/lib/async/sequential";

/** Max cards per Scryfall collection request */
const BATCH_SIZE = 75;

/**
 * One collection request to Scryfall.
 *
 * @throws {CardLookupError} when the request did not answer, with what broke it as `cause`
 */
async function lookUpCollection(
  identifiers: ScryfallCollectionIdentifier[]
): Promise<ScryfallCollectionResponse> {
  try {
    return await getCardCollection(identifiers);
  } catch (error) {
    throw new CardLookupError(error);
  }
}

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
    const result = await lookUpCollection(identifiers.slice(i, i + BATCH_SIZE));
    found.push(...result.data);
  });
  return found;
}

/**
 * Fetch Scryfall cards by name in batches of 75 to stay within API limits.
 *
 * @param names - card names as the player wrote them; double-faced names are sent by their front face
 * @returns the cards Scryfall found; names it did not know are absent
 * @throws {CardLookupError} when a request did not answer
 */
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
 * @throws {CardLookupError} when a request did not answer
 */
export async function fetchCardsByIdInBatches(
  ids: readonly string[]
): Promise<ScryfallCard[]> {
  return collectInBatches([...new Set(ids)].map((id) => ({ id })));
}
