import type { DeckZone } from "../types";

export const PLAIN_TEXT_IMPORT_V1 = {
  version: "plain-text/v1",
  input: `// Commander
1 Thrasios, Triton Hero

// Partner
1 Tymna the Weaver

// Companion
1 Lurrus of the Dream-Den

// Deck
1 Sol Ring
2 Island

// Sideboard
3 Negate

// Considering
1 Swords to Plowshares`,
  expected: {
    commander: "Thrasios, Triton Hero",
    partner: "Tymna the Weaver",
    companion: "Lurrus of the Dream-Den",
    cards: [
      { name: "Sol Ring", quantity: 1 },
      { name: "Island", quantity: 2 },
      { name: "Negate", quantity: 3, zone: "sideboard" as DeckZone },
      { name: "Swords to Plowshares", quantity: 1, zone: "maybeboard" as DeckZone },
    ],
  },
} as const;
