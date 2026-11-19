/**
 * The shared deck identity clause, solitary: it is a pure policy over the
 * format table and the rulebreaker table, both real here. The builder page's
 * search-query test covers the name search that adds it; the rulebreaker
 * search-scope test covers the described search.
 */
import { describe, expect, it } from "vitest";
import {
  deckIdentityScopeClause,
  withDeckIdentityScope,
  type DeckIdentityScope,
} from "./deck-identity-scope";

function scope(overrides: Partial<DeckIdentityScope> = {}): DeckIdentityScope {
  return {
    format: "commander",
    enforceColorIdentity: true,
    colorIdentity: ["B", "W"],
    commandZoneNames: ["Teysa Karlov"],
    ...overrides,
  };
}

describe("deckIdentityScopeClause", () => {
  it("writes the command zone's colours in WUBRG order (CR 903.4)", () => {
    expect(
      deckIdentityScopeClause(scope({ colorIdentity: ["G", "B", "U", "W"] }))
    ).toBe("id<=WUBG");
  });

  it("scopes a colourless commander to id<=c", () => {
    expect(deckIdentityScopeClause(scope({ colorIdentity: [] }))).toBe("id<=c");
  });

  it("widens the clause for a rulebreaker in the command zone (CR 903.5e)", () => {
    expect(
      deckIdentityScopeClause(
        scope({ commandZoneNames: ["Seluma, Light of Aysen"] })
      )
    ).toBe("(id<=WB OR t:angel OR t:basic)");
  });

  it("writes nothing before a commander is set", () => {
    expect(
      deckIdentityScopeClause(scope({ enforceColorIdentity: false }))
    ).toBe("");
  });

  it("writes nothing in a format without colour identity", () => {
    expect(deckIdentityScopeClause(scope({ format: "modern" }))).toBe("");
  });
});

describe("withDeckIdentityScope", () => {
  it("adds the clause after the built query", () => {
    expect(withDeckIdentityScope("name:/Sol/ legal:commander", "id<=WB")).toBe(
      "name:/Sol/ legal:commander id<=WB"
    );
  });

  it("leaves the query unchanged when there is no clause", () => {
    expect(withDeckIdentityScope("name:/Sol/ legal:commander", "")).toBe(
      "name:/Sol/ legal:commander"
    );
  });
});
