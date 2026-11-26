/**
 * The error the browser's Scryfall client throws when api.scryfall.com answers
 * with a failure status. Its subclass `ScryfallBlockedError`
 * (`request-queue.ts`) is thrown by the runtime's Scryfall queue, in the
 * browser and on the server, when nothing was sent: a 429 block was running.
 *
 * Card catalog context. It carries the HTTP status so a caller can tell a
 * query Scryfall rejected from an outage without reading the message, as
 * `DeckApiError` does for the deck API. Not responsible for: the words a
 * player reads (`components/search/search-failure.ts`).
 *
 * @module scryfall/api-error
 */

/**
 * api.scryfall.com answered with a non-2xx status.
 *
 * The message stays `Scryfall API error <status>: <detail>`: the logs read it,
 * and the client, search-scan, batch-fetch and legality route tests pin it.
 * `detail` is Scryfall's own English `details` text, a third party's, so it
 * belongs in logs, never in the interface.
 */
export class ScryfallApiError extends Error {
  /**
   * @param status - the HTTP status Scryfall answered
   * @param detail - Scryfall's `details` text, or the status text when the
   *   body had none
   */
  constructor(
    readonly status: number,
    detail: string
  ) {
    super(`Scryfall API error ${status}: ${detail}`);
    this.name = "ScryfallApiError";
  }
}
