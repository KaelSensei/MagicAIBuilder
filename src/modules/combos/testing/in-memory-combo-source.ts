/**
 * An in-memory `ComboSource` for tests (ADR 0005: owned ports get a
 * hand-written fake that passes the port's contract suite).
 *
 * A test tells it which combos a card list holds, or how the next calls fail,
 * and reads back the lists it was asked for. Like Commander Spellbook, it
 * knows no combo for a list nobody told it about, and it never throws: a
 * failure is a `DeckCombosResult`. It does not put lists in canonical form:
 * the use case does that before it calls the port (`application/ports.ts`), so
 * seed it with the list as `normalizeDeckComboQuery` produces it. Contract:
 * `combo-source-contract.ts`.
 *
 * @module combos/testing/in-memory-combo-source
 */
import type {
  ComboSource,
  DeckCombosFailure,
} from "@/modules/combos/application/ports";
import type { Combo } from "@/modules/combos/domain/combo";
import {
  deckComboQueryKey,
  type DeckComboQuery,
} from "@/modules/combos/domain/deck-query";

/** The fake, plus the seeding and the record its tests read. */
export interface InMemoryComboSource extends ComboSource {
  /** Every list `findCombos` was asked for, in call order, as it was given. */
  readonly queries: readonly DeckComboQuery[];
  /**
   * From now on, `query` holds `combos`, answered in this order. Lists are
   * compared by `deckComboQueryKey`, so spelling matters. Also clears a
   * failure set with `fails`: the upstream has recovered.
   */
  knows(query: DeckComboQuery, combos: readonly Combo[]): void;
  /** From now on, every call fails this way, until `knows` is called. */
  fails(failure: DeckCombosFailure): void;
}

/** @returns a new fake that knows no combo and never fails, independent of every other */
export function inMemoryComboSource(): InMemoryComboSource {
  const known = new Map<string, readonly Combo[]>();
  const queries: DeckComboQuery[] = [];
  let failure: DeckCombosFailure | null = null;

  return {
    queries,
    knows(query, combos) {
      known.set(deckComboQueryKey(query), combos);
      failure = null;
    },
    fails(next) {
      failure = next;
    },
    async findCombos(query) {
      queries.push(query);
      if (failure) return failure;
      return {
        kind: "found",
        combos: known.get(deckComboQueryKey(query)) ?? [],
      };
    },
  };
}
