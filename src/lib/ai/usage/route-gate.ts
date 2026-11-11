import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  aiCallDenialBody,
  aiCallDenialStatus,
  type AiCallDenial,
} from "./denial";
import { reserveAiCall, type AiCallTicket } from "./meter";
import type { AiRoute } from "./policy";

/** A reserved call, or the response to send instead of calling the model. */
export type AiRouteGate =
  | { readonly ok: true; readonly ticket: AiCallTicket }
  | { readonly ok: false; readonly response: NextResponse };

/**
 * The response for a refused call, with `Retry-After` set to the reset.
 *
 * @param denial - why the call was refused
 * @param now - the current instant
 * @returns a 429 or 503 JSON response carrying a machine-readable `code`
 */
export function aiCallDeniedResponse(
  denial: AiCallDenial,
  now: Date = new Date()
): NextResponse {
  const retryAfterSeconds = Math.max(
    0,
    Math.ceil((denial.resetsAt.getTime() - now.getTime()) / 1000)
  );
  return NextResponse.json(aiCallDenialBody(denial), {
    status: aiCallDenialStatus(denial),
    headers: { "Retry-After": String(retryAfterSeconds) },
  });
}

/**
 * Reserves one call for a route handler before it starts its stream.
 *
 * Fails closed: when the allowance cannot be read, no model is called, so a
 * database outage cannot turn into unmetered spend.
 *
 * @param userId - the caller
 * @param route - the metered route
 * @param logContext - the route, for the log line
 * @returns the ticket, or the response to return as is
 */
export async function reserveAiCallForRoute(
  userId: string,
  route: AiRoute,
  logContext: string
): Promise<AiRouteGate> {
  try {
    const gate = await reserveAiCall(userId, route);
    return gate.ok
      ? gate
      : { ok: false, response: aiCallDeniedResponse(gate.denial) };
  } catch (error) {
    logger.error("AI allowance could not be checked", logContext, error);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "AI is unavailable right now" },
        { status: 503 }
      ),
    };
  }
}
