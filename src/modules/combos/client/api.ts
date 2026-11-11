// Commander Spellbook combo detection: the combo shape and the browser-side lookup.
import { z } from "zod";
import type { DeckComboQuery } from "@/modules/combos/domain/deck-query";

/** What a combo needs beyond its named cards, as Commander Spellbook lists it. */
export interface ComboPrerequisites {
  /** Generic extra pieces any matching card fills, e.g. "Permanent Castable for {C}". */
  readonly otherPieces: readonly string[];
  /** Game states to reach first; Spellbook's notable ones come before its easy ones. */
  readonly conditions: readonly string[];
  /** Mana spent while the combo runs, in `{X}` notation, or "" when Spellbook lists none. */
  readonly manaNeeded: string;
}

/** One Commander Spellbook combo variant that the deck can assemble. */
export interface SpellbookVariant {
  /** Spellbook's variant id, which also names its page on commanderspellbook.com. */
  readonly id: string;
  /** Names of the cards the combo uses. */
  readonly cards: readonly string[];
  /** Names of the effects the combo produces. */
  readonly effects: readonly string[];
  /** Spellbook's step-by-step description, or the effects joined when it has none. */
  readonly description: string;
  /** Whether an effect reads as infinite or game-winning (used by bracket scoring). */
  readonly isInfinite: boolean;
  /** What else the combo needs before it works. */
  readonly prerequisites: ComboPrerequisites;
}

const comboPrerequisitesSchema = z.object({
  otherPieces: z.array(z.string()),
  conditions: z.array(z.string()),
  manaNeeded: z.string(),
});

/** Validates a combo as `POST /api/combos` sends it. */
export const spellbookVariantSchema = z.object({
  id: z.string(),
  cards: z.array(z.string()),
  effects: z.array(z.string()),
  description: z.string(),
  isInfinite: z.boolean(),
  prerequisites: comboPrerequisitesSchema,
}) satisfies z.ZodType<SpellbookVariant>;

const comboLookupResponseSchema = z.object({
  combos: z.array(spellbookVariantSchema),
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
): Promise<SpellbookVariant[]> {
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
