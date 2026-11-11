/**
 * The HTTP answer of the two shared Scryfall cache routes, `GET /api/cache/search`
 * and `GET /api/cache/cards`.
 *
 * Turns a read-through outcome (`src/lib/scryfall/shared-cache.ts`) into JSON, a
 * status code and caching headers. Only a 200 answer may be kept by Vercel's CDN.
 * Sharing it is safe because neither route reads a session: the same URL gets the
 * same Scryfall body, whoever asks.
 *
 * @module api/cache/read-through-response
 */
import { NextResponse } from "next/server";
import type { ReadThroughOutcome } from "@/lib/scryfall/shared-cache";

/**
 * Seconds past its lifetime that the CDN may still serve an answer while one
 * request refreshes it in the background. Short on purpose: a popular page never
 * waits on Scryfall, and no answer outlives its lifetime by more than a minute.
 * Through `Cache-Control`, Vercel caches a function response only when it
 * carries `s-maxage`, and serves `stale-while-revalidate` this way
 * (https://vercel.com/docs/caching/cdn-cache and
 * https://vercel.com/docs/caching/cache-control-headers, read 2026-11-11).
 */
const STALE_WHILE_REVALIDATE_SECONDS = 60;

/**
 * Turns a shared cache read into the response both cache routes send.
 *
 * `hit` says whether the entry came from the cache or was just fetched by the
 * server; `data` is the Scryfall body either way. Both let the CDN keep the
 * answer for `lifetimeMs`, so a repeat lookup costs no function call. Any other
 * status carries no caching header and tells the browser to ask Scryfall itself,
 * without storing the answer.
 *
 * @param outcome - how the read ended
 * @param lifetimeMs - how long the CDN may keep a 200 answer: the cache's TTL,
 *   so a stored row and its CDN copy age by the same rule. Rounded down to
 *   whole seconds.
 * @returns the JSON response
 */
export function readThroughResponse<T>(
  outcome: ReadThroughOutcome<T>,
  lifetimeMs: number
): NextResponse {
  switch (outcome.kind) {
    case "hit":
      return NextResponse.json(
        { hit: true, data: outcome.data },
        { headers: cdnCaching(lifetimeMs) }
      );
    case "filled":
      return NextResponse.json(
        { hit: false, data: outcome.data },
        { headers: cdnCaching(lifetimeMs) }
      );
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

/** The header that lets Vercel's CDN serve a 200 answer for `lifetimeMs`. */
function cdnCaching(lifetimeMs: number): HeadersInit {
  const maxAgeSeconds = Math.floor(lifetimeMs / 1000);
  return {
    "Cache-Control": `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
  };
}
