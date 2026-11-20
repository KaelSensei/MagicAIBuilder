import { describe, expect, it } from "vitest";
import { readCopilotClaim } from "./suggestion-claim-read";
import {
  suggestionClaims,
  type ClaimSource,
  type CopilotClaim,
} from "./suggestion-claims";
import type { ScryfallCard } from "@/lib/scryfall/types";

const OBSERVED_AT = "2026-11-20T11:00:00.000Z";

function card(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: "card-1",
    name: "Arcane Signet",
    cmc: 2,
    type_line: "Artifact",
    color_identity: [],
    legalities: { commander: "legal" },
    prices: { usd: "1.25" },
    game_changer: false,
    ...overrides,
  };
}

const deck = {
  observedAt: OBSERVED_AT,
  deckColors: ["W", "U"],
  commandZoneNames: ["Raff, Weatherlight Stalwart"],
  deckCardNames: ["Raff, Weatherlight Stalwart"],
};

describe("suggestionClaims", () => {
  it("tags the model's reason as reasoned, even when it cites a rule number", () => {
    const claims = suggestionClaims(
      { reason: "This is legal under CR 903.5 and smooths turn three." },
      card(),
      deck
    );
    const reasoned = claims.filter((claim) => claim.kind === "reasoned");

    expect(reasoned).toEqual([
      {
        kind: "reasoned",
        text: "This is legal under CR 903.5 and smooths turn three.",
      },
    ]);
    expect(reasoned[0]).not.toHaveProperty("source");
    expect(reasoned[0]).not.toHaveProperty("observedAt");
  });

  it("checks mana value, price, colour, legality and the Game Changers list, each with the observation time", () => {
    const claims = suggestionClaims({ reason: "Fixes colours." }, card(), deck);

    expect(checkedClaims(claims)).toEqual([
      fact("Mana value 2", "scryfall-card-data"),
      fact("Price 1.25 USD", "scryfall-card-data"),
      fact("Legal in Commander", "scryfall-card-data"),
      fact("Inside the commander's colour identity", "colour-identity-rule"),
      fact("Not on the Game Changers list", "game-changers-list"),
    ]);
  });

  it("sources a ban from the format banlist and an off-identity Game Changer from its own lists", () => {
    const claims = suggestionClaims(
      { reason: "A finisher." },
      card({
        name: "Dockside Extortionist",
        color_identity: ["R"],
        legalities: { commander: "banned" },
        game_changer: true,
        prices: { usd: null },
      }),
      deck
    );

    expect(checkedClaims(claims)).toEqual([
      fact("Mana value 2", "scryfall-card-data"),
      fact("Banned in Commander", "format-banlist"),
      fact("Outside the commander's colour identity", "colour-identity-rule"),
      fact("On the Game Changers list", "game-changers-list"),
    ]);
  });

  it("leaves an unknown price, legality and Game Changer flag unchecked", () => {
    const claims = suggestionClaims(
      { reason: "Useful effect." },
      card({
        legalities: undefined,
        prices: undefined,
        game_changer: undefined,
      }),
      deck
    );

    expect(checkedClaims(claims).map((claim) => claim.source)).toEqual([
      "scryfall-card-data",
      "colour-identity-rule",
    ]);
    expect(checkedClaims(claims)[0]?.text).toBe("Mana value 2");
  });

  it("makes no checked claim when the lookup did not find the card", () => {
    const claims = suggestionClaims(
      { reason: "Provider rationale." },
      undefined,
      deck
    );

    expect(claims).toEqual([{ kind: "reasoned", text: "Provider rationale." }]);
  });

  it("makes no claim at all when the model gave no reason and the card was not found", () => {
    expect(suggestionClaims({ reason: "   " }, undefined, deck)).toEqual([]);
  });

  it("makes no checked claim when the observation time is missing", () => {
    const claims = suggestionClaims({ reason: "Ramp." }, card(), {
      ...deck,
      observedAt: "yesterday",
    });

    expect(claims).toEqual([{ kind: "reasoned", text: "Ramp." }]);
  });

  it("checks the singleton rule only for a card the deck already contains (CR 903.5b)", () => {
    const already = suggestionClaims({ reason: "Another copy." }, card(), {
      ...deck,
      deckCardNames: ["arcane signet"],
    });
    const basic = suggestionClaims(
      { reason: "More islands." },
      card({
        name: "Island",
        type_line: "Basic Land — Island",
        color_identity: ["U"],
      }),
      { ...deck, deckCardNames: ["Island"], deckColors: ["U"] }
    );
    const absent = suggestionClaims({ reason: "New rock." }, card(), deck);

    expect(checkedClaims(already).at(-1)).toEqual(
      fact(
        "Already in the deck; Commander allows one copy of a card that is not a basic land",
        "singleton-rule"
      )
    );
    expect(checkedClaims(basic).at(-1)).toEqual(
      fact(
        "Already in the deck; a basic land may be repeated",
        "singleton-rule"
      )
    );
    expect(
      checkedClaims(absent).some((claim) => claim.source === "singleton-rule")
    ).toBe(false);
  });

  it("keeps a card a rulebreaker admits inside the colour identity (CR 903.5e)", () => {
    const sanctuary = card({
      name: "Mystic Sanctuary",
      type_line: "Land — Island",
      cmc: 0,
      color_identity: ["U"],
    });
    const claims = suggestionClaims({ reason: "Rebuys a spell." }, sanctuary, {
      ...deck,
      deckColors: ["R", "G"],
      commandZoneNames: ["Grizzlegom, Hurloon Hero"],
    });

    expect(checkedClaims(claims).map((claim) => claim.text)).toContain(
      "Inside the commander's colour identity"
    );
  });
});

describe("readCopilotClaim", () => {
  it("reads a checked claim and a reasoned claim back", () => {
    expect(
      readCopilotClaim({
        kind: "checked",
        text: "Legal in Commander",
        source: "scryfall-card-data",
        observedAt: OBSERVED_AT,
      })
    ).toEqual(fact("Legal in Commander", "scryfall-card-data"));
    expect(
      readCopilotClaim({ kind: "reasoned", text: "Smooths turn three." })
    ).toEqual({ kind: "reasoned", text: "Smooths turn three." });
  });

  it("refuses an untyped claim, a checked claim with no source or time, and a reasoned claim that carries a source", () => {
    expect(readCopilotClaim({ text: "Legal in Commander" })).toBeUndefined();
    expect(
      readCopilotClaim({
        kind: "checked",
        text: "Legal in Commander",
        source: "the model",
        observedAt: OBSERVED_AT,
      })
    ).toBeUndefined();
    expect(
      readCopilotClaim({
        kind: "checked",
        text: "Legal in Commander",
        source: "scryfall-card-data",
      })
    ).toBeUndefined();
    expect(
      readCopilotClaim({
        kind: "reasoned",
        text: "This is legal under CR 903.5.",
        source: "scryfall-card-data",
      })
    ).toBeUndefined();
    expect(
      readCopilotClaim({ kind: "guessed", text: "Maybe." })
    ).toBeUndefined();
    expect(readCopilotClaim(null)).toBeUndefined();
  });
});

function fact(text: string, source: ClaimSource): CopilotClaim {
  return { kind: "checked", text, source, observedAt: OBSERVED_AT };
}

function checkedClaims(claims: readonly CopilotClaim[]) {
  return claims.filter((claim) => claim.kind === "checked");
}
