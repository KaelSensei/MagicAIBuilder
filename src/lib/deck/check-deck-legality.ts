import { fetchCardsByIdInBatches } from "./batch-fetch";
import { isDeckFormat } from "./formats";
import {
  cardsCountedForLegality,
  judgeDeckLegality,
  type DeckLegalityVerdict,
  type LegalityDeckCard,
} from "./legality";

/**
 * Check a stored deck against its format from card data the server fetches from Scryfall.
 *
 * Neither the rows' `isBanned` flag nor the `CardCache` table is read: the
 * browser writes both. A format this build does not support gets an
 * unsupported verdict, with no request to Scryfall and no Commander fallback.
 *
 * @param format - The deck's stored format string
 * @param cards - The deck's stored rows
 * @returns The verdict, dated with the time of the fetch
 * @throws When Scryfall cannot be reached: there is then no verdict to give
 */
export async function checkDeckLegality(
  format: string,
  cards: readonly LegalityDeckCard[]
): Promise<DeckLegalityVerdict> {
  if (!isDeckFormat(format)) return { kind: "unsupported_format", format };

  const counted = cardsCountedForLegality(cards);
  const scryfallCards = await fetchCardsByIdInBatches(
    counted.map((card) => card.scryfallId)
  );
  return judgeDeckLegality({
    format,
    cards: counted,
    scryfallCards,
    fetchedAt: new Date(),
  });
}
