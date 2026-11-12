import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { describe, expect, it } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import { OpeningHandEvidence } from "./OpeningHandEvidence";

function card(typeLine: string, id: string, manaCost = "", cmc = 0): DeckCard {
  return {
    id,
    scryfallId: id,
    name: id,
    quantity: 1,
    category: typeLine.includes("Land") ? "land" : "creature",
    zone: "main",
    manaCost,
    cmc,
    typeLine,
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
  };
}

function renderEvidence(landCount: number) {
  const hand = [
    ...Array.from({ length: landCount }, (_, index) =>
      card("Basic Land — Forest", `land-${index}`)
    ),
    ...Array.from({ length: 7 - landCount }, (_, index) =>
      card("Creature — Elf", `spell-${index}`)
    ),
  ];

  return renderWithIntl(<OpeningHandEvidence hand={hand} />);
}

describe("OpeningHandEvidence", () => {
  it("recommends a mulligan for a land-light opening hand", () => {
    renderEvidence(1);

    expect(screen.getByText("1 land in opening hand")).toBeDefined();
    expect(screen.getByText(/consider a mulligan/i)).toBeDefined();
  });

  it("identifies a balanced opening hand without urging a mulligan", () => {
    renderEvidence(3);

    expect(screen.getByText("3 lands in opening hand")).toBeDefined();
    expect(screen.getByText(/balanced start/i)).toBeDefined();
  });

  it("warns when an affordable spell needs a missing color", () => {
    const hand = [
      card("Basic Land — Forest", "forest-1"),
      card("Basic Land — Forest", "forest-2"),
      card("Basic Land", "wastes"),
      card("Instant", "counterspell", "{U}{U}", 2),
      card("Creature", "spell-1", "{4}", 4),
      card("Creature", "spell-2", "{5}", 5),
      card("Creature", "spell-3", "{6}", 6),
    ];

    renderWithIntl(<OpeningHandEvidence hand={hand} />);

    expect(screen.getByText(/missing blue mana/i)).toBeDefined();
    expect(screen.getByText(/dead opening hand/i)).toBeDefined();
  });
});

// Commander decks get the guide's keep rules instead of the land-only hint.
describe("OpeningHandEvidence with the Commander keep rules", () => {
  const forest = (id: string) => card("Basic Land — Forest", id);
  const cheapRamp = (id: string): DeckCard => ({ ...card("Artifact", id, "{1}", 1), category: "ramp" });
  const spell = (id: string) => card("Creature — Giant", id, "{3}", 3);
  const firstSeven = { mulliganCount: 0, firstMulliganFree: true, cardsToBottom: 0 };

  function renderKeep(
    hand: readonly DeckCard[],
    mulligan = firstSeven,
    bracket: number | null = 2,
    locale: "en" | "fr" = "en"
  ) {
    return renderWithIntl(
      <OpeningHandEvidence hand={hand} keepRules={{ mulligan, bracket }} />,
      { locale }
    );
  }

  it("calls a two-land first seven without cheap ramp a mulligan, with the guide's margin", () => {
    renderKeep([forest("f1"), forest("f2"), ...["a", "b", "c", "d", "e"].map(spell)]);

    expect(screen.getByText("Mulligan")).toBeDefined();
    expect(screen.getByText("Bracket 2, first seven: -8.0% against a fresh seven.")).toBeDefined();
    expect(screen.getByText("No cheap ramp (mana value 2 or less)")).toBeDefined();
    expect(screen.queryByText(/balanced start/i)).toBeNull();
  });

  // The old hint called this hand land-light and urged a mulligan.
  it("keeps one land with two cheap ramp pieces", () => {
    renderKeep([forest("f1"), cheapRamp("sol"), cheapRamp("signet"), ...["a", "b", "c", "d"].map(spell)]);

    expect(screen.getByText("Keep")).toBeDefined();
    expect(screen.getByText("2 cheap ramp pieces (mana value 2 or less)")).toBeDefined();
    expect(screen.queryByText(/consider a mulligan/i)).toBeNull();
  });

  it("explains a coin flip as a judgment call", () => {
    renderKeep([forest("f1"), forest("f2"), forest("f3"), ...["a", "b", "c", "d"].map(spell)]);

    expect(screen.getByText("Judgment call")).toBeDefined();
    expect(screen.getByText("Within ±2%, card quality, colors and the table decide.")).toBeDefined();
  });

  it("judges the free seven against going to six", () => {
    renderKeep(
      [forest("f1"), forest("f2"), ...["a", "b", "c", "d", "e"].map(spell)],
      { mulliganCount: 1, firstMulliganFree: true, cardsToBottom: 0 }
    );

    expect(screen.getByText("Bracket 2, free seven: -1.5% against going to six.")).toBeDefined();
  });

  // Advice for a game without the free mulligan must not claim one.
  it("never mentions a free seven when the first mulligan is not free", () => {
    const { container } = renderKeep(
      [forest("f1"), forest("f2"), ...["a", "b", "c", "d", "e"].map(spell)],
      { mulliganCount: 0, firstMulliganFree: false, cardsToBottom: 0 }
    );

    expect(screen.getByText("Bracket 2, first seven: -1.5% against going to six.")).toBeDefined();
    expect(container.textContent).not.toMatch(/free/i);
  });

  it("says when the guide has no table for the stage", () => {
    renderKeep(
      [forest("f1"), forest("f2"), ...["a", "b", "c", "d"].map(spell)],
      { mulliganCount: 2, firstMulliganFree: true, cardsToBottom: 0 }
    );

    expect(screen.getByText("No computed rule")).toBeDefined();
    expect(
      screen.getByText(
        "The guide publishes keep tables for seven-card hands only; at six cards, judge the hand on its cards."
      )
    ).toBeDefined();
  });

  it("labels every-shell advice as generic when the deck has no bracket", () => {
    renderKeep([forest("f1"), forest("f2"), ...["a", "b", "c", "d", "e"].map(spell)], firstSeven, null);

    expect(screen.getByText("Mulligan")).toBeDefined();
    expect(
      screen.getByText("Two lands and no cheap ramp: mulligan the first seven, in every deck the guide models.")
    ).toBeDefined();
    expect(
      screen.getByText("Generic advice for the first seven: no bracket figure covers this hand.")
    ).toBeDefined();
  });

  it("shows what to bottom instead of a verdict while the bottom choice is pending", () => {
    renderKeep(
      [forest("f1"), forest("f2"), ...["a", "b", "c", "d", "e"].map(spell)],
      { mulliganCount: 2, firstMulliganFree: true, cardsToBottom: 1 }
    );

    expect(screen.getByText(/^What to bottom: the guide's model keeps three lands/)).toBeDefined();
    expect(screen.queryByText("Mulligan")).toBeNull();
  });

  it("gives the advice in French", () => {
    renderKeep([forest("f1"), forest("f2"), ...["a", "b", "c", "d", "e"].map(spell)], firstSeven, 2, "fr");

    expect(screen.getByText("Mulligan")).toBeDefined();
    expect(
      screen.getByText("Bracket 2, première main de sept : -8,0 % par rapport à une nouvelle main de sept.")
    ).toBeDefined();
    expect(screen.getByText("Aucune accélération bon marché (valeur de mana 2 ou moins)")).toBeDefined();
  });
});
