/**
 * Pins the two-card combo floor of bracket scoring, fed from the recorded
 * Commander Spellbook lookup (CMB-01, the combos pilot).
 *
 * Where the rule lives: `scoreBracket` (`bracket.ts`) counts the combos that
 * are flagged infinite and use exactly two named cards; `minimumBracket`
 * (`bracket-floor.ts`) turns a count above zero into a floor, the lowest
 * bracket whose rules allow two-card combos at all; the estimate is the higher
 * of that floor and the heuristic average, capped at 4.
 *
 * The rule is Wizards' Commander Brackets text, not the Comprehensive Rules:
 * Brackets 1 and 2 allow no two-card combos, Bracket 3 none before turn 6, and
 * Brackets 4 and 5 allow them (bracket text of 2025-10-21,
 * https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025,
 * encoded as `twoCardCombos` in `BRACKET_DEFINITIONS`). A list cannot show how
 * early a combo comes up, so the floor is Bracket 3, never 4.
 *
 * The combos reach scoring through `parseFindMyCombos`, as they do in the app,
 * so these tests also pin which Spellbook lines count. CMB-03 replaces the wire
 * type the combos travel in; nothing here names it, so these tests stay as they
 * are apart from import paths.
 */
import { describe, expect, it } from "vitest";
import { FIND_MY_COMBOS_RECORDED } from "@/modules/combos/infrastructure/fixtures/find-my-combos-v1";
import { parseFindMyCombos } from "@/modules/combos/infrastructure/find-my-combos";
import { scoreBracket } from "@/lib/deck/bracket";
import type { Deck } from "@/lib/deck/types";
import type { DeckStats } from "@/lib/deck/analysis-types";

const THORACLE = "742-1295";
const SCEPTER = "4821-5261";
const HULLBREAKER = "513-5034--46";

const COMBO_FLOOR_WARNING =
  "Bracket 3 minimum: Brackets 1–2 allow none, Bracket 3 none before turn 6";

type RecordedVariant =
  (typeof FIND_MY_COMBOS_RECORDED.results.included)[number];

/** Combos parsed from a `find-my-combos` body, as the app parses them. */
function parsed(included: readonly RecordedVariant[]) {
  const combos = parseFindMyCombos({ results: { included } });
  if (!combos) throw new Error("the variants no longer parse");
  return combos;
}

function recordedVariant(id: string): RecordedVariant {
  const found = FIND_MY_COMBOS_RECORDED.results.included.find(
    (variant) => variant.id === id
  );
  if (!found) throw new Error(`variant ${id} is missing from the recording`);
  return found;
}

/** The recorded Thassa's Oracle line, producing only `effect` instead. */
function thoracleProducing(effect: string): RecordedVariant {
  const variant = recordedVariant(THORACLE);
  const [produced] = variant.produces;
  return {
    ...variant,
    produces: [{ ...produced, feature: { ...produced.feature, name: effect } }],
  };
}

/** The recorded Thassa's Oracle line, using the named cards instead. */
function thoracleUsing(cards: readonly string[]): RecordedVariant {
  const variant = recordedVariant(THORACLE);
  const [used] = variant.uses;
  return {
    ...variant,
    uses: cards.map((name) => ({ ...used, card: { ...used.card, name } })),
  };
}

/** An empty Commander deck: scoring reads the combo floor from the combo list. */
function commanderDeck(): Deck {
  return {
    id: "recorded-deck",
    name: "Recorded deck",
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    cardCount: 0,
    targetBracket: 1,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date("2026-11-11T00:00:00Z"),
    updatedAt: new Date("2026-11-11T00:00:00Z"),
  };
}

/** Stats on which every heuristic dimension scores 1, and no Game Changer. */
const EXHIBITION_STATS: DeckStats = {
  totalCards: 100,
  lands: 37,
  creatures: 20,
  ramp: 2,
  draw: 2,
  removal: 2,
  boardWipes: 0,
  avgCmc: 4.5,
  manaCurve: {},
  colorDistribution: {},
  gameChangersCount: 0,
  gameChangersList: [],
  totalPrice: 0,
  overBudgetCards: [],
  bannedCards: [],
  colorIdentityViolations: [],
  commanderRuleIssues: [],
  flexibleLands: 0,
  formatStats: null,
  manaAlignment: null,
  turnOnePlayability: null,
};

function scoreWith(combos?: ReturnType<typeof parsed>) {
  const score = scoreBracket(commanderDeck(), EXHIBITION_STATS, combos);
  if (!score) throw new Error("a Commander deck always gets a bracket score");
  return score;
}

describe("scoreBracket: the two-card combo floor, fed from the recorded Spellbook lookup", () => {
  it("scores the Exhibition-level list at Bracket 1 when Spellbook finds no combo", () => {
    const score = scoreWith(parsed([]));

    expect(score.overall).toBe(1);
    expect(score.twoCardInfiniteCombos).toBe(0);
    expect(score.warnings.join("\n")).not.toContain("2-card combo");
  });

  it("lifts the same list to Bracket 3 with the three two-card combos of the recording, and no higher", () => {
    // The recording also holds an almost-included line (Tainted Pact), which
    // the parser drops, so only the three included lines can count.
    const combos = parseFindMyCombos(FIND_MY_COMBOS_RECORDED);
    if (!combos) throw new Error("the recording no longer parses");

    const score = scoreWith(combos);

    expect(score.twoCardInfiniteCombos).toBe(3);
    expect(score.overall).toBe(3);
    expect(score.warnings).toContain(
      `3 infinite 2-card combos detected — ${COMBO_FLOOR_WARNING}`
    );
  });

  it.each([
    { line: "Oracle + Consultation (wins)", id: THORACLE },
    { line: "Scepter + Reversal (needs mana rocks)", id: SCEPTER },
  ])(
    "counts one recorded line alone as enough for the floor: $line",
    ({ id }) => {
      const score = scoreWith(parsed([recordedVariant(id)]));

      expect(score.twoCardInfiniteCombos).toBe(1);
      expect(score.overall).toBe(3);
      expect(score.warnings).toContain(
        `1 infinite 2-card combo detected — ${COMBO_FLOOR_WARNING}`
      );
    }
  );

  it("currently counts Hullbreaker Horror + Sol Ring as a two-card combo, though Spellbook lists a third piece it needs (pinned; roadmap I-77)", () => {
    const [hullbreaker] = parsed([recordedVariant(HULLBREAKER)]);

    const score = scoreWith([hullbreaker]);

    expect(hullbreaker.cards).toEqual(["Hullbreaker Horror", "Sol Ring"]);
    expect(hullbreaker.prerequisites.otherPieces).toEqual([
      "Permanent Castable for {C}",
    ]);
    expect(score.twoCardInfiniteCombos).toBe(1);
    expect(score.overall).toBe(3);
  });

  it("counts an infinite line that uses exactly two named cards", () => {
    const line = thoracleUsing(["Demonic Consultation", "Thassa's Oracle"]);

    expect(scoreWith(parsed([line])).twoCardInfiniteCombos).toBe(1);
  });

  it.each([
    { cards: ["Thassa's Oracle"] },
    { cards: ["Demonic Consultation", "Thassa's Oracle", "Sol Ring"] },
  ])(
    "does not count an infinite line that uses $cards.length named card(s)",
    ({ cards }) => {
      expect(
        scoreWith(parsed([thoracleUsing(cards)])).twoCardInfiniteCombos
      ).toBe(0);
    }
  );

  /**
   * Which lines count is a keyword match on the names of Spellbook's results
   * (`isInfiniteCombo` in `find-my-combos.ts`). Every name below is a real
   * Spellbook feature, read from https://backend.commanderspellbook.com/features/
   * on 2026-11-11.
   */
  describe("which results read as infinite", () => {
    it.each([
      "Infinite colorless mana",
      "Win the game",
      "Draw all noncreature cards from your library",
      "Near-infinite card draw",
    ])("counts a two-card line producing %s", (effect) => {
      expect(
        scoreWith(parsed([thoracleProducing(effect)])).twoCardInfiniteCombos
      ).toBe(1);
    });

    it.each(["Draw the game", "Opponents skip their draw steps"])(
      "does not count a two-card line producing %s",
      (effect) => {
        expect(
          scoreWith(parsed([thoracleProducing(effect)])).twoCardInfiniteCombos
        ).toBe(0);
      }
    );

    it("currently misses a line producing 'Each opponent loses the game': 'loses' does not match the keyword 'lose the game' (pinned; no B2 row)", () => {
      const score = scoreWith(
        parsed([thoracleProducing("Each opponent loses the game")])
      );

      expect(score.twoCardInfiniteCombos).toBe(0);
      expect(score.overall).toBe(1);
    });

    it("currently counts a line producing 'You can't lose the game due to having 0 or less life' as infinite (pinned; no B2 row)", () => {
      const score = scoreWith(
        parsed([
          thoracleProducing(
            "You can't lose the game due to having 0 or less life"
          ),
        ])
      );

      expect(score.twoCardInfiniteCombos).toBe(1);
      expect(score.overall).toBe(3);
    });
  });

  it("currently scores an omitted combo list as no combo, so a lookup that failed or is still loading drops the floor without saying so (pinned; roadmap I-77)", () => {
    // `useBracketScore` passes `combos ?? []` while `useCombos` has no data.
    const score = scoreWith(undefined);

    expect(score.twoCardInfiniteCombos).toBe(0);
    expect(score.overall).toBe(1);
    expect(score.warnings.join("\n")).not.toMatch(/combo/i);
  });
});
