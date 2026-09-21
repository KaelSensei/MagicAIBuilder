import { describe, expect, it } from "vitest";
import { buildSuggestionEvidence } from "./suggestion-evidence";
import type { ScryfallCard } from "@/lib/scryfall/types";

function card(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: "card-1",
    name: "Arcane Signet",
    cmc: 2,
    type_line: "Artifact",
    color_identity: [],
    legalities: { commander: "legal" },
    prices: { usd: "1.25" },
    ...overrides,
  };
}

describe("buildSuggestionEvidence", () => {
  it("combines the recommendation with verified Scryfall facts", () => {
    const evidence = buildSuggestionEvidence(
      {
        name: "Arcane Signet",
        reason: "Fixes colors while accelerating the commander.",
        category: "ramp",
      },
      card(),
      { deckColors: ["W", "U"], averageCmc: 3.4 }
    );

    expect(evidence).toEqual({
      role: "ramp",
      synergy: "Fixes colors while accelerating the commander.",
      manaValue: 2,
      curveImpact: "Below the deck average (3.40)",
      colorIdentity: [],
      colorCompatible: true,
      commanderLegal: true,
      priceUsd: 1.25,
      verified: true,
    });
  });

  it("flags a card outside the commander's color identity", () => {
    const evidence = buildSuggestionEvidence(
      { name: "Red Card", reason: "A finisher.", category: "winCondition" },
      card({ color_identity: ["R"] }),
      { deckColors: ["W", "U"], averageCmc: 2 }
    );

    expect(evidence.colorCompatible).toBe(false);
    expect(evidence.colorIdentity).toEqual(["R"]);
  });

  it("preserves unknown price and legality instead of claiming verification", () => {
    const evidence = buildSuggestionEvidence(
      { name: "Unknown Card", reason: "Useful effect.", category: "other" },
      card({ legalities: undefined, prices: undefined }),
      { deckColors: [], averageCmc: 2 }
    );

    expect(evidence.commanderLegal).toBeNull();
    expect(evidence.priceUsd).toBeNull();
    expect(evidence.verified).toBe(true);
  });

  it("returns an explicit unverified explanation when lookup fails", () => {
    const evidence = buildSuggestionEvidence(
      { name: "Missing Card", reason: "Provider rationale.", category: "draw" },
      undefined,
      { deckColors: ["U"], averageCmc: 3 }
    );

    expect(evidence).toEqual(
      expect.objectContaining({
        role: "draw",
        synergy: "Provider rationale.",
        commanderLegal: null,
        colorCompatible: null,
        priceUsd: null,
        verified: false,
      })
    );
  });
});
