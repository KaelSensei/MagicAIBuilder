/**
 * What a combo lookup needs from the outside: the cache in front of the combo
 * source, the budget of calls this server may spend on that source, and the
 * source itself.
 *
 * The ports of the combos context's `application/` layer. `infrastructure/`
 * implements them (`combo-cache.ts`, `spellbook-budget.ts`,
 * `find-my-combos.ts`) and `server.ts` wires the implementations into
 * `lookupDeckCombos`. Tests hand the use case in-memory fakes instead
 * (ADR 0005). Every method takes a card list already in canonical form, as
 * `normalizeDeckComboQuery` produces it; the use case normalises once, so an
 * adapter never sees two spellings of one deck.
 *
 * @module combos/application/ports
 */
import type { Combo } from "@/modules/combos/domain/combo";
import type { DeckComboQuery } from "@/modules/combos/domain/deck-query";

/**
 * Lookups kept so that every viewer of one card list shares one source call.
 *
 * An implementation guarantees:
 * - `read` answers null for a list it has never seen or whose entry has
 *   expired; the adapter decides the time to live (6 hours in
 *   `infrastructure/combo-cache.ts`);
 * - a list is found again whatever its spelling, because callers pass the
 *   canonical form, and commanders are kept apart from main-deck cards in the
 *   key: the same names in other roles are another list;
 * - the use case stores successful lookups only, so a failure is never served
 *   from the cache and the source is asked again as soon as it recovers.
 *
 * Pinned by `infrastructure/combo-cache.test.ts` for the adapter and by
 * `application/lookup-deck-combos.test.ts` for the use case's use of it.
 */
export interface ComboCache {
  read(query: DeckComboQuery): readonly Combo[] | null;
  store(query: DeckComboQuery, combos: readonly Combo[]): void;
}

/** Whether one more source call may be made now, and if not, how long to wait. */
export type BudgetDecision =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      /** Milliseconds until the window reopens; positive. */
      readonly retryAfterMs: number;
    };

/**
 * The calls this server may make to the combo source per window
 * (`SPELLBOOK_CALLS_PER_WINDOW` in `domain/lookup-policy.ts`).
 *
 * `take` counts one call and says whether it is within budget. An
 * implementation guarantees that a refused take spends nothing and reports a
 * positive `retryAfterMs`, which the route sends as `Retry-After`. The use
 * case calls it only after a cache miss and before the source, so cache hits
 * never spend budget and a refused take never reaches the source
 * (`application/lookup-deck-combos.test.ts`).
 */
export interface ComboSourceBudget {
  take(): BudgetDecision;
}

/** What one call to the combo source came to. Never an exception: a failure is a value. */
export type DeckCombosResult =
  | { readonly kind: "found"; readonly combos: readonly Combo[] }
  | { readonly kind: "timeout" }
  | { readonly kind: "unexpected-body" }
  | { readonly kind: "failed"; readonly status: number | null };

/** The ways a source call fails; the route maps each to its own status and log line. */
export type DeckCombosFailure = Exclude<DeckCombosResult, { kind: "found" }>;

/**
 * Where the combos a deck holds come from: Commander Spellbook in production
 * (`infrastructure/find-my-combos.ts`), a fake in tests.
 *
 * `findCombos` makes one call for the whole list. Every implementation passes
 * the contract suite in `testing/combo-source-contract.ts`, which pins:
 * - a list the upstream knows combos for comes back `found` with those combos
 *   as `Combo` values: id, cards, effects, infinity and prerequisites;
 * - only combos the deck fully contains are returned; a list without one comes
 *   back `found` with none, which is a finding, not a failure;
 * - each way the upstream can fail comes back as the matching
 *   `DeckCombosFailure`, never as a thrown error;
 * - a failure is not remembered: the next call asks the upstream again.
 *
 * The suite leaves open what the fake and the adapter differ on: a combo's
 * `description` and the order of the combos (the adapter puts infinite ones
 * first, then fewer cards). Neither puts the list in canonical form; it is
 * sent as given, so callers pass the normalised list. The fake is
 * `testing/in-memory-combo-source.ts`.
 */
export interface ComboSource {
  findCombos(query: DeckComboQuery): Promise<DeckCombosResult>;
}
