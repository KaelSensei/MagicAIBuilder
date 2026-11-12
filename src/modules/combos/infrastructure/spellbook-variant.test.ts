/**
 * Solitary tests of `toCombo`, the anti-corruption mapper from Commander
 * Spellbook's `Variant` to the context's `Combo`, over the recorded
 * `find-my-combos` answer (`fixtures/find-my-combos-v1.ts`).
 */
import { describe, expect, it } from "vitest";
import { FIND_MY_COMBOS_RECORDED } from "@/modules/combos/infrastructure/fixtures/find-my-combos-v1";
import { toCombo } from "@/modules/combos/infrastructure/spellbook-variant";

type RecordedVariant =
  (typeof FIND_MY_COMBOS_RECORDED.results.included)[number];

function recordedVariant(id: string): RecordedVariant {
  const found = FIND_MY_COMBOS_RECORDED.results.included.find(
    (variant) => variant.id === id
  );
  if (!found) throw new Error(`variant ${id} is missing from the recording`);
  return found;
}

/** The recorded Thassa's Oracle line, producing the named effects instead. */
function thoracleProducing(...effects: readonly string[]): RecordedVariant {
  const variant = recordedVariant("742-1295");
  const [produced] = variant.produces;
  return {
    ...variant,
    produces: effects.map((name) => ({
      ...produced,
      feature: { ...produced.feature, name },
    })),
  };
}

describe("toCombo (Commander Spellbook variant → Combo)", () => {
  it("maps the Thassa's Oracle line: the cards, the effects, Spellbook's steps and the mana it needs", () => {
    expect(toCombo(recordedVariant("742-1295"))).toEqual({
      id: "742-1295",
      cards: ["Demonic Consultation", "Thassa's Oracle"],
      effects: ["Exile your library", "Win the game"],
      description:
        "Cast Demonic Consultation by paying {B}, naming Thassa's Oracle and thus exiling your library due to you not having a card named Thassa's Oracle in your library.\nCast Thassa's Oracle by paying {U}{U}.\nThassa's Oracle enters the battlefield, causing you to win the game.",
      isInfinite: true,
      prerequisites: {
        otherPieces: [],
        conditions: [],
        manaNeeded: "{U}{U}{B}",
      },
    });
  });

  it("maps the generic third piece of the Hullbreaker Horror line as another piece, not as a card", () => {
    const hullbreaker = toCombo(recordedVariant("513-5034--46"));

    expect(hullbreaker.cards).toEqual(["Hullbreaker Horror", "Sol Ring"]);
    expect(hullbreaker.prerequisites).toEqual({
      otherPieces: ["Permanent Castable for {C}"],
      conditions: [],
      manaNeeded: "",
    });
  });

  it("maps the notable prerequisite of the Isochron Scepter line as a condition", () => {
    const scepter = toCombo(recordedVariant("4821-5261"));

    expect(scepter.cards).toEqual(["Dramatic Reversal", "Isochron Scepter"]);
    expect(scepter.prerequisites.conditions).toEqual([
      "Nonland permanents you control can tap to produce at least {3}.",
    ]);
    expect(scepter.prerequisites.otherPieces).toEqual([]);
  });

  it("lists one prerequisite per line, notable ones before easy ones, without blanks or duplicates", () => {
    const variant = {
      ...recordedVariant("742-1295"),
      notablePrerequisites:
        "Your life total is at least 2.\n\n  You have at least three devotion to blue.  ",
      easyPrerequisites:
        "No two cards in library share a name.\nYour life total is at least 2.\n",
    };

    expect(toCombo(variant).prerequisites.conditions).toEqual([
      "Your life total is at least 2.",
      "You have at least three devotion to blue.",
      "No two cards in library share a name.",
    ]);
  });

  it("lists each generic piece once, however many times Spellbook requires it", () => {
    const [required] = recordedVariant("513-5034--46").requires;
    const variant = {
      ...recordedVariant("513-5034--46"),
      requires: [required, required],
    };

    expect(toCombo(variant).prerequisites.otherPieces).toEqual([
      "Permanent Castable for {C}",
    ]);
  });

  it("trims the mana Spellbook writes with surrounding spaces", () => {
    const variant = {
      ...recordedVariant("742-1295"),
      manaNeeded: " {U}{U}{B} ",
    };

    expect(toCombo(variant).prerequisites.manaNeeded).toBe("{U}{U}{B}");
  });

  it("describes the combo with Spellbook's notes when it has no steps", () => {
    const variant = {
      ...recordedVariant("742-1295"),
      description: "  ",
      notes: "Consultation must name a card not in the library.",
    };

    expect(toCombo(variant).description).toBe(
      "Consultation must name a card not in the library."
    );
  });

  it("describes the combo by its effects when Spellbook gives neither steps nor notes", () => {
    const variant = {
      ...recordedVariant("513-5034--46"),
      description: "",
      notes: "",
    };

    expect(toCombo(variant).description).toBe(
      "Infinite colorless mana + Infinite storm count"
    );
  });

  describe("which effects read as infinite", () => {
    it.each([
      "Infinite colorless mana",
      "Near-infinite card draw",
      "Unlimited storm count",
      "Win the game",
      "Each opponent will lose the game",
      "Draw all noncreature cards from your library",
      "Kills all creatures",
    ])("flags a combo producing %s as infinite", (effect) => {
      expect(toCombo(thoracleProducing(effect)).isInfinite).toBe(true);
    });

    it("matches the keywords whatever their case", () => {
      expect(toCombo(thoracleProducing("INFINITE MANA")).isInfinite).toBe(true);
    });

    it("flags a combo as infinite when any one of its effects reads so", () => {
      const mixed = thoracleProducing("Draw cards", "Infinite mana");

      expect(toCombo(mixed).isInfinite).toBe(true);
    });

    it.each(["Draw cards", "Draw the game", "Opponents skip their draw steps"])(
      "does not flag a combo producing only %s",
      (effect) => {
        expect(toCombo(thoracleProducing(effect)).isInfinite).toBe(false);
      }
    );

    it("currently misses 'Each opponent loses the game': 'loses' does not contain the keyword 'lose the game' (pinned; no B2 row)", () => {
      expect(
        toCombo(thoracleProducing("Each opponent loses the game")).isInfinite
      ).toBe(false);
    });
  });
});
