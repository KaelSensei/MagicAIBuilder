/**
 * Runs the `ComboSource` contract against the in-memory fake, so the tests
 * that use the fake can trust it to behave like the Spellbook adapter, and
 * pins what the fake adds for its tests: the record of the lists it was
 * asked for, and independence between instances.
 */
import { describe, expect, it } from "vitest";

import {
  COMBOLESS_DECK,
  describeComboSourceContract,
  RECORDED_DECK,
  RECORDED_DECK_COMBOS,
  type ComboSourceHarness,
} from "./combo-source-contract";
import { inMemoryComboSource } from "./in-memory-combo-source";

/** The contract's combos as the fake stores them: the description is not under contract. */
const SEEDED_COMBOS = RECORDED_DECK_COMBOS.map((facts) => ({
  ...facts,
  description: "",
}));

/** @returns a harness on a new, empty fake */
function inMemoryHarness(): ComboSourceHarness {
  const source = inMemoryComboSource();
  return {
    source,
    upstreamListsTheRecordedCombos: () =>
      source.knows(RECORDED_DECK, SEEDED_COMBOS),
    upstreamListsNoCombo: () => source.knows(COMBOLESS_DECK, []),
    upstreamFails: (failure) => source.fails(failure),
  };
}

describe("in-memory combo source — ComboSource contract", () => {
  describeComboSourceContract(inMemoryHarness);

  it("records every list it was asked for, in order and as given", async () => {
    const source = inMemoryComboSource();

    await source.findCombos(RECORDED_DECK);
    await source.findCombos(COMBOLESS_DECK);

    expect(source.queries).toEqual([RECORDED_DECK, COMBOLESS_DECK]);
  });

  it("knows no combo for a list nobody seeded, like Spellbook for a deck without one", async () => {
    const source = inMemoryComboSource();
    source.knows(RECORDED_DECK, SEEDED_COMBOS);

    expect(await source.findCombos(COMBOLESS_DECK)).toEqual({
      kind: "found",
      combos: [],
    });
  });

  it("gives each instance its own knowledge, so no test sees another's seed", async () => {
    inMemoryComboSource().knows(RECORDED_DECK, SEEDED_COMBOS);

    expect(await inMemoryComboSource().findCombos(RECORDED_DECK)).toEqual({
      kind: "found",
      combos: [],
    });
  });
});
