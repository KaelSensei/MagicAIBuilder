import { describe, expect, it } from "vitest";
import type { DeckCard } from "./types";
import { cardsFromZoneSource, countCopiesByZone, deckFromZoneCards } from "./zone-source";
import { createEmptyDeck } from "./store-factories";

function card(id: string, zone: DeckCard["zone"], isMaybeboard?: boolean): DeckCard {
  return {
    id,
    name: id,
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Instant",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "instant",
    quantity: 1,
    zone,
    isMaybeboard,
  };
}

describe("cardsFromZoneSource", () => {
  it("keeps the persisted zone when a legacy mirror disagrees", () => {
    const main = card("sol-ring", "main", true);
    const cards = cardsFromZoneSource({
      cards: [main],
      maybeboard: [card("sol-ring", "maybeboard", true)],
    });

    expect(cards).toEqual([card("sol-ring", "main", false)]);
  });

  it("folds a mirror-only card into the zone list once", () => {
    const cards = cardsFromZoneSource({
      cards: [card("island", "main")],
      maybeboard: [card("ponder", "main", false)],
    });

    expect(cards.map((entry) => [entry.id, entry.zone, entry.isMaybeboard])).toEqual([
      ["island", "main", false],
      ["ponder", "maybeboard", true],
    ]);
  });
});

describe("countCopiesByZone", () => {
  it("sums copies per zone and ignores a mirror row the deck already holds", () => {
    const forest = card("forest", "main");
    const doubled = { ...forest, quantity: 30 };
    expect(
      countCopiesByZone({
        cards: [doubled, card("bolt", "sideboard"), card("ponder", "maybeboard")],
        maybeboard: [card("ponder", "maybeboard"), card("only-mirror", "main")],
      })
    ).toEqual({ main: 30, sideboard: 1, maybeboard: 2 });
  });

  it("reports an empty deck as zero copies in every zone", () => {
    expect(countCopiesByZone(null)).toEqual({ main: 0, sideboard: 0, maybeboard: 0 });
  });
});

describe("deckFromZoneCards", () => {
  it("derives the maybeboard mirror from zone and drops duplicate ids", () => {
    const deck = createEmptyDeck("deck-1", "Zones");
    const next = deckFromZoneCards(deck, [
      card("bolt", "sideboard"),
      card("bolt", "main"),
      card("ponder", "maybeboard", false),
    ]);

    expect(next.cards.map((entry) => [entry.id, entry.zone])).toEqual([
      ["bolt", "sideboard"],
      ["ponder", "maybeboard"],
    ]);
    expect(next.maybeboard.map((entry) => entry.id)).toEqual(["ponder"]);
    expect(next.maybeboard[0]?.isMaybeboard).toBe(true);
  });
});
