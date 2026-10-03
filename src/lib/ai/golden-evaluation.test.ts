import { describe, expect, it } from "vitest";
import { validateGeneratedDeck } from "./generated-deck-validation";
import { buildSuggestionEvidence } from "./suggestion-evidence";
import type { AIDeckResponse } from "@/app/api/ai/build/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

const GENERATED_DECK_CASES: readonly {
  readonly label: string;
  readonly response: AIDeckResponse;
  readonly expectedIssue: string | null;
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
    expectedIssue: null,
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
    expectedIssue: "The partner Tymna the Weaver is duplicated in the card list.",
  },
  {
    label: "a list short by one card",
    response: {
      commander: "Atraxa, Praetors' Voice",
      partner: null,
      cards: [{ name: "Island", quantity: 98, category: "land" }],
    },
    expectedIssue: "The generated deck contains 98 cards; expected 99.",
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
    it(`validates ${sample.label}`, () => {
      const issues = validateGeneratedDeck(sample.response);
      if (sample.expectedIssue === null) {
        expect(issues).toEqual([]);
      } else {
        expect(issues).toContain(sample.expectedIssue);
      }
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
