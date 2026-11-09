import { describe, expect, it } from "vitest";
import { ALL_GENERATED_DECK_CARDS } from "./fixtures/generated-deck-cards";
import { checkGeneratedDeckLegality } from "./generated-deck-legality";
import { validateGeneratedDeck } from "./generated-deck-validation";
import { buildSuggestionEvidence } from "./suggestion-evidence";
import type { AIDeckResponse, DeckCorrection } from "@/app/api/ai/build/types";
import { buildScryfallNameIndex } from "@/lib/scryfall/name-index";
import type { ScryfallCard } from "@/lib/scryfall/types";

const CARD_DATA = buildScryfallNameIndex(ALL_GENERATED_DECK_CARDS);

const GENERATED_DECK_CASES: readonly {
  readonly label: string;
  readonly response: AIDeckResponse;
  readonly expectedCorrections: readonly DeckCorrection[];
}[] = [
  {
    label: "a legal singleton list with grouped basics",
    response: {
      commander: "Thrasios, Triton Hero",
      partner: "Tymna the Weaver",
      cards: [
        { name: "Sol Ring", quantity: 1, category: "ramp" },
        { name: "Island", quantity: 97, category: "land" },
      ],
    },
    expectedCorrections: [],
  },
  {
    label: "a partner repeated among the 98 deck cards",
    response: {
      commander: "Thrasios, Triton Hero",
      partner: "Tymna the Weaver",
      cards: [
        { name: "Tymna the Weaver", quantity: 1, category: "creature" },
        { name: "Island", quantity: 97, category: "land" },
      ],
    },
    expectedCorrections: [
      {
        action: "removed",
        name: "Tymna the Weaver",
        quantity: 1,
        reason: "commander_in_list",
      },
      { action: "added", name: "Plains", quantity: 1, reason: "fill_to_size" },
    ],
  },
  {
    label: "a list short by one card",
    response: {
      commander: "Talrand, Sky Summoner",
      partner: null,
      cards: [{ name: "Island", quantity: 98, category: "land" }],
    },
    expectedCorrections: [
      { action: "added", name: "Island", quantity: 1, reason: "fill_to_size" },
    ],
  },
];

const RECOMMENDATION_CASES: readonly {
  readonly label: string;
  readonly card: ScryfallCard | undefined;
  readonly colors: readonly string[];
  readonly expected: { readonly verified: boolean; readonly colorCompatible: boolean | null; readonly commanderLegal: boolean | null };
}[] = [
  {
    label: "a verified legal card inside the deck colors",
    card: { id: "signet", name: "Arcane Signet", cmc: 2, type_line: "Artifact", color_identity: [], legalities: { commander: "legal" } },
    colors: ["W", "U"],
    expected: { verified: true, colorCompatible: true, commanderLegal: true },
  },
  {
    label: "a verified off-color card",
    card: { id: "red", name: "Red Card", cmc: 3, type_line: "Sorcery", color_identity: ["R"], legalities: { commander: "legal" } },
    colors: ["W", "U"],
    expected: { verified: true, colorCompatible: false, commanderLegal: true },
  },
  {
    label: "a card the lookup could not verify",
    card: undefined,
    colors: ["U"],
    expected: { verified: false, colorCompatible: null, commanderLegal: null },
  },
];

describe("AI golden evaluation", () => {
  for (const sample of GENERATED_DECK_CASES) {
    it(`checks ${sample.label} against card data`, () => {
      expect(validateGeneratedDeck(sample.response)).toEqual([]);
      expect(checkGeneratedDeckLegality(sample.response, CARD_DATA)).toEqual(
        expect.objectContaining({
          status: "accepted",
          corrections: sample.expectedCorrections,
        })
      );
    });
  }

  for (const sample of RECOMMENDATION_CASES) {
    it(`grounds ${sample.label}`, () => {
      const evidence = buildSuggestionEvidence(
        { name: sample.card?.name ?? "Unknown Card", reason: "Supports the game plan.", category: "support" },
        sample.card,
        { deckColors: sample.colors, averageCmc: 3 }
      );

      expect(evidence).toEqual(expect.objectContaining(sample.expected));
      expect(evidence.synergy).toBe("Supports the game plan.");
    });
  }
});
