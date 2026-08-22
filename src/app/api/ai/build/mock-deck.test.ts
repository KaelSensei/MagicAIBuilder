import { describe, it, expect } from "vitest";
import { mockDeck, MOCK_COMMANDERS } from "./mock-deck";
import type { BuildRequest } from "./types";

function req(overrides: Partial<BuildRequest> = {}): BuildRequest {
  return {
    budget: null,
    colors: ["W", "U", "B", "G"],
    strategy: "Midrange",
    commanderName: null,
    bracket: 2,
    ...overrides,
  };
}

describe("mockDeck", () => {
  it("picks a commander matching the requested colour identity", () => {
    expect(mockDeck(req({ colors: ["U", "B"] })).commander).toBe(
      MOCK_COMMANDERS.UB,
    );
    expect(mockDeck(req({ colors: ["R"] })).commander).toBe(MOCK_COMMANDERS.R);
    expect(mockDeck(req({ colors: ["W", "U", "B", "R", "G"] })).commander).toBe(
      MOCK_COMMANDERS.WUBRG,
    );
  });

  it("is insensitive to the order the colours were selected in", () => {
    const a = mockDeck(req({ colors: ["G", "U"] })).commander;
    const b = mockDeck(req({ colors: ["U", "G"] })).commander;
    expect(a).toBe(b);
    expect(a).toBe(MOCK_COMMANDERS.UG);
  });

  it("does not fall back to Atraxa for every colour combination", () => {
    const commanders = new Set(
      [["R"], ["U"], ["B", "G"], ["W", "R"]].map(
        (colors) => mockDeck(req({ colors: colors as BuildRequest["colors"] })).commander,
      ),
    );
    expect(commanders.size).toBe(4);
    expect(commanders.has(MOCK_COMMANDERS.WUBG)).toBe(false);
  });

  it("honours an explicitly requested commander", () => {
    expect(
      mockDeck(req({ colors: ["R"], commanderName: "Krenko, Mob Boss" }))
        .commander,
    ).toBe("Krenko, Mob Boss");
  });

  it("returns exactly 99 cards counting quantities", () => {
    for (const colors of [["W"], ["U", "B"], ["W", "U", "B", "R", "G"], ["C"]]) {
      const deck = mockDeck(req({ colors: colors as BuildRequest["colors"] }));
      const total = deck.cards.reduce((sum, c) => sum + c.quantity, 0);
      expect(total, `colors=${colors.join("")}`).toBe(99);
    }
  });

  it("only fills basics that match the requested colours", () => {
    const deck = mockDeck(req({ colors: ["U", "B"] }));
    const basics = deck.cards
      .filter((c) => ["Plains", "Island", "Swamp", "Mountain", "Forest"].includes(c.name))
      .map((c) => c.name);
    expect(basics).toContain("Island");
    expect(basics).toContain("Swamp");
    expect(basics).not.toContain("Plains");
    expect(basics).not.toContain("Mountain");
    expect(basics).not.toContain("Forest");
  });

  it("uses Wastes for a colourless request", () => {
    const deck = mockDeck(req({ colors: ["C"] }));
    expect(deck.cards.some((c) => c.name === "Wastes")).toBe(true);
  });

  it("never emits a zero-quantity entry", () => {
    const deck = mockDeck(req({ colors: ["W", "U", "B", "R", "G"] }));
    expect(deck.cards.every((c) => c.quantity > 0)).toBe(true);
  });
});
