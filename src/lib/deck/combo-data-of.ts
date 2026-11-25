/**
 * Reads the state of the deck's combo lookup (`useCombos`) as the combo data
 * a bracket estimate takes (I-77 4.3, issue #1840).
 *
 * Context: deck building. The one mapping the "To reach Bracket N" list and
 * the builder's bracket badge share, so both say the same thing while the
 * lookup is pending and once it fails. Pure: it reads the query's fields
 * only, never the query itself.
 *
 * Not responsible for: a list the lookup never covers (under ten names, the
 * query stays disabled). It reads as no combo found, as before; I-77 slice 2
 * owns its "not checked" state.
 *
 * @module deck/combo-data-of
 */
import type { Combo } from "@/modules/combos";
import type { ComboData } from "./explain-bracket";

/** The fields of the combo lookup's query this mapping reads. */
export interface ComboLookupState {
  /** The combos found, once the lookup answered. */
  readonly data: readonly Combo[] | undefined;
  /** True while the first answer for this deck's names is awaited. */
  readonly isLoading: boolean;
  /** True once the lookup failed. */
  readonly isError: boolean;
}

/**
 * The combo data a lookup state gives: `unavailable` once it failed,
 * `pending` while it has not answered, otherwise the combos it found.
 *
 * @param lookup - the query's `data`, `isLoading` and `isError`
 * @returns the combo data `explainBracket` and the badge read
 */
export function comboDataOf(lookup: ComboLookupState): ComboData {
  if (lookup.isError) return { kind: "unavailable" };
  if (lookup.isLoading) return { kind: "pending" };
  return { kind: "found", combos: lookup.data ?? [], fetchedAt: null };
}
