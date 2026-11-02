import type { DeckZone } from "../types";

/** A Moxfield-compatible comment-heading decklist contract. */
export const MOXFIELD_IMPORT_V1 = {
  version: "moxfield/v1",
  input: `// Commander
1 Atraxa, Praetors' Voice

// Deck
1 Sol Ring

// Sideboard
2 Negate

// Considering
1 Teferi's Protection`,
  expected: {
    commander: "Atraxa, Praetors' Voice",
    partner: null,
    companion: null,
    cards: [
      { name: "Sol Ring", quantity: 1 },
      { name: "Negate", quantity: 2, zone: "sideboard" as DeckZone },
      { name: "Teferi's Protection", quantity: 1, zone: "maybeboard" as DeckZone },
    ],
  },
} as const;
