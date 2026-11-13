/**
 * How the community client sends one request and reads its answer: the JSON
 * request shape the routes expect, the contract check on a 2xx body, and the
 * refusal built from a non-2xx answer.
 *
 * Community context (client side). `community-client.ts` maps each route to
 * one of these calls; nothing else imports this module. Not responsible for:
 * the routes' URLs and contracts, which the client and
 * `community-contracts.ts` own.
 *
 * @module community/community-request
 */
import {
  CommunityApiError,
  MalformedCommunityAnswerError,
} from "@/lib/community/community-client-errors";
import type { AnswerGuard } from "@/lib/community/community-contracts";
import { isRecord } from "@/lib/guards";

/** Longest server-supplied message forwarded in a {@link CommunityApiError}. */
const MAX_REFUSAL_DETAIL_LENGTH = 200;

/** One request to send and the contract its answer must meet. */
export interface CommunityCall<T> {
  /** The client function's name, for the error message and the log. */
  readonly operation: string;
  readonly url: string;
  readonly init?: RequestInit;
  readonly guard: AnswerGuard<T>;
}

/**
 * The `error` field of a refusal as one line. The routes answer a string, a
 * list of rule violations (`validateReview`, `validateCommentBody`) or Zod's
 * field errors, a record of lists; only string leaves are kept, so nothing
 * unexpected in a body reaches a log or a screen.
 */
function readRefusalDetail(body: unknown): string {
  if (!isRecord(body) || !("error" in body)) return "";
  return collectStrings(body.error)
    .join("; ")
    .slice(0, MAX_REFUSAL_DETAIL_LENGTH);
}

function collectStrings(value: unknown): readonly string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (isRecord(value)) return Object.values(value).flatMap(collectStrings);
  return [];
}

/**
 * Throws the refusal a non-2xx answer carries.
 *
 * @throws CommunityApiError always, with the route's `error` text when the
 *   body is JSON and carries one; a non-JSON body (a proxy's error page)
 *   leaves the status alone
 */
async function throwRefusal(
  operation: string,
  response: Response
): Promise<never> {
  let detail = "";
  try {
    detail = readRefusalDetail(await response.json());
  } catch {
    // Not JSON: the status is all the route told us.
  }
  throw new CommunityApiError(operation, response.status, detail);
}

/**
 * Sends one request and reads its answer against the contract.
 *
 * @returns the body, once the guard accepted it
 * @throws CommunityApiError when the route answered outside 2xx
 * @throws MalformedCommunityAnswerError when a 2xx body is not JSON or the guard refuses it
 */
export async function send<T>({
  operation,
  url,
  init,
  guard,
}: CommunityCall<T>): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) await throwRefusal(operation, response);
  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new MalformedCommunityAnswerError(operation, response.status, cause);
  }
  if (!guard(body))
    throw new MalformedCommunityAnswerError(operation, response.status);
  return body;
}

/**
 * Sends one request whose answer carries nothing a page needs (the delete
 * routes answer `{ deleted }`), so only the status is read: the row is gone
 * whatever the body says, and an odd body must not make a done write look
 * failed.
 *
 * @throws CommunityApiError when the route answered outside 2xx
 */
export async function sendForStatus(
  operation: string,
  url: string,
  init: RequestInit
): Promise<void> {
  const response = await fetch(url, init);
  if (!response.ok) await throwRefusal(operation, response);
}

/** A JSON request: the method, the `Content-Type` the routes' body reader expects, and the body. */
export function jsonInit(method: "POST" | "PATCH", body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
