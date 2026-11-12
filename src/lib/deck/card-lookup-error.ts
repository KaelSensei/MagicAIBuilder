/**
 * The failure a card lookup reports when the card catalog could not answer at all.
 *
 * Deck-building context. `fetchInBatches` and `fetchCardsByIdInBatches` (`batch-fetch.ts`) raise
 * it in place of whatever broke the request to Scryfall: a timeout, a network failure or an error
 * status. A dialog recognises it with `instanceof` and tells the player, in their language, that
 * the lookup did not answer, so no browser or Scryfall exception text reaches the screen. Names
 * Scryfall does not know are not a failure: they come back in the answer, and the caller decides.
 *
 * It lives apart from `batch-fetch.ts` so a test that replaces that module keeps the real class.
 *
 * @module deck/card-lookup-error
 */

/**
 * Raised when a Scryfall card lookup did not answer: a timeout, a network failure or an error
 * status. The error that broke the request is kept in `cause` for logs; the message is a fixed
 * English line for logs too, never for the screen.
 */
export class CardLookupError extends Error {
  override readonly name = "CardLookupError";

  constructor(cause: unknown) {
    super("The card lookup did not answer.", { cause });
  }
}
