/**
 * Why the app's AI suggestions were refused before a model ran, as the
 * browser reads it.
 *
 * AI usage, client side. The server's own refusals (`AiCallDenial`) carry a
 * code in the body. A request without a session gets the generic 401 that
 * `requireAuth` sends for every route, with no code, so it is read from the
 * status here. I-39 6.5 (docs/product/specs/
 * i39-first-run-activation-and-measurement.md): a guest is told that
 * suggestions need an account, never shown a raw status code.
 * Not responsible for: the wording (`AiRefusalNotice`), or sending a denial
 * (`denial.ts`).
 *
 * @module ai/usage/refusal
 */
import { readAiCallDenialResponse, type AiCallDenial } from "./denial";

/** No session: the player must sign in, or create an account, first. */
export interface SignInRequired {
  readonly code: "sign_in_required";
}

/** A server denial, or the absence of a session. */
export type AiCallRefusal = AiCallDenial | SignInRequired;

/** The one refusal value the status alone decides. */
const SIGN_IN_REQUIRED: SignInRequired = { code: "sign_in_required" };

/** What `requireAuth` (`lib/auth/helpers.ts`) answers a request without a session with. */
const HTTP_UNAUTHORIZED = 401;

/**
 * Reads why a non-OK AI response refused the call.
 *
 * @param response - a non-OK response from an AI route
 * @returns `sign_in_required` for a 401, the server's denial when the body
 *   holds one, or `undefined` for any other failure
 */
export async function readAiCallRefusalResponse(
  response: Response
): Promise<AiCallRefusal | undefined> {
  if (response.status === HTTP_UNAUTHORIZED) return SIGN_IN_REQUIRED;
  return readAiCallDenialResponse(response);
}
