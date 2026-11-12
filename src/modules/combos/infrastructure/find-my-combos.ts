/**
 * The server side of combo detection: one Commander Spellbook `find-my-combos`
 * call per deck, answered as the combos the deck holds.
 *
 * The `ComboSource` adapter of the combos context (ADR 0004). It sends the
 * canonical card list, validates the answer against `spellbookVariantSchema`
 * and maps each included variant to a `Combo` with `toCombo`; failures come
 * back as a `DeckCombosResult`, never as exceptions. `lookupDeckCombos` calls
 * it, behind the cache and the budget, as `server.ts` wires them.
 *
 * @module combos/infrastructure/find-my-combos
 */
import "server-only";
import { z } from "zod";
import { USER_AGENT } from "@/lib/http";
import type {
  ComboSource,
  DeckCombosResult,
} from "@/modules/combos/application/ports";
import type { Combo } from "@/modules/combos/domain/combo";
import type { DeckComboQuery } from "@/modules/combos/domain/deck-query";
import {
  spellbookVariantSchema,
  toCombo,
} from "@/modules/combos/infrastructure/spellbook-variant";

/**
 * Spellbook's deck-level endpoint. It takes the whole list and sorts the combos
 * it knows into those the deck holds (`included`) and those it nearly holds.
 * Schema: https://backend.commanderspellbook.com/schema/ (`find_my_combos_create`).
 */
export const SPELLBOOK_FIND_MY_COMBOS_URL =
  "https://backend.commanderspellbook.com/find-my-combos";

/** Longest wait for Spellbook; below the browser's own 15 s so the route answers first. */
export const SPELLBOOK_TIMEOUT_MS = 10_000;

const findMyCombosResponseSchema = z.object({
  results: z.object({ included: z.array(spellbookVariantSchema) }),
});

/** Infinite combos first, then the ones that need fewer cards. */
function byInfiniteThenSize(a: Combo, b: Combo): number {
  if (a.isInfinite !== b.isInfinite) return a.isInfinite ? -1 : 1;
  return a.cards.length - b.cards.length;
}

/**
 * Maps a `find-my-combos` response to the combos the deck holds.
 *
 * Only `included` is read: the "almost included" buckets are combos the deck
 * lacks a card for, and showing them as found would be wrong.
 *
 * @param payload - the parsed JSON body Spellbook answered with
 * @returns the deck's combos, infinite ones first, or null when the body has another shape
 */
export function parseFindMyCombos(payload: unknown): Combo[] | null {
  const parsed = findMyCombosResponseSchema.safeParse(payload);
  if (!parsed.success) return null;
  return parsed.data.results.included.map(toCombo).toSorted(byInfiniteThenSize);
}

function toDeckRequest(query: DeckComboQuery) {
  return {
    commanders: query.commanders.map((card) => ({ card })),
    main: query.main.map((card) => ({ card })),
  };
}

function isTimeout(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError";
}

/**
 * Asks Commander Spellbook which combos one deck holds, in a single call.
 * Never throws: a timeout, an error status or an unexpected body is a result.
 *
 * @param query - the deck's card list, already in canonical form
 * @returns the combos found, or why there are none to show
 */
export async function requestDeckCombos(
  query: DeckComboQuery
): Promise<DeckCombosResult> {
  try {
    const response = await fetch(SPELLBOOK_FIND_MY_COMBOS_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify(toDeckRequest(query)),
      signal: AbortSignal.timeout(SPELLBOOK_TIMEOUT_MS),
    });
    if (!response.ok) return { kind: "failed", status: response.status };

    const combos = parseFindMyCombos(await response.json());
    return combos ? { kind: "found", combos } : { kind: "unexpected-body" };
  } catch (error) {
    return isTimeout(error)
      ? { kind: "timeout" }
      : { kind: "failed", status: null };
  }
}

/** Commander Spellbook as the lookup's `ComboSource`, as `server.ts` wires it. */
export const spellbookComboSource: ComboSource = {
  findCombos: requestDeckCombos,
};
