import { describe, expect, it } from "vitest";
import { MIN_SEARCH_QUERY_LENGTH } from "@/hooks/useCardSearch";
import { buildInteractionQuery } from "@/lib/scryfall/search";
import { planQuickAddQuery, zoneForQuickAddChord } from "@/lib/search/quick-add-query";

const COMMANDER = { legality: "commander", identityClause: "" };
const SIMIC = { legality: "commander", identityClause: "id<=UG" };

describe("planQuickAddQuery", () => {
  it("searches a card name inside the deck's format", () => {
    expect(planQuickAddQuery({ text: "Sol Ring", reading: "name", scope: COMMANDER })).toEqual({
      kind: "name",
      query: "name:/Sol Ring/ legal:commander",
    });
  });

  it("keeps a name search inside the commander's colour identity", () => {
    expect(planQuickAddQuery({ text: "Sol Ring", reading: "name", scope: SIMIC })).toEqual({
      kind: "name",
      query: "name:/Sol Ring/ legal:commander id<=UG",
    });
  });

  it("plans nothing for a line shorter than the search hook will send", () => {
    const tooShort = "s".repeat(MIN_SEARCH_QUERY_LENGTH - 1);
    expect(planQuickAddQuery({ text: tooShort, reading: "name", scope: COMMANDER }).kind).toBe(
      "idle"
    );
    expect(planQuickAddQuery({ text: "   ", reading: "oracle", scope: SIMIC }).kind).toBe("idle");
  });

  it("reads an exact role word as that role's Scryfall query, in English or French", () => {
    const expected = `${buildInteractionQuery("ramp")} legal:commander id<=UG`;
    expect(planQuickAddQuery({ text: "ramp", reading: "name", scope: SIMIC })).toEqual({
      kind: "role",
      role: "ramp",
      query: expected,
    });
    expect(planQuickAddQuery({ text: "  Rampe  ", reading: "oracle", scope: SIMIC })).toEqual({
      kind: "role",
      role: "ramp",
      query: expected,
    });
  });

  it("does not treat a longer name as a role", () => {
    expect(planQuickAddQuery({ text: "rampant", reading: "name", scope: COMMANDER })).toEqual({
      kind: "name",
      query: "name:/rampant/ legal:commander",
    });
  });

  it("keeps a player's Scryfall line and still applies the deck's colours", () => {
    expect(
      planQuickAddQuery({ text: 'o:"destroy target"', reading: "name", scope: SIMIC })
    ).toEqual({
      kind: "syntax",
      query: 'o:"destroy target" legal:commander id<=UG',
    });
  });

  it("does not add a second legality or a second copy of the identity clause", () => {
    expect(
      planQuickAddQuery({
        text: "t:creature legal:modern id<=UG",
        reading: "name",
        scope: SIMIC,
      })
    ).toEqual({ kind: "syntax", query: "t:creature legal:modern id<=UG" });
  });

  it("reads a sentence as rules text only when that reading is selected", () => {
    expect(
      planQuickAddQuery({ text: "destroy artifacts", reading: "name", scope: COMMANDER })
    ).toEqual({
      kind: "name",
      query: "name:/destroy artifacts/ legal:commander",
    });
    expect(
      planQuickAddQuery({ text: 'destroy "artifacts"', reading: "oracle", scope: COMMANDER })
    ).toEqual({
      kind: "oracle",
      query: 'o:"destroy \\"artifacts\\"" legal:commander',
    });
  });

  it("escapes a slash in a name so the query stays one term", () => {
    expect(planQuickAddQuery({ text: "fire/ice", reading: "name", scope: COMMANDER })).toEqual({
      kind: "name",
      query: "name:/fire\\/ice/ legal:commander",
    });
  });
});

describe("zoneForQuickAddChord", () => {
  it("adds to the main deck on Enter", () => {
    expect(
      zoneForQuickAddChord({ key: "Enter", shiftKey: false, altKey: false, ctrlKey: false, metaKey: false })
    ).toBe("main");
  });

  it("adds to the sideboard on Shift+Enter and to considering on Alt+Enter", () => {
    expect(
      zoneForQuickAddChord({ key: "Enter", shiftKey: true, altKey: false, ctrlKey: false, metaKey: false })
    ).toBe("sideboard");
    expect(
      zoneForQuickAddChord({ key: "Enter", shiftKey: false, altKey: true, ctrlKey: false, metaKey: false })
    ).toBe("maybeboard");
  });

  it("does not add on Ctrl+Enter, on a letter, or when two modifiers are held", () => {
    expect(
      zoneForQuickAddChord({ key: "Enter", shiftKey: false, altKey: false, ctrlKey: true, metaKey: false })
    ).toBeNull();
    expect(
      zoneForQuickAddChord({ key: "k", shiftKey: false, altKey: false, ctrlKey: false, metaKey: false })
    ).toBeNull();
    expect(
      zoneForQuickAddChord({ key: "Enter", shiftKey: true, altKey: true, ctrlKey: false, metaKey: false })
    ).toBeNull();
  });
});
