/**
 * The one way MagicAIBuilder reads Moxfield's public API.
 *
 * Requests identify the app with its own User-Agent (set by `httpGet`) and ask
 * for JSON. They carry no `Origin` or `Referer`: those headers present a
 * request as coming from moxfield.com itself, and the proposed I-29 source
 * policy (requirement 1.1) forbids headers that impersonate a source.
 *
 * A refusal is surfaced as `MoxfieldRefusedError` so callers can stop and point
 * the player to the paste import instead of retrying.
 */

import { HttpStatusError, httpGet } from "@/lib/http";
import { MoxfieldRefusedError } from "./moxfield-refusal";

/**
 * Statuses by which Moxfield deliberately turns the app away: 403 (Cloudflare
 * block or challenge page) and 429 (rate limited). Neither is retried.
 */
const REFUSAL_STATUSES: ReadonlySet<number> = new Set([403, 429]);

/**
 * Sends one honest request, turning a refusal status into a typed error.
 *
 * @param url - api2.moxfield.com endpoint to read
 * @returns the successful response
 * @throws MoxfieldRefusedError on a refusal status
 */
async function requestMoxfield(url: string): Promise<Response> {
  try {
    return await httpGet(url, { headers: { Accept: "application/json" } });
  } catch (cause) {
    if (cause instanceof HttpStatusError && REFUSAL_STATUSES.has(cause.status)) {
      throw new MoxfieldRefusedError(cause.status);
    }
    throw cause;
  }
}

/**
 * Reads one Moxfield API document.
 *
 * An HTML page where the API's JSON should be is a challenge or block page
 * served with a success status, so it is a refusal too.
 *
 * @param url - api2.moxfield.com endpoint to read
 * @returns the parsed JSON body, unvalidated
 * @throws MoxfieldRefusedError when Moxfield refuses the app
 */
export async function fetchMoxfieldJson(url: string): Promise<unknown> {
  const res = await requestMoxfield(url);
  if (res.headers.get("content-type")?.includes("html")) {
    throw new MoxfieldRefusedError(res.status);
  }
  return res.json();
}
