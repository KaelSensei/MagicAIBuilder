/**
 * The shared contract suite of the `ComboSource` port (ADR 0005: one suite
 * per owned port, run against the in-memory fake and the real adapter). It is
 * a table of named cases, {@link COMBO_SOURCE_CONTRACT_CASES}; each caller
 * registers one `it` per case.
 *
 * It pins what every `ComboSource` must do for the use case that calls it: a
 * list the upstream knows combos for comes back `found` with those combos
 * mapped to `Combo` values (id, cards, effects, infinity, prerequisites); a
 * list it knows no combo for comes back `found` with none; each way the
 * upstream can fail comes back as the matching `DeckCombosFailure`, never as
 * a thrown error; and a failure is not remembered once the upstream recovers.
 * Callers: `in-memory-combo-source.test.ts` and
 * `infrastructure/find-my-combos.contract.test.ts`.
 *
 * What it does not pin, because the fake and the adapter honestly differ:
 * - the `description` of a combo, which is the adapter's wording rule
 *   (`infrastructure/spellbook-variant.ts`, pinned in `find-my-combos.test.ts`);
 *   the fake answers whatever it was seeded with;
 * - the order of the combos: the adapter sorts infinite ones first, then fewer
 *   cards (`find-my-combos.test.ts`); the fake keeps the seeded order. The
 *   recorded deck's three combos are all infinite two-card lines, so both
 *   orders agree on it;
 * - canonical form: neither implementation alters the list it is given. The
 *   use case normalises before the call (`application/ports.ts`), and the
 *   adapter's replay test pins that it sends names as given.
 *
 * @module combos/testing/combo-source-contract
 */
import { expect } from "vitest";

import type {
  ComboSource,
  DeckCombosFailure,
} from "@/modules/combos/application/ports";
import type { Combo } from "@/modules/combos/domain/combo";
import type { DeckComboQuery } from "@/modules/combos/domain/deck-query";
import { FIND_MY_COMBOS_RECORDED_REQUEST } from "@/modules/combos/infrastructure/fixtures/find-my-combos-v1";

/**
 * One source under test, with the ways its upstream is told what to answer.
 * The fake is seeded directly; the adapter's upstream is an MSW handler.
 */
export interface ComboSourceHarness {
  readonly source: ComboSource;
  /** From now on the upstream knows {@link RECORDED_DECK} and lists {@link RECORDED_DECK_COMBOS} for it. */
  readonly upstreamListsTheRecordedCombos: () => void;
  /** From now on the upstream knows no combo for {@link COMBOLESS_DECK}. */
  readonly upstreamListsNoCombo: () => void;
  /** From now on the upstream fails in the way the port must report as `failure`. */
  readonly upstreamFails: (failure: DeckCombosFailure) => void;
}

/** The deck of the recorded Spellbook exchange, as the adapter takes it: plain card names. */
export const RECORDED_DECK: DeckComboQuery = {
  commanders: FIND_MY_COMBOS_RECORDED_REQUEST.commanders.map(
    (entry) => entry.card
  ),
  main: FIND_MY_COMBOS_RECORDED_REQUEST.main.map((entry) => entry.card),
};

/** The fields of a `Combo` the port contract pins; the description is the adapter's wording. */
export type ComboFacts = Omit<Combo, "description">;

/**
 * What the recording's three `included` variants map to, in Spellbook's order.
 * Written by hand from `fixtures/find-my-combos-v1.ts`, not computed from it,
 * so the suite checks the mapping rather than restating it. Together they
 * cover a generic extra piece, a notable prerequisite and the mana a combo
 * needs.
 */
export const RECORDED_DECK_COMBOS: readonly ComboFacts[] = [
  {
    id: "513-5034--46",
    cards: ["Hullbreaker Horror", "Sol Ring"],
    effects: ["Infinite colorless mana", "Infinite storm count"],
    isInfinite: true,
    prerequisites: {
      otherPieces: ["Permanent Castable for {C}"],
      conditions: [],
      manaNeeded: "",
    },
    startZones: {
      "Hullbreaker Horror": ["battlefield"],
      "Sol Ring": ["battlefield"],
    },
    standaloneResults: ["Infinite colorless mana"],
    manaValueNeeded: 0,
    bracketTag: "exhibition",
  },
  {
    id: "742-1295",
    cards: ["Demonic Consultation", "Thassa's Oracle"],
    effects: ["Exile your library", "Win the game"],
    isInfinite: true,
    prerequisites: { otherPieces: [], conditions: [], manaNeeded: "{U}{U}{B}" },
    startZones: {
      "Demonic Consultation": ["hand"],
      "Thassa's Oracle": ["hand"],
    },
    standaloneResults: ["Win the game"],
    manaValueNeeded: 3,
    bracketTag: "ruthless",
  },
  {
    id: "4821-5261",
    cards: ["Dramatic Reversal", "Isochron Scepter"],
    effects: [
      "Infinite magecraft triggers",
      "Infinite mana nonland permanents you control can produce",
      "Infinite storm count",
      "Infinite untap of nonland permanents you control",
    ],
    isInfinite: true,
    prerequisites: {
      otherPieces: [],
      conditions: [
        "Nonland permanents you control can tap to produce at least {3}.",
      ],
      manaNeeded: "",
    },
    startZones: {
      "Dramatic Reversal": ["exile"],
      "Isochron Scepter": ["battlefield"],
    },
    standaloneResults: [
      "Infinite mana nonland permanents you control can produce",
    ],
    manaValueNeeded: 0,
    bracketTag: "spicy",
  },
];

/** A list Spellbook knows no combo for: a commander, lands and one rock. */
export const COMBOLESS_DECK: DeckComboQuery = {
  commanders: ["kenrith, the returned king"],
  main: ["island", "sol ring", "swamp"],
};

/** Every failure kind `ports.ts` defines, each with one upstream cause the harness reproduces. */
export const UPSTREAM_FAILURES: readonly DeckCombosFailure[] = [
  { kind: "failed", status: 500 },
  { kind: "failed", status: 503 },
  { kind: "failed", status: 429 },
  { kind: "failed", status: null },
  { kind: "unexpected-body" },
  { kind: "timeout" },
];

/**
 * One expectation of the contract: a behaviour sentence, and the check that
 * proves it against a fresh harness.
 */
export interface ComboSourceContractCase {
  /** The test name each contract test file registers the case under. */
  readonly name: string;
  /** Arranges the harness's upstream, calls the source and asserts; rejects on a broken contract. */
  readonly run: (harness: ComboSourceHarness) => Promise<void>;
}

/**
 * A failure written the way Vitest's `%o` printed it when the failure cases
 * were an `it.each` table, e.g. `{ kind: 'failed', status: 500 }`, so the
 * test names stay the same across the move to a case table.
 */
function describeFailure(failure: DeckCombosFailure): string {
  const fields = Object.entries(failure).map(([key, value]) => {
    // `%o` quotes strings with single quotes and prints numbers and null bare.
    const printed = typeof value === "string" ? `'${value}'` : String(value);
    return `${key}: ${printed}`;
  });
  return `{ ${fields.join(", ")} }`;
}

/** @returns the case that pins how the source reports `failure` */
function reportsFailureAsValue(
  failure: DeckCombosFailure
): ComboSourceContractCase {
  return {
    name: `reports an upstream failure as the value ${describeFailure(failure)}, never as a thrown error`,
    run: async (harness) => {
      harness.upstreamFails(failure);

      await expect(harness.source.findCombos(RECORDED_DECK)).resolves.toEqual(
        failure
      );
    },
  };
}

/**
 * Every case of the contract, in the order the test files register them.
 *
 * Each `*.contract.test.ts` (and the fake's test file) declares its own `it`
 * per case, building a fresh harness for each, so the tests are visible in
 * the file that runs them: SonarCloud (S2187) and a reader both see a test
 * file with tests, not a single call into a shared `describe`.
 */
export const COMBO_SOURCE_CONTRACT_CASES: readonly ComboSourceContractCase[] = [
  {
    name: "lists the combos a deck holds, each mapped to its id, cards, effects, infinity and prerequisites",
    run: async (harness) => {
      harness.upstreamListsTheRecordedCombos();

      const result = await harness.source.findCombos(RECORDED_DECK);

      expect(result.kind).toBe("found");
      expect(result).toMatchObject({ combos: RECORDED_DECK_COMBOS });
    },
  },
  {
    name: "answers a deck that holds no known combo as found, with none",
    run: async (harness) => {
      harness.upstreamListsNoCombo();

      expect(await harness.source.findCombos(COMBOLESS_DECK)).toEqual({
        kind: "found",
        combos: [],
      });
    },
  },
  ...UPSTREAM_FAILURES.map(reportsFailureAsValue),
  {
    name: "lists the combos again once the upstream has recovered: a failure is not remembered",
    run: async (harness) => {
      harness.upstreamFails({ kind: "timeout" });
      await harness.source.findCombos(RECORDED_DECK);

      harness.upstreamListsTheRecordedCombos();
      const recovered = await harness.source.findCombos(RECORDED_DECK);

      expect(recovered.kind).toBe("found");
      expect(recovered).toMatchObject({ combos: RECORDED_DECK_COMBOS });
    },
  },
];
