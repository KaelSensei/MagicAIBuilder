/**
 * The shared contract suite of the `ComboSource` port (ADR 0005: one suite
 * per owned port, run against the in-memory fake and the real adapter).
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
import { beforeEach, describe, expect, it } from "vitest";

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
  },
  {
    id: "742-1295",
    cards: ["Demonic Consultation", "Thassa's Oracle"],
    effects: ["Exile your library", "Win the game"],
    isInfinite: true,
    prerequisites: { otherPieces: [], conditions: [], manaNeeded: "{U}{U}{B}" },
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
 * Registers the contract cases against the harness `makeHarness` builds
 * before each of them.
 *
 * @param makeHarness - builds a fresh harness; the suite shares nothing between cases
 */
export function describeComboSourceContract(
  makeHarness: () => ComboSourceHarness
): void {
  let harness: ComboSourceHarness;

  beforeEach(() => {
    harness = makeHarness();
  });

  describe("ComboSource contract", () => {
    it("lists the combos a deck holds, each mapped to its id, cards, effects, infinity and prerequisites", async () => {
      harness.upstreamListsTheRecordedCombos();

      const result = await harness.source.findCombos(RECORDED_DECK);

      expect(result.kind).toBe("found");
      expect(result).toMatchObject({ combos: RECORDED_DECK_COMBOS });
    });

    it("answers a deck that holds no known combo as found, with none", async () => {
      harness.upstreamListsNoCombo();

      expect(await harness.source.findCombos(COMBOLESS_DECK)).toEqual({
        kind: "found",
        combos: [],
      });
    });

    it.each(UPSTREAM_FAILURES)(
      "reports an upstream failure as the value %o, never as a thrown error",
      async (failure) => {
        harness.upstreamFails(failure);

        await expect(harness.source.findCombos(RECORDED_DECK)).resolves.toEqual(
          failure
        );
      }
    );

    it("lists the combos again once the upstream has recovered: a failure is not remembered", async () => {
      harness.upstreamFails({ kind: "timeout" });
      await harness.source.findCombos(RECORDED_DECK);

      harness.upstreamListsTheRecordedCombos();
      const recovered = await harness.source.findCombos(RECORDED_DECK);

      expect(recovered.kind).toBe("found");
      expect(recovered).toMatchObject({ combos: RECORDED_DECK_COMBOS });
    });
  });
}
