/**
 * Stored deck rows to counting rows (I-60 slice 2, requirements 3.2 and 3.3):
 * where the commanders, the colour identity and the main-deck cards come from.
 */
import { describe, expect, it } from "vitest";
import { aDeckCard } from "@/test/builders/card";
import type { DeckCard } from "@/lib/deck/types";
import {
  toPlayerStatsDeck,
  type StoredStatsCard,
  type StoredStatsDeck,
} from "./player-stats-rows";

const CREATED = new Date("2026-02-01T00:00:00.000Z");

const STORED_DECK: StoredStatsDeck = {
  id: "deck-1",
  name: "Elves",
  format: "commander",
  targetBracket: 2,
  manualBracket: null,
  pairingType: "none",
  createdAt: CREATED,
  updatedAt: CREATED,
};

/** A stored card row of `deck-1`, from the shared card builder. */
function aStoredCard(
  overrides: Partial<DeckCard> & {
    readonly isCommander?: boolean;
    readonly isPartner?: boolean;
  } = {}
): StoredStatsCard {
  const { isCommander = false, isPartner = false, ...card } = overrides;
  const built = aDeckCard({ id: card.name ?? "card", ...card });
  return {
    ...built,
    deckId: STORED_DECK.id,
    scryfallId: `scryfall:${built.name}`,
    isCommander,
    isPartner,
  };
}

describe("toPlayerStatsDeck", () => {
  it("takes the colour identity from the commanders, else from the main deck", () => {
    const withCommander = toPlayerStatsDeck({
      deck: STORED_DECK,
      cards: [
        aStoredCard({ name: "Ezuri", colorIdentity: ["G"], isCommander: true }),
        aStoredCard({ name: "Counterspell", colorIdentity: ["U"] }),
      ],
      snapshotDates: [],
    });
    const withoutCommander = toPlayerStatsDeck({
      deck: { ...STORED_DECK, format: "modern" },
      cards: [
        aStoredCard({ name: "Lightning Bolt", colorIdentity: ["R"] }),
        aStoredCard({ name: "Counterspell", colorIdentity: ["U"] }),
      ],
      snapshotDates: [],
    });

    expect(withCommander?.colorIdentity).toEqual(["G"]);
    expect(withoutCommander?.colorIdentity).toEqual(["U", "R"]);
  });

  it("names the commander and its partner, and counts only main-deck cards besides them", () => {
    const row = toPlayerStatsDeck({
      deck: { ...STORED_DECK, pairingType: "partner" },
      cards: [
        aStoredCard({ name: "Thrasios", isCommander: true }),
        aStoredCard({ name: "Tymna", isPartner: true }),
        aStoredCard({ name: "Sol Ring", typeLine: "Artifact" }),
        aStoredCard({ name: "Mana Crypt", zone: "sideboard" }),
        aStoredCard({ name: "Mox Diamond", zone: "maybeboard" }),
      ],
      snapshotDates: [CREATED],
    });

    expect(row?.commanders).toEqual(["Thrasios", "Tymna"]);
    expect(row?.mainCards).toEqual([
      { name: "Sol Ring", typeLine: "Artifact" },
    ]);
    expect(row?.targetBracket).toBe(2);
    expect(row?.snapshotDates).toEqual([CREATED]);
  });

  it("estimates a bracket for a Commander deck and none for another format", () => {
    const cards = [aStoredCard({ name: "Ezuri", isCommander: true })];

    const commander = toPlayerStatsDeck({
      deck: STORED_DECK,
      cards,
      snapshotDates: [],
    });
    const modern = toPlayerStatsDeck({
      deck: { ...STORED_DECK, format: "modern" },
      cards,
      snapshotDates: [],
    });

    expect(commander?.computedBracket).toBe(1);
    expect(modern?.computedBracket).toBeNull();
  });

  it("leaves out a deck in a format this build does not know", () => {
    const row = toPlayerStatsDeck({
      deck: { ...STORED_DECK, format: "tiny-leaders" },
      cards: [],
      snapshotDates: [],
    });

    expect(row).toBeNull();
  });
});
