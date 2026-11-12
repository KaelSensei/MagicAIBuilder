/**
 * What a deck API answer tells the browser besides its value: the failure it
 * reports, and the deck version a row write carries (#1400).
 *
 * This lives apart from `deck-api.ts` so that the deck store can read an
 * answer's failure and version while a test replaces the deck client wholesale
 * (`vi.mock("@/lib/db/deck-api")`), as several legacy store tests still do.
 *
 * @module db/deck-api-answer
 */

/**
 * A deck API request the server refused or failed: the status it answered,
 * and the route's own `error` text when it sent one. The message is
 * `[operation] HTTP <status>: <detail>`, as the store's tests have pinned it.
 */
export class DeckApiError extends Error {
  /**
   * @param operation - the deck client function that sent the request
   * @param status - the HTTP status answered
   * @param detail - the route's `error` text; empty when there was none
   */
  constructor(
    readonly operation: string,
    readonly status: number,
    detail = ""
  ) {
    super(`[${operation}] HTTP ${status}${detail ? `: ${detail}` : ""}`);
    this.name = "DeckApiError";
  }
}

/**
 * Whether a write failed because the deck changed since this tab read it: the
 * routes' 409 for a stale `expectedVersion` (`staleDeckResponse`).
 *
 * @param error - what the deck client threw
 */
export function isStaleDeckRefusal(error: unknown): boolean {
  return error instanceof DeckApiError && error.status === 409;
}

/** The deck's new version beside a write's answer; absent for a guest deck, which keeps none. */
export interface VersionedAnswer {
  readonly version?: number;
}

/**
 * The version a 2xx answer carries, read without failing the write: the row
 * is saved whatever the body looks like, so a body that cannot be read only
 * means the browser does not know the new version and must not vouch for one.
 *
 * @param response - a successful answer of a row write
 * @returns `{ version }` when the body carries one, `{}` otherwise
 */
export async function readAnsweredVersion(
  response: Response
): Promise<VersionedAnswer> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "version" in body &&
      typeof body.version === "number"
    ) {
      return { version: body.version };
    }
  } catch {
    // Not JSON, or no body: the write is saved, its version unknown.
  }
  return {};
}
