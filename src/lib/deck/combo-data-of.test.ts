/**
 * How the deck's combo lookup state reads as combo data (issue #1840).
 * Solitary: `comboDataOf` is a pure mapping.
 */
import { describe, expect, it } from "vitest";
import type { Combo } from "@/modules/combos";
import { comboDataOf } from "./combo-data-of";

const SCEPTER_REVERSAL: Combo = {
  id: "1234-5678",
  cards: ["Dramatic Reversal", "Isochron Scepter"],
  effects: ["Infinite mana"],
  description: "Imprint Dramatic Reversal on Isochron Scepter.",
  isInfinite: true,
  prerequisites: { otherPieces: [], conditions: [], manaNeeded: "{2}" },
  startZones: {},
  standaloneResults: [],
  manaValueNeeded: 2,
  bracketTag: null,
};

describe("comboDataOf", () => {
  it("reads a lookup that has not answered as pending, not as no combo", () => {
    expect(
      comboDataOf({ data: undefined, isLoading: true, isError: false })
    ).toEqual({ kind: "pending" });
  });

  it("reads a failed lookup as unavailable", () => {
    expect(
      comboDataOf({ data: undefined, isLoading: false, isError: true })
    ).toEqual({ kind: "unavailable" });
  });

  it("reads an answer as the combos it found", () => {
    expect(
      comboDataOf({
        data: [SCEPTER_REVERSAL],
        isLoading: false,
        isError: false,
      })
    ).toEqual({ kind: "found", combos: [SCEPTER_REVERSAL], fetchedAt: null });
  });

  it("still reads a lookup that never runs (under ten names) as no combo found, left to I-77 slice 2", () => {
    expect(
      comboDataOf({ data: undefined, isLoading: false, isError: false })
    ).toEqual({ kind: "found", combos: [], fetchedAt: null });
  });
});
