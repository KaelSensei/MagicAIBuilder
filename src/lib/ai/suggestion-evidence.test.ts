import { describe, expect, it } from "vitest";
import {
  attachSuggestionEvidence,
  buildSuggestionEvidence,
  suggestionLookupNames,
} from "./suggestion-evidence";
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

describe("suggestionLookupNames", () => {
  it("lists each suggestion before its alternatives, once per name, in the order the model gave them", () => {
    expect(
      suggestionLookupNames([
        {
          name: "Arcane Signet",
          alternatives: [{ name: "Fellwar Stone" }, { name: "Mind Stone" }],
        },
        { name: "Fellwar Stone" },
        { name: "Cultivate", alternatives: [] },
      ])
    ).toEqual(["Arcane Signet", "Fellwar Stone", "Mind Stone", "Cultivate"]);
  });

  it("asks for nothing when the model suggested nothing", () => {
    expect(suggestionLookupNames([])).toEqual([]);
  });
});

describe("attachSuggestionEvidence", () => {
  const deck = { deckColors: ["W", "U"], averageCmc: 3.4 };

  it("attaches evidence to a suggestion and to each alternative, which takes its parent's role", () => {
    const [suggestion] = attachSuggestionEvidence(
      [
        {
          name: "Arcane Signet",
          reason: "Accelerates the commander.",
          category: "ramp",
          priority: "high",
          alternatives: [
            {
              name: "Fellwar Stone",
              reason: "A cheaper rock.",
              dimension: "budget",
            },
          ],
        },
      ],
      [
        card(),
        card({ id: "card-2", name: "Fellwar Stone", prices: { usd: "0.75" } }),
      ],
      deck
    );

    expect(suggestion).toEqual({
      name: "Arcane Signet",
      reason: "Accelerates the commander.",
      category: "ramp",
      priority: "high",
      evidence: expect.objectContaining({
        role: "ramp",
        priceUsd: 1.25,
        verified: true,
      }),
      alternatives: [
        {
          name: "Fellwar Stone",
          reason: "A cheaper rock.",
          dimension: "budget",
          evidence: expect.objectContaining({
            role: "ramp",
            synergy: "A cheaper rock.",
            priceUsd: 0.75,
            verified: true,
          }),
        },
      ],
    });
  });

  it("finds the card whatever the letter case the model wrote its name in", () => {
    const [suggestion] = attachSuggestionEvidence(
      [{ name: "arcane SIGNET", reason: "Ramp.", category: "ramp" }],
      [card()],
      deck
    );

    expect(suggestion?.evidence.verified).toBe(true);
    expect(suggestion?.evidence.manaValue).toBe(2);
  });

  it("marks a suggestion unverified when its card was not looked up", () => {
    const [suggestion] = attachSuggestionEvidence(
      [
        {
          name: "Missing Card",
          reason: "Provider rationale.",
          category: "draw",
          alternatives: [
            { name: "Also Missing", reason: "Another rationale." },
          ],
        },
      ],
      [],
      deck
    );

    expect(suggestion?.evidence.verified).toBe(false);
    expect(suggestion?.alternatives?.[0]?.evidence.verified).toBe(false);
  });

  it("leaves a suggestion without alternatives without them", () => {
    const [suggestion] = attachSuggestionEvidence(
      [{ name: "Arcane Signet", reason: "Ramp.", category: "ramp" }],
      [card()],
      deck
    );

    expect(suggestion?.alternatives).toBeUndefined();
  });

  it("lets a rulebreaker in the command zone widen the colour fit (CR 903.5e)", () => {
    const blueLand = {
      name: "Mystic Sanctuary",
      reason: "Rebuys a spell.",
      category: "land",
    };
    const sanctuary = card({
      name: "Mystic Sanctuary",
      type_line: "Land — Island",
      cmc: 0,
      color_identity: ["U"],
    });
    const redGreen = { deckColors: ["R", "G"], averageCmc: 3 };

    const [plain] = attachSuggestionEvidence([blueLand], [sanctuary], {
      ...redGreen,
      commandZoneNames: ["Klothys, God of Destiny"],
    });
    const [rulebroken] = attachSuggestionEvidence([blueLand], [sanctuary], {
      ...redGreen,
      commandZoneNames: ["Grizzlegom, Hurloon Hero"],
    });

    expect(plain?.evidence.colorCompatible).toBe(false);
    expect(rulebroken?.evidence.colorCompatible).toBe(true);
  });
});
