import { describe, expect, it } from "vitest";
import { deckCard } from "@/test/playtest-db-fake";
import {
  restoredDeck,
  restoredDeckCards,
  restoredDeckFields,
} from "./snapshot-restore";

const ATRAXA = deckCard("Atraxa, Praetors' Voice", { isCommander: true });
const SOL_RING = deckCard("Sol Ring");
const LURRUS = deckCard("Lurrus of the Dream-Den", { category: "companion" });

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

  it("names the companion row's printing as the companion the snapshot recorded", () => {
    const { companion } = restoredDeck("deck-1", [ATRAXA, SOL_RING, LURRUS]);

    expect(companion).toEqual({
      kind: "recorded",
      companionId: LURRUS.scryfallId,
    });
  });

  it("records no companion when every row carries a category and none is the companion", () => {
    const { companion } = restoredDeck("deck-1", [ATRAXA, SOL_RING]);

    expect(companion).toEqual({ kind: "recorded", companionId: null });
  });

  it("leaves the companion unrecorded when a row carries no category", () => {
    const { companion } = restoredDeck("deck-1", [
      ATRAXA,
      { scryfallId: SOL_RING.scryfallId, name: SOL_RING.name },
    ]);

    expect(companion).toEqual({ kind: "unrecorded" });
  });
});

describe("restoredDeckFields", () => {
  it("writes the companion with the commander fields when the snapshot recorded it", () => {
    const fields = restoredDeckFields(restoredDeck("deck-1", [ATRAXA]));

    expect(fields).toEqual({
      commanderId: ATRAXA.scryfallId,
      commanderName: ATRAXA.name,
      partnerId: null,
      companionId: null,
    });
  });

  it("leaves the companion out of the write when the snapshot did not record it", () => {
    const fields = restoredDeckFields(
      restoredDeck("deck-1", [{ scryfallId: "scryfall-x", name: "X" }])
    );

    expect(fields).not.toHaveProperty("companionId");
  });
});
