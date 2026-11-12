/**
 * What a Moxfield refusal looks like on both sides of the import routes.
 *
 * Kept free of any fetch code so the client components that read a route's
 * answer can import it without pulling in the server's HTTP helpers.
 */

/** Value of the API's `code` field when Moxfield refused the app. */
export const MOXFIELD_REFUSED_CODE = "moxfield_refused";

/**
 * Player-facing explanation of a refusal, also the API's `error` text.
 * The import dialog shows the translated `deck.import.moxfieldRefused` instead.
 */
export const MOXFIELD_REFUSED_MESSAGE =
  "Moxfield refused MagicAIBuilder's request, so this deck can't be fetched from here. To import it anyway, open the deck on moxfield.com, use Export to copy the list as text, then paste it in the Plain Text tab.";

/** Moxfield declined to serve the app; asking again will not change the answer. */
export class MoxfieldRefusedError extends Error {
  override readonly name = "MoxfieldRefusedError";
  /** HTTP status of the refusal. */
  readonly status: number;

  /** @param status - HTTP status Moxfield answered with */
  constructor(status: number) {
    super(MOXFIELD_REFUSED_MESSAGE);
    this.status = status;
  }
}

/**
 * Recognises an import route's answer to a Moxfield refusal.
 *
 * @param body - parsed JSON body of a failed import request
 * @returns true when the route reported that Moxfield refused the app
 */
export function isMoxfieldRefusal(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    body.code === MOXFIELD_REFUSED_CODE
  );
}
