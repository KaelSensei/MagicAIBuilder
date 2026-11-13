/**
 * What a community API answer tells the browser when it is not the data asked
 * for: the refusal a route answered, or an answer whose body is not the shape
 * the route promises.
 *
 * Community context (client side). `community-client.ts` throws these; a
 * component tells them apart with `instanceof`, reads `status` to choose its
 * message and never shows `message` itself, which is a fixed English line for
 * logs. They live apart from the client, as `deck-api-answer.ts` does for the
 * deck client, so a test that replaces the client module keeps the real
 * classes.
 *
 * @module community/community-client-errors
 */

/**
 * A request a community route refused or failed: the status it answered and
 * the route's own `error` text when it sent one. The message reads
 * `[operation] HTTP <status>: <detail>`, the form the deck client's errors
 * take (`DeckApiError`), so one log line reads the same for both clients.
 */
export class CommunityApiError extends Error {
  override readonly name = "CommunityApiError";

  /**
   * @param operation - the client function that sent the request
   * @param status - the HTTP status answered
   * @param detail - the route's `error` text; empty when there was none
   */
  constructor(
    readonly operation: string,
    readonly status: number,
    readonly detail = ""
  ) {
    super(`[${operation}] HTTP ${status}${detail ? `: ${detail}` : ""}`);
  }
}

/**
 * A 2xx answer whose body is not what the route's contract promises: not
 * JSON, or JSON the contract's guard refused. The route and the client have
 * drifted, or something between them rewrote the body; either way the data
 * must not reach a component as if it were sound.
 */
export class MalformedCommunityAnswerError extends Error {
  override readonly name = "MalformedCommunityAnswerError";

  /**
   * @param operation - the client function that sent the request
   * @param status - the HTTP status answered, a 2xx
   * @param cause - the parse error when the body was not JSON
   */
  constructor(
    readonly operation: string,
    readonly status: number,
    cause?: unknown
  ) {
    super(
      `[${operation}] HTTP ${status}: the answer is not the expected shape`,
      {
        cause,
      }
    );
  }
}
