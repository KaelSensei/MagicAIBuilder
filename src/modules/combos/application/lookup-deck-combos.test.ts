import { describe, expect, it } from "vitest";
import type { Combo } from "@/modules/combos/domain/combo";
import {
  deckComboQueryKey,
  normalizeDeckComboQuery,
  type DeckComboQuery,
} from "@/modules/combos/domain/deck-query";
import { makeLookupDeckCombos } from "@/modules/combos/application/lookup-deck-combos";
import type {
  BudgetDecision,
  ComboCache,
  ComboSource,
  ComboSourceBudget,
  DeckCombosResult,
} from "@/modules/combos/application/ports";

const COMBO: Combo = {
  id: "742-1295",
  cards: ["Demonic Consultation", "Thassa's Oracle"],
  effects: ["Win the game"],
  description: "",
  isInfinite: true,
  prerequisites: { otherPieces: [], conditions: [], manaNeeded: "{U}{U}{B}" },
};

const DECK: DeckComboQuery = {
  commanders: ["Kenrith, the Returned King"],
  main: ["Thassa's Oracle", "Demonic Consultation"],
};

/** The same deck as a client might also send it: other order, case and spacing. */
const DECK_RESPELLED: DeckComboQuery = {
  commanders: ["  KENRITH, THE RETURNED KING "],
  main: ["demonic   consultation", "THASSA'S ORACLE"],
};

interface FakeCache extends ComboCache {
  readonly entries: Map<string, readonly Combo[]>;
}

/** A cache that never expires; entries are keyed like the real one, by canonical list. */
function fakeCache(): FakeCache {
  const entries = new Map<string, readonly Combo[]>();
  return {
    entries,
    read: (query) => entries.get(deckComboQueryKey(query)) ?? null,
    store: (query, combos) => {
      entries.set(deckComboQueryKey(query), combos);
    },
  };
}

interface FakeBudget extends ComboSourceBudget {
  readonly taken: () => number;
}

/** A budget with `calls` left; once spent, every take is refused for 30 s. */
function fakeBudget(calls: number): FakeBudget {
  let taken = 0;
  return {
    taken: () => taken,
    take: (): BudgetDecision => {
      taken += 1;
      return taken <= calls
        ? { allowed: true }
        : { allowed: false, retryAfterMs: 30_000 };
    },
  };
}

interface FakeSource extends ComboSource {
  readonly queries: DeckComboQuery[];
}

/** A source that answers every query with `result` and records what it was asked. */
function fakeSource(result: DeckCombosResult): FakeSource {
  const queries: DeckComboQuery[] = [];
  return {
    queries,
    findCombos: async (query) => {
      queries.push(query);
      return result;
    },
  };
}

interface Fakes {
  readonly cache: FakeCache;
  readonly budget: FakeBudget;
  readonly source: FakeSource;
}

/** The lookup over fakes: a warm source, one call of budget, an empty cache unless overridden. */
function ports(overrides: Partial<Fakes> = {}) {
  const all: Fakes = {
    cache: fakeCache(),
    budget: fakeBudget(1),
    source: fakeSource({ kind: "found", combos: [COMBO] }),
    ...overrides,
  };
  return { ...all, lookup: makeLookupDeckCombos(all) };
}

describe("lookupDeckCombos", () => {
  it("answers a cached list without spending budget or asking the source", async () => {
    const cache = fakeCache();
    cache.store(normalizeDeckComboQuery(DECK), [COMBO]);
    const { lookup, budget, source } = ports({ cache });

    const result = await lookup(DECK);

    expect(result).toEqual({ status: "ok", combos: [COMBO] });
    expect(budget.taken()).toBe(0);
    expect(source.queries).toEqual([]);
  });

  it("finds the same cache entry whatever the order, case or spacing of the list", async () => {
    const cache = fakeCache();
    cache.store(normalizeDeckComboQuery(DECK), [COMBO]);
    const { lookup, source } = ports({ cache });

    const result = await lookup(DECK_RESPELLED);

    expect(result).toEqual({ status: "ok", combos: [COMBO] });
    expect(source.queries).toEqual([]);
  });

  it("on a miss, spends one call, asks the source for the canonical list and stores its answer", async () => {
    const { lookup, cache, budget, source } = ports();

    const result = await lookup(DECK);

    expect(result).toEqual({ status: "ok", combos: [COMBO] });
    expect(budget.taken()).toBe(1);
    expect(source.queries).toEqual([
      {
        commanders: ["kenrith, the returned king"],
        main: ["demonic consultation", "thassa's oracle"],
      },
    ]);
    expect(cache.read(normalizeDeckComboQuery(DECK))).toEqual([COMBO]);
  });

  it("answers an empty list with no combos, without the cache, the budget or the source", async () => {
    const { lookup, cache, budget, source } = ports();

    const result = await lookup({ commanders: [], main: ["   "] });

    expect(result).toEqual({ status: "ok", combos: [] });
    expect(cache.entries.size).toBe(0);
    expect(budget.taken()).toBe(0);
    expect(source.queries).toEqual([]);
  });

  it("reports the spent budget with its retry delay and leaves the source alone", async () => {
    const { lookup, source } = ports({ budget: fakeBudget(0) });

    const result = await lookup(DECK);

    expect(result).toEqual({
      status: "budget-exhausted",
      retryAfterMs: 30_000,
    });
    expect(source.queries).toEqual([]);
  });

  it("passes a source failure on as it is and does not cache it", async () => {
    const failure = { kind: "failed", status: 500 } as const;
    const { lookup, cache } = ports({ source: fakeSource(failure) });

    const result = await lookup(DECK);

    expect(result).toEqual({ status: "upstream-failed", failure });
    expect(cache.entries.size).toBe(0);
  });

  it("asks the source again after a timeout, since nothing was cached", async () => {
    const { lookup, source } = ports({
      budget: fakeBudget(2),
      source: fakeSource({ kind: "timeout" }),
    });

    await lookup(DECK);
    const retried = await lookup(DECK);

    expect(retried).toEqual({
      status: "upstream-failed",
      failure: { kind: "timeout" },
    });
    expect(source.queries).toHaveLength(2);
  });
});
