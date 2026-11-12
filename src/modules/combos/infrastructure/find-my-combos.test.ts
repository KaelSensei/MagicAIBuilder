import { describe, expect, it } from "vitest";
import { FIND_MY_COMBOS_RECORDED } from "@/modules/combos/infrastructure/fixtures/find-my-combos-v1";
import { parseFindMyCombos } from "@/modules/combos/infrastructure/find-my-combos";

function parsedRecording() {
  const combos = parseFindMyCombos(FIND_MY_COMBOS_RECORDED);
  if (!combos) throw new Error("the recorded response no longer parses");
  return combos;
}

function combo(id: string) {
  const found = parsedRecording().find((variant) => variant.id === id);
  if (!found) throw new Error(`combo ${id} is missing`);
  return found;
}

describe("parseFindMyCombos (recorded Spellbook response)", () => {
  it("keeps only the combos the deck holds", () => {
    const ids = parsedRecording().map((variant) => variant.id);

    expect(ids).toHaveLength(3);
    expect(ids).not.toContain("1295-3093"); // Tainted Pact is "almost included": not in the deck
  });

  it("sorts infinite combos first, then the ones needing fewer cards", () => {
    const [variant] = FIND_MY_COMBOS_RECORDED.results.included;
    const card = (name: string) => ({
      ...variant.uses[0],
      card: { ...variant.uses[0].card, name },
    });
    const feature = (name: string) => ({
      ...variant.produces[0],
      feature: { ...variant.produces[0].feature, name },
    });
    const combos = parseFindMyCombos({
      results: {
        included: [
          {
            ...variant,
            id: "draw-3",
            uses: [card("A"), card("B"), card("C")],
            produces: [feature("Draw cards")],
          },
          {
            ...variant,
            id: "draw-2",
            uses: [card("A"), card("B")],
            produces: [feature("Draw cards")],
          },
          {
            ...variant,
            id: "mana-3",
            uses: [card("A"), card("B"), card("C")],
            produces: [feature("Infinite mana")],
          },
        ],
      },
    });

    expect(combos?.map((parsed) => parsed.id)).toEqual([
      "mana-3",
      "draw-2",
      "draw-3",
    ]);
  });

  it("maps a generic extra piece the combo requires", () => {
    const hullbreaker = combo("513-5034--46");

    expect(hullbreaker.cards).toEqual(["Hullbreaker Horror", "Sol Ring"]);
    expect(hullbreaker.prerequisites).toEqual({
      otherPieces: ["Permanent Castable for {C}"],
      conditions: [],
      manaNeeded: "",
    });
  });

  it("maps a notable prerequisite: the third piece a two-card combo hides", () => {
    const scepter = combo("4821-5261");

    expect(scepter.cards).toEqual(["Dramatic Reversal", "Isochron Scepter"]);
    expect(scepter.prerequisites.conditions).toEqual([
      "Nonland permanents you control can tap to produce at least {3}.",
    ]);
    expect(scepter.prerequisites.otherPieces).toEqual([]);
  });

  it("maps the mana a combo needs, and keeps the fields bracket scoring reads", () => {
    const oracle = combo("742-1295");

    expect(oracle.prerequisites.manaNeeded).toBe("{U}{U}{B}");
    expect(oracle.cards).toEqual(["Demonic Consultation", "Thassa's Oracle"]);
    expect(oracle.effects).toEqual(["Exile your library", "Win the game"]);
    expect(oracle.isInfinite).toBe(true);
    expect(oracle.description).toMatch(/^Cast Demonic Consultation/);
  });

  it("splits multi-line prerequisites and lists notable ones before easy ones", () => {
    const [variant] = FIND_MY_COMBOS_RECORDED.results.included;
    const combos = parseFindMyCombos({
      results: {
        included: [
          {
            ...variant,
            notablePrerequisites:
              "Your life total is at least 2.\nYou have at least three devotion to blue.",
            easyPrerequisites: "No two cards in library share a name.\n",
          },
        ],
      },
    });

    expect(combos?.[0].prerequisites.conditions).toEqual([
      "Your life total is at least 2.",
      "You have at least three devotion to blue.",
      "No two cards in library share a name.",
    ]);
  });

  it("falls back to the effects when Spellbook gives no description", () => {
    const [variant] = FIND_MY_COMBOS_RECORDED.results.included;
    const combos = parseFindMyCombos({
      results: { included: [{ ...variant, description: "", notes: "" }] },
    });

    expect(combos?.[0].description).toBe(
      "Infinite colorless mana + Infinite storm count"
    );
  });

  it("refuses a body of another shape", () => {
    expect(parseFindMyCombos({ count: 0, results: [] })).toBeNull();
    expect(parseFindMyCombos(null)).toBeNull();
  });
});
