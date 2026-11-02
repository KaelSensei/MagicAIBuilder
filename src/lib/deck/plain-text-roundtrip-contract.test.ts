import { describe, expect, it } from "vitest";
import { exportPlainText } from "./export";
import { parseTextDecklist } from "./import";
import { createEmptyDeck } from "./store-factories";
import type { DeckCard, DeckZone } from "./types";
import { PLAIN_TEXT_ROUND_TRIP_V1 } from "./fixtures/plain-text-roundtrip-v1";

function contractCard(card: {
  readonly name: string;
  readonly quantity: number;
  readonly zone: DeckZone;
}): DeckCard {
  return {
    id: card.name,
    name: card.name,
    manaCost: "",
    cmc: 0,
    typeLine: "",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "other",
    quantity: card.quantity,
    zone: card.zone,
  };
}

describe("plain-text round-trip contract", () => {
  it("keeps the v1 command zone, secondary zones, and quantities", () => {
    const deck = createEmptyDeck("round-trip-v1", "Round trip v1");
    deck.commander = contractCard(PLAIN_TEXT_ROUND_TRIP_V1.deck.commander);
    deck.partner = contractCard(PLAIN_TEXT_ROUND_TRIP_V1.deck.partner);
    deck.companion = contractCard(PLAIN_TEXT_ROUND_TRIP_V1.deck.companion);
    deck.cards = PLAIN_TEXT_ROUND_TRIP_V1.deck.cards.map(contractCard);

    const exported = exportPlainText(deck);

    expect(exported).toBe(PLAIN_TEXT_ROUND_TRIP_V1.output);
    expect(parseTextDecklist(exported)).toMatchObject(
      PLAIN_TEXT_ROUND_TRIP_V1.expectedImport,
    );
  });
});
