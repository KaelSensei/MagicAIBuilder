/**
 * The format switch report as a pure policy: which of a deck's cards break the
 * copy limit and the colour identity rule of the format it would switch to.
 * The deck settings test (`DeckDetailsPanel.test.tsx`) drives the whole
 * switch; this file pins the counting rules it does not reach.
 */
import { describe, expect, it } from "vitest";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import { formatSwitchReport } from "./format-switch";

const NO_BANS: ReadonlySet<string> = new Set();

describe("formatSwitchReport", () => {
  // CR 100.2a: at most four copies across the deck and its sideboard.
  it("adds up the copies of a card across printings and the sideboard, and leaves the maybeboard out", () => {
    const deck = aDeck({
      format: "commander",
      cards: [
        aDeckCard({ id: "bolt-m10", name: "Lightning Bolt", quantity: 2 }),
        aDeckCard({ id: "bolt-2x2", name: "Lightning Bolt", quantity: 2 }),
        aDeckCard({
          id: "bolt-side",
          name: "Lightning Bolt",
          quantity: 1,
          zone: "sideboard",
        }),
        aDeckCard({
          id: "duress",
          name: "Duress",
          quantity: 4,
          zone: "maybeboard",
        }),
      ],
    });

    expect(formatSwitchReport(deck, "modern", NO_BANS).overCopyLimit).toEqual([
      { name: "Lightning Bolt", copies: 5, limit: 4 },
    ]);
  });

  // CR 903.5c applies to the Commander variants only.
  it("checks colour identity for Brawl and not for a constructed format", () => {
    const deck = aDeck({
      commander: aDeckCard({
        id: "krenko",
        name: "Krenko, Mob Boss",
        colorIdentity: ["R"],
      }),
      cards: [
        aDeckCard({
          id: "counterspell",
          name: "Counterspell",
          colorIdentity: ["U"],
        }),
      ],
    });

    expect(
      formatSwitchReport(deck, "brawl", NO_BANS).outsideColorIdentity
    ).toEqual(["Counterspell"]);
    expect(
      formatSwitchReport(deck, "legacy", NO_BANS).outsideColorIdentity
    ).toEqual([]);
  });

  it("names a banned card once, from the command zone or the main deck", () => {
    const deck = aDeck({
      commander: aDeckCard({ id: "golos", name: "Golos, Tireless Pilgrim" }),
      cards: [
        aDeckCard({ id: "ring-a", name: "Sol Ring" }),
        aDeckCard({ id: "ring-b", name: "Sol Ring" }),
        aDeckCard({ id: "ring-side", name: "Mana Crypt", zone: "sideboard" }),
      ],
    });
    const bans = new Set(["Golos, Tireless Pilgrim", "Sol Ring", "Mana Crypt"]);

    expect(formatSwitchReport(deck, "brawl", bans).banned).toEqual([
      "Golos, Tireless Pilgrim",
      "Sol Ring",
    ]);
  });
});
