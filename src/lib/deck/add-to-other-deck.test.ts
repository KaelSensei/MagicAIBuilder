import { describe, expect, it } from "vitest";
import { decideOtherDeckWrite } from "@/lib/deck/add-to-other-deck";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";

const SMOTHERING_TITHE = aDeckCard({
  id: "row-tithe",
  scryfallId: "tithe-print",
  name: "Smothering Tithe",
  typeLine: "Enchantment",
});
const SOL_RING = aDeckCard({
  id: "row-sol-ring",
  scryfallId: "sol-ring-print",
  name: "Sol Ring",
  typeLine: "Artifact",
});
const LIGHTNING_BOLT = aDeckCard({
  id: "row-bolt",
  scryfallId: "bolt-print",
  name: "Lightning Bolt",
  typeLine: "Instant",
});
const FOREST = aDeckCard({
  id: "row-forest",
  scryfallId: "forest-print",
  name: "Forest",
  typeLine: "Basic Land — Forest",
});

describe("decideOtherDeckWrite", () => {
  it("writes a new row when the zone does not hold the card", () => {
    const kaalia = aDeck({ id: "kaalia", cards: [SOL_RING] });

    expect(decideOtherDeckWrite(kaalia, SMOTHERING_TITHE, "main")).toEqual({
      kind: "addRow",
    });
  });

  it("writes a new row when only another zone holds the card", () => {
    const burn = aDeck({
      id: "burn",
      format: "modern",
      cards: [{ ...LIGHTNING_BOLT, id: "burn-bolt-side", zone: "sideboard" }],
    });

    expect(decideOtherDeckWrite(burn, LIGHTNING_BOLT, "main")).toEqual({
      kind: "addRow",
    });
  });

  it("is at the limit when a Commander deck holds the card in its sideboard", () => {
    // CR 903.5b: one copy of each card; the sideboard counts with the deck
    // (CR 100.4a).
    const kaalia = aDeck({
      id: "kaalia",
      cards: [{ ...SMOTHERING_TITHE, id: "kaalia-tithe", zone: "sideboard" }],
    });

    expect(decideOtherDeckWrite(kaalia, SMOTHERING_TITHE, "main")).toEqual({
      kind: "atLimit",
    });
  });

  it("adds one copy to the row of a Modern deck holding three of a four-of card", () => {
    // CR 100.2a: a constructed deck may hold four copies of a card.
    const burn = aDeck({
      id: "burn",
      format: "modern",
      cards: [{ ...LIGHTNING_BOLT, id: "burn-bolt", quantity: 3 }],
    });

    expect(decideOtherDeckWrite(burn, LIGHTNING_BOLT, "main")).toEqual({
      kind: "addCopy",
      rowId: "burn-bolt",
      quantity: 4,
    });
  });

  it("matches the held row by card name, whatever its printing", () => {
    const burn = aDeck({
      id: "burn",
      format: "modern",
      cards: [
        { ...LIGHTNING_BOLT, id: "burn-bolt", scryfallId: "other-print", quantity: 2 },
      ],
    });

    expect(decideOtherDeckWrite(burn, LIGHTNING_BOLT, "main")).toEqual({
      kind: "addCopy",
      rowId: "burn-bolt",
      quantity: 3,
    });
  });

  it("is at the limit when a Modern deck already holds four copies", () => {
    const burn = aDeck({
      id: "burn",
      format: "modern",
      cards: [{ ...LIGHTNING_BOLT, id: "burn-bolt", quantity: 4 }],
    });

    expect(decideOtherDeckWrite(burn, LIGHTNING_BOLT, "main")).toEqual({
      kind: "atLimit",
    });
  });

  it("is at the limit when a Commander deck already holds Sol Ring", () => {
    // CR 903.5b: one copy of each card in a Commander deck.
    const kaalia = aDeck({
      id: "kaalia",
      cards: [{ ...SOL_RING, id: "kaalia-sol-ring" }],
    });

    expect(decideOtherDeckWrite(kaalia, SOL_RING, "main")).toEqual({
      kind: "atLimit",
    });
  });

  it("adds one more basic land to a Commander deck", () => {
    // CR 903.5b: basic lands are exempt from the singleton rule.
    const kaalia = aDeck({
      id: "kaalia",
      cards: [{ ...FOREST, id: "kaalia-forest", quantity: 7 }],
    });

    expect(decideOtherDeckWrite(kaalia, FOREST, "main")).toEqual({
      kind: "addCopy",
      rowId: "kaalia-forest",
      quantity: 8,
    });
  });

  it("reads the Considering zone as its own zone", () => {
    const kaalia = aDeck({
      id: "kaalia",
      cards: [{ ...SOL_RING, id: "kaalia-sol-ring", zone: "maybeboard" }],
    });

    expect(decideOtherDeckWrite(kaalia, SOL_RING, "maybeboard")).toEqual({
      kind: "atLimit",
    });
    expect(decideOtherDeckWrite(kaalia, SOL_RING, "sideboard")).toEqual({
      kind: "addRow",
    });
  });
});
