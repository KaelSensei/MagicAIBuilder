/**
 * What `GET /api/meta/:slug?source=` answers, and how the browser reads a
 * failure out of it.
 *
 * Meta-insights context, client side. The route serves one source per call:
 * the EDHREC half (`cards`) or the MTGTop8 half (`decks`), so one response type
 * covers both as partials, plus the cache marker `_meta` and an `error` text.
 * `useMetaAnalysis` runs the request and feeds these rules to the source state
 * machine (`meta-source-state.ts`). No I/O here: pure functions over a parsed
 * body, a status and a rejection.
 *
 * @module meta-insights/client/meta-api-response
 */
import { isNonEmptyString, isRecord } from "@/lib/guards";
import type {
  EdhrecData,
  TournamentData,
} from "@/modules/meta-insights/domain/types";

/**
 * One source's answer from the meta route: the EDHREC cards or the tournament
 * decks, whichever `source` was asked for, never both.
 *
 * `_meta` describes the cache entry that produced the body; `stale` means the
 * live fetch failed and the route fell back to an expired entry, which the
 * panel says. `error` is set when the route has nothing to serve at all.
 */
export interface MetaApiResponse
  extends Partial<EdhrecData>, Partial<TournamentData> {
  readonly _meta?: {
    readonly cached: boolean;
    readonly stale?: boolean;
    /** ISO date-time the cache entry was written. */
    readonly cachedAt?: string;
    /** ISO date-time the provider was last observed, which the freshness line shows. */
    readonly observedAt?: string;
  };
  readonly error?: string;
}

/**
 * Accepts a parsed JSON body as a meta payload.
 *
 * Deliberately shallow: any non-array object passes, an empty one included,
 * because the route's shape is trusted and the panel reads every field
 * optionally. A Zod parse of the stored data is MI-04's job on the server.
 */
export function isMetaApiResponse(value: unknown): value is MetaApiResponse {
  return isRecord(value);
}

/**
 * The failure text of a meta response, or `null` when the body can be shown.
 *
 * The body's `error` wins over the status: the route's failure bodies carry a
 * message more specific than their status ("Invalid commander slug" on 400,
 * "Meta fetch failed" on 502), and a body with `error` is a failure whatever
 * the status says. Without `error`, any status outside 2xx reads `HTTP <status>`.
 */
export function metaErrorMessage(
  payload: MetaApiResponse,
  status: number
): string | null {
  if (isNonEmptyString(payload.error)) return payload.error;
  if (status < 200 || status >= 300) return `HTTP ${status}`;
  return null;
}

/**
 * The text the panel shows for a request that threw: the `Error` message,
 * including a timeout's, or a fixed fallback for a non-`Error` rejection.
 */
export function thrownMetaMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to load meta";
}
