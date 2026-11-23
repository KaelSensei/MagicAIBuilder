import { describe, expect, it } from "vitest";
import { deckCard } from "@/test/playtest-db-fake";
import { restoredDeck, restoredDeckCards } from "./snapshot-restore";

const ATRAXA = deckCard("Atraxa, Praetors' Voice", { isCommander: true });
const SOL_RING = deckCard("Sol Ring");

describe("restoredDeckCards", () => {
  it("rejects a non-array snapshot with a type error", () => {
    expect(() => restoredDeckCards("deck-1", null)).toThrow(TypeError);
  });
});

describe("restoredDeck", () => {
  it("names the commander row's printing and name, and no partner", () => {
    const { commanders } = restoredDeck("deck-1", [SOL_RING, ATRAXA]);

    expect(commanders).toEqual({
      commanderId: ATRAXA.scryfallId,
      commanderName: ATRAXA.name,
      partnerId: null,
    });
  });

  it("never takes the companion for a commander", () => {
    const lurrus = deckCard("Lurrus of the Dream-Den", { category: "companion" });

    const { commanders } = restoredDeck("deck-1", [lurrus, SOL_RING]);

    expect(commanders).toEqual({
      commanderId: null,
      commanderName: null,
      partnerId: null,
    });
  });

  it("names a partner row even when the snapshot holds no commander row", () => {
    const thrasios = deckCard("Thrasios, Triton Hero", { isPartner: true });

    const { commanders } = restoredDeck("deck-1", [thrasios]);

    expect(commanders.partnerId).toBe(thrasios.scryfallId);
    expect(commanders.commanderId).toBeNull();
  });
});
