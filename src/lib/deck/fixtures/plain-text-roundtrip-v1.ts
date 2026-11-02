import type { DeckZone } from "../types";

type RoundTripCard = {
  readonly name: string;
  readonly quantity: number;
  readonly zone: DeckZone;
};

/**
 * The MagicAIBuilder plain-text v1 interchange contract.
 *
 * This fixture is deliberately shared by export and import assertions: changing
 * headings, quantities, or a secondary zone requires an explicit v2 contract.
 */
export const PLAIN_TEXT_ROUND_TRIP_V1 = {
  version: "plain-text-round-trip/v1",
  deck: {
    commander: {
      name: "Thrasios, Triton Hero",
      quantity: 1,
      zone: "main",
    } satisfies RoundTripCard,
    partner: {
      name: "Tymna the Weaver",
      quantity: 1,
      zone: "main",
    } satisfies RoundTripCard,
    companion: {
      name: "Lurrus of the Dream-Den",
      quantity: 1,
      zone: "main",
    } satisfies RoundTripCard,
    cards: [
      { name: "Sol Ring", quantity: 1, zone: "main" },
      { name: "Island", quantity: 2, zone: "main" },
      { name: "Negate", quantity: 3, zone: "sideboard" },
      { name: "Swords to Plowshares", quantity: 1, zone: "maybeboard" },
    ] satisfies readonly RoundTripCard[],
  },
  output: `Commander
1 Thrasios, Triton Hero

Partner
1 Tymna the Weaver

Companion
1 Lurrus of the Dream-Den

Deck
1 Sol Ring
2 Island

Sideboard
3 Negate

Considering
1 Swords to Plowshares`,
  expectedImport: {
    commander: "Thrasios, Triton Hero",
    partner: "Tymna the Weaver",
    companion: "Lurrus of the Dream-Den",
    cards: [
      { name: "Sol Ring", quantity: 1 },
      { name: "Island", quantity: 2 },
      { name: "Negate", quantity: 3, zone: "sideboard" },
      { name: "Swords to Plowshares", quantity: 1, zone: "maybeboard" },
    ],
  },
} as const;
