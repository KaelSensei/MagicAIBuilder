/**
 * The browser client of `POST /api/combos`: one lookup of the whole deck.
 *
 * Zod parses the route's answer here, at the boundary (ADR 0003), into the
 * context's `Combo`; `useCombos` calls it and the panel and bracket scoring
 * read the result. The route sends combos field for field as `Combo`, so the
 * schema below is that type's runtime twin.
 *
 * @module combos/client/api
 */
import { z } from "zod";
import type { Combo, ComboPrerequisites } from "@/modules/combos/domain/combo";
import type { DeckComboQuery } from "@/modules/combos/domain/deck-query";

const comboPrerequisitesSchema = z.object({
  otherPieces: z.array(z.string()),
  conditions: z.array(z.string()),
  manaNeeded: z.string(),
}) satisfies z.ZodType<ComboPrerequisites>;

/** A combo as `POST /api/combos` sends it. */
const comboSchema = z.object({
  id: z.string(),
  cards: z.array(z.string()),
  effects: z.array(z.string()),
  description: z.string(),
  isInfinite: z.boolean(),
  prerequisites: comboPrerequisitesSchema,
}) satisfies z.ZodType<Combo>;

const comboLookupResponseSchema = z.object({
  combos: z.array(comboSchema),
});

/** Longest wait for the deck's combo lookup; the route itself gives up on Spellbook sooner. */
export const COMBO_FETCH_TIMEOUT_MS = 15_000;

/**
 * Looks the whole deck up in one request to `POST /api/combos`.
 *
 * A failed lookup rejects instead of resolving to an empty list: "no known
 * combos" is a finding, and a check that never ran must not be shown as one.
 *
 * @param query - the commanders and main-deck card names to check
 * @returns the combos the deck can assemble, infinite ones first
 * @throws when the route answers with an error, times out, or sends an unexpected shape
 */
export async function fetchCombosForDeck(
  query: DeckComboQuery
): Promise<Combo[]> {
  const response = await fetch("/api/combos", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(query),
    signal: AbortSignal.timeout(COMBO_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Combo lookup failed with HTTP ${response.status}`);
  }

  const parsed = comboLookupResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Combo lookup sent an unexpected response");
  }
  return parsed.data.combos;
}
