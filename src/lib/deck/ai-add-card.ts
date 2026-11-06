import type { DeckZone } from "./types";

interface AddNamedCardActions<TCard> {
  readonly lookup: (name: string) => Promise<TCard>;
  readonly addCard: (
    card: TCard,
    quantity: undefined,
    zone: DeckZone
  ) => Promise<void>;
  readonly onLookupError: (cardName: string) => void;
}

/**
 * Looks up a card by name and adds it to the zone the editor is showing.
 *
 * Suggestions used to call `addCard` with no zone, so they always landed in
 * the main deck even when the sideboard or maybeboard was active.
 *
 * @param cardName - exact card name to resolve
 * @param zone - zone currently open in the editor
 * @param actions - lookup, add, and the failure report
 * @returns a promise that settles after the add or the failure report
 */
export async function addNamedCardToZone<TCard>(
  cardName: string,
  zone: DeckZone,
  actions: AddNamedCardActions<TCard>
): Promise<void> {
  try {
    const card = await actions.lookup(cardName);
    await actions.addCard(card, undefined, zone);
  } catch {
    actions.onLookupError(cardName);
  }
}
