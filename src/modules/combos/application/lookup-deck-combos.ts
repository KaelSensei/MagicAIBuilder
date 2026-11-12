/**
 * The combo lookup: which combos one deck holds, answered from the cache when
 * possible, otherwise from the combo source within this server's budget.
 *
 * The one use case of the combos context. `POST /api/combos` calls it through
 * `server.ts` after validating the body, and maps the result to a response;
 * the HTTP concerns (the per-client rate limit, body size, status codes, logs)
 * stay in the route. The use case depends on the ports in `ports.ts` only, so
 * it runs in Vitest with in-memory fakes and no network (ADR 0005).
 *
 * @module combos/application/lookup-deck-combos
 */
import type { Combo } from "@/modules/combos/domain/combo";
import {
  normalizeDeckComboQuery,
  type DeckComboQuery,
} from "@/modules/combos/domain/deck-query";
import type {
  ComboCache,
  ComboSource,
  ComboSourceBudget,
  DeckCombosFailure,
} from "@/modules/combos/application/ports";

/** The adapters a lookup runs on; `server.ts` passes the real ones. */
export interface LookupDeckCombosPorts {
  readonly cache: ComboCache;
  readonly budget: ComboSourceBudget;
  readonly source: ComboSource;
}

/**
 * How a lookup ended. `ok` carries the combos, possibly none. The two other
 * outcomes carry what the caller needs to answer: how long to wait when the
 * budget is spent, and which way the source failed.
 */
export type LookupDeckCombosResult =
  | { readonly status: "ok"; readonly combos: readonly Combo[] }
  | { readonly status: "budget-exhausted"; readonly retryAfterMs: number }
  | { readonly status: "upstream-failed"; readonly failure: DeckCombosFailure };

/** A wired lookup: a validated card list in, a `LookupDeckCombosResult` out. */
export type LookupDeckCombos = (
  query: DeckComboQuery
) => Promise<LookupDeckCombosResult>;

/** No cards means no combos: nothing to cache, no budget to spend, nothing to ask. */
function isEmpty(query: DeckComboQuery): boolean {
  return query.commanders.length + query.main.length === 0;
}

/**
 * Builds the lookup over the given ports.
 *
 * The returned function takes a validated list in any spelling, puts it in
 * canonical form once and then runs: an empty list answers no combos; a cached
 * list answers the cache; otherwise one unit of budget is taken and, if
 * granted, the source is asked and a successful answer is stored. Failures are
 * never stored. The function never throws for a source failure: that comes
 * back as `upstream-failed`.
 *
 * @param ports - the cache, the budget and the source to run on
 * @returns the lookup, ready to be called once per request
 */
export function makeLookupDeckCombos(
  ports: LookupDeckCombosPorts
): LookupDeckCombos {
  return async (rawQuery) => {
    const query = normalizeDeckComboQuery(rawQuery);
    if (isEmpty(query)) return { status: "ok", combos: [] };

    const cached = ports.cache.read(query);
    if (cached) return { status: "ok", combos: cached };

    const budget = ports.budget.take();
    if (!budget.allowed) {
      return { status: "budget-exhausted", retryAfterMs: budget.retryAfterMs };
    }

    const result = await ports.source.findCombos(query);
    if (result.kind !== "found") {
      return { status: "upstream-failed", failure: result };
    }
    ports.cache.store(query, result.combos);
    return { status: "ok", combos: result.combos };
  };
}
