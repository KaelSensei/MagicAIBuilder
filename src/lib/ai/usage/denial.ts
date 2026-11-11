import { z } from "zod";
import { AI_ROUTES, type AiRoute } from "./policy";

/**
 * Why an AI call was refused before it reached a model, shared by the routes
 * that send it and the hooks that read it.
 *
 * - `allowance_exhausted`: this user has made every call this route allows
 *   this month (HTTP 429).
 * - `ai_spend_ceiling_reached`: the month's spend across all users reached the
 *   global ceiling, so AI is off for everyone until the reset (HTTP 503).
 */
export type AiCallDenial =
  | {
      readonly code: "allowance_exhausted";
      readonly route: AiRoute;
      readonly limit: number;
      readonly resetsAt: Date;
    }
  | { readonly code: "ai_spend_ceiling_reached"; readonly resetsAt: Date };

/**
 * The HTTP status a denial is sent with.
 *
 * @param denial - why the call was refused
 * @returns 429 for the user's own allowance, 503 for the global ceiling
 */
export function aiCallDenialStatus(denial: AiCallDenial): 429 | 503 {
  switch (denial.code) {
    case "allowance_exhausted":
      return 429;
    case "ai_spend_ceiling_reached":
      return 503;
    default: {
      const unreachable: never = denial;
      return unreachable;
    }
  }
}

/**
 * The JSON body a denial is sent as. `error` is a fixed English line for API
 * callers; the app shows its own localized text from `code`.
 *
 * @param denial - why the call was refused
 * @returns the response body, with `resetsAt` as an ISO-8601 instant
 */
export function aiCallDenialBody(
  denial: AiCallDenial
): Record<string, unknown> {
  switch (denial.code) {
    case "allowance_exhausted":
      return {
        error: "Monthly AI allowance used up",
        code: denial.code,
        route: denial.route,
        limit: denial.limit,
        resetsAt: denial.resetsAt.toISOString(),
      };
    case "ai_spend_ceiling_reached":
      return {
        error: "AI is paused until the monthly budget resets",
        code: denial.code,
        resetsAt: denial.resetsAt.toISOString(),
      };
    default: {
      const unreachable: never = denial;
      return unreachable;
    }
  }
}

const RESETS_AT = z.iso.datetime().transform((value) => new Date(value));

const DENIAL_BODY = z.discriminatedUnion("code", [
  z.object({
    code: z.literal("allowance_exhausted"),
    route: z.enum(AI_ROUTES),
    limit: z.number().int().nonnegative(),
    resetsAt: RESETS_AT,
  }),
  z.object({
    code: z.literal("ai_spend_ceiling_reached"),
    resetsAt: RESETS_AT,
  }),
]);

/**
 * Reads a denial from a response body.
 *
 * @param body - the parsed JSON of a non-OK AI response
 * @returns the denial, or `undefined` when the body is any other error
 */
export function readAiCallDenial(body: unknown): AiCallDenial | undefined {
  return DENIAL_BODY.safeParse(body).data;
}

/**
 * Reads a denial from a non-OK AI response, for the client hooks.
 *
 * @param response - the response to `/api/ai/build` or `/api/ai/suggest`
 * @returns the denial, or `undefined` when the body is not one (or not JSON)
 */
export async function readAiCallDenialResponse(
  response: Response
): Promise<AiCallDenial | undefined> {
  try {
    return readAiCallDenial(await response.json());
  } catch {
    return undefined;
  }
}
