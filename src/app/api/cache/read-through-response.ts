import { NextResponse } from "next/server";
import type { ReadThroughOutcome } from "@/lib/scryfall/shared-cache";

/**
 * Turns a shared cache read into the response both cache routes send.
 *
 * `hit` says whether the entry came from the cache or was just fetched by the
 * server; `data` is the Scryfall body either way. Any other status tells the
 * browser to ask Scryfall itself, without storing the answer.
 *
 * @param outcome - how the read ended
 * @returns the JSON response
 */
export function readThroughResponse<T>(
  outcome: ReadThroughOutcome<T>
): NextResponse {
  switch (outcome.kind) {
    case "hit":
      return NextResponse.json({ hit: true, data: outcome.data });
    case "filled":
      return NextResponse.json({ hit: false, data: outcome.data });
    case "throttled":
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(outcome.retryAfterMs / 1000)),
          },
        }
      );
    case "not_found":
      return NextResponse.json(
        { error: "Not found on Scryfall" },
        { status: 404 }
      );
    case "upstream_failed":
      return NextResponse.json(
        { error: "Scryfall did not answer" },
        { status: 502 }
      );
    default: {
      const unreachable: never = outcome;
      return unreachable;
    }
  }
}
