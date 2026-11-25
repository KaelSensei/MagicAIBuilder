import React from "react";
import { screen, within, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { renderWithProviders } from "@/test/render";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import {
  divergenceCard,
  RULE_DIVERGENCE_DECK,
  sharedDeckOf,
} from "@/lib/deck/fixtures/rule-divergence-deck";
import type { ApiCard, ApiSharedDeck } from "@/lib/deck/share-types";
import { computeDeckStats } from "@/lib/deck/stats";
import type { Deck } from "@/lib/deck/types";
import { ManaCurve } from "./ManaCurve";
import { ShareDeckView } from "./ShareDeckView";

vi.mock(import("next/navigation"), () => ({
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

const ATRAXA = "d0d33d52-3d28-4635-b985-51e126289259";
const SOL_RING = "fc817e07-c1f3-469f-9cf7-0945dea7400f";

/** A card saved before Scryfall's 2026-10-14 WebP change, with its JPEG URLs. */
function storedCard(
  id: string,
  name: string,
  extra: Partial<ApiCard>
): ApiCard {
  const path = `front/${id[0]}/${id[1]}/${id}.jpg?1599707796`;
  return {
    id: `row-${name}`,
    name,
    manaCost: "",
    cmc: 1,
    typeLine: "Artifact",
    colorIdentity: [],
    imageUri: `https://cards.scryfall.io/normal/${path}`,
    artCropUri: `https://cards.scryfall.io/art_crop/${path}`,
    category: "artifact",
    quantity: 1,
    isCommander: false,
    isPartner: false,
    isGameChanger: false,
    zone: "main",
    ...extra,
  };
}

const deck: ApiSharedDeck = {
  id: "deck-1",
  name: "Superfriends",
  format: "commander",
  targetBracket: 3,
  budget: null,
  cards: [
    storedCard(ATRAXA, "Atraxa", { category: "commander", isCommander: true }),
    storedCard(SOL_RING, "Sol Ring", {}),
  ],
};

describe("ShareDeckView images", () => {
  // Scryfall retires the art_crop JPEG on 2027-01-01.
  it("draws stored JPEG art crops and card images from Scryfall's WebP versions", () => {
    const { container } = renderWithIntl(<ShareDeckView deck={deck} />, {
      locale: "en",
    });
    const html = container.innerHTML;

    expect(html).toContain(
      `https://cards.scryfall.io/art/front/d/0/${ATRAXA}.webp?1599707796`
    );
    expect(html).toContain(
      `https://cards.scryfall.io/art/front/f/c/${SOL_RING}.webp?1599707796`
    );
    expect(html).toContain(
      `https://cards.scryfall.io/grid/front/f/c/${SOL_RING}.webp?1599707796`
    );
    expect(html).not.toMatch(/cards\.scryfall\.io\/(art_crop|normal)\//);
  });
});

// ─── The mana curve: the builder's chart, read-only (I-37) ─────────────────────

/** Two Islands, a creature and an instant at mana value 2: medians 2 and 1, total 4. */
const TWO_DROP_DECK = aDeck({
  cards: [
    aDeckCard({
      id: "bears",
      name: "Grizzly Bears",
      manaCost: "{1}{G}",
      cmc: 2,
      typeLine: "Creature — Bear",
      colorIdentity: ["G"],
      category: "creature",
    }),
    aDeckCard({
      id: "counterspell",
      name: "Counterspell",
      manaCost: "{U}{U}",
      cmc: 2,
      typeLine: "Instant",
      colorIdentity: ["U"],
      category: "removal",
    }),
    aDeckCard({
      id: "island",
      name: "Island",
      typeLine: "Basic Land — Island",
      colorIdentity: ["U"],
      category: "land",
      quantity: 2,
    }),
  ],
});

function renderSharedPage(deck: Deck): RenderResult {
  return renderWithProviders(<ShareDeckView deck={sharedDeckOf(deck)} />);
}

/** The builder's chart for the same deck, as `DeckStats` draws it from `deckAnalysisCards`. */
function renderBuilderChart(deck: Deck): RenderResult {
  const analysisCards = [deck.commander, deck.partner, ...deck.cards].filter(
    (card) => card !== null
  );
  return renderWithProviders(
    <ManaCurve curve={computeDeckStats(deck).manaCurve} cards={analysisCards} />
  );
}

/** The roles of every control that could change a deck: none may sit in a read-only list. */
const EDITING_ROLES = [
  "button",
  "link",
  "textbox",
  "checkbox",
  "spinbutton",
] as const;

/** The mana curve bars that hold cards, as their accessible labels. */
function filledCurveBars(scope: HTMLElement): readonly string[] {
  return within(scope)
    .getAllByRole("button", { name: /^Mana value \d/ })
    .map((bar) => bar.getAttribute("aria-label") ?? "")
    .filter((label) => !label.endsWith("0 permanents, 0 spells"));
}

/** The curve's median line and total mana value line. */
function curveFigures(scope: HTMLElement): readonly (string | null)[] {
  return [
    within(scope).getByText(/^Median /).textContent,
    within(scope).getByText(/^Total mana value /).textContent,
  ];
}

describe("ShareDeckView mana curve", () => {
  it("splits a mana value's bar into permanents and spells and shows the medians and the total mana value", () => {
    renderSharedPage(TWO_DROP_DECK);

    expect(
      screen.getByRole("button", {
        name: "Mana value 2: 1 permanent, 1 spell",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Median 2, or 1 with lands")).toBeInTheDocument();
    expect(screen.getByText("Total mana value 4")).toBeInTheDocument();
  });

  it("lists a mana value's cards on click, with nothing that edits the deck", async () => {
    const user = userEvent.setup();
    renderSharedPage(TWO_DROP_DECK);

    await user.click(
      screen.getByRole("button", { name: "Mana value 2: 1 permanent, 1 spell" })
    );

    const list = screen.getByRole("region", { name: "Mana value 2 · 2 cards" });
    expect(within(list).getByText("Grizzly Bears")).toBeInTheDocument();
    expect(within(list).getByText("Creature — Bear")).toBeInTheDocument();
    expect(within(list).getByText("Counterspell")).toBeInTheDocument();
    expect(within(list).getByText("Instant")).toBeInTheDocument();
    for (const role of EDITING_ROLES) {
      expect(within(list).queryAllByRole(role)).toEqual([]);
    }
  });
});

// ─── Characterization: the shared page's numbers against the analysis ─────────
//
// `ShareDeckView` computes its own stats panel and colour bar from the share
// rows instead of calling `computeDeckStats`, so a player who shares a deck
// sees other numbers than the builder showed. Those figures do not read the
// rows' `zone`, so "Considering" rows count there as main-deck rows. These
// tests render the page for the deck in
// `lib/deck/fixtures/rule-divergence-deck.ts` and pin both answers side by
// side; `lib/deck/rule-divergences.characterization.test.ts` pins the rest.
// B2-41 makes the page use the analysis numbers and flips them. The mana curve
// already draws the builder's chart from the builder's rows, and the Stats
// panel's average mana value reads the builder's rule (I-37), so those tests
// here assert the agreement. They live in this file because rendering the
// page needs the `@/i18n/navigation` stub above, and a new file may not add a
// mock of a repository module (ADR 0005, rule 5).

const DECK = RULE_DIVERGENCE_DECK;

/** The value beside a label in the page's Stats panel. */
function statValue(label: string): string | null {
  const panel = screen.getByRole("heading", { name: "Stats" }).parentElement;
  if (!panel) throw new Error("the Stats panel has no container");
  return within(panel).getByText(label).nextElementSibling?.textContent ?? null;
}

/** The colour bar's segments, as "<colour>: <count>". */
function colourSegments(container: HTMLElement): readonly string[] {
  return [...container.querySelectorAll("[title]")]
    .map((segment) => segment.getAttribute("title") ?? "")
    .filter((title) => /^[WUBRGC]: /.test(title));
}

describe("ShareDeckView against computeDeckStats", () => {
  it("currently counts rows, not copies, for the card total and the land count: 9 and 2 where computeDeckStats counts 24 and 19 (pinned; see B2-41)", () => {
    const stats = computeDeckStats(DECK);

    renderSharedPage(DECK);

    expect(statValue("Total cards")).toBe("9");
    expect(statValue("Lands")).toBe("2");
    expect(screen.getByText("9 cards")).toBeInTheDocument();
    expect(stats.totalCards).toBe(24);
    expect(stats.lands).toBe(19);
  });

  it("draws the builder's mana curve, without the companion or Considering, with the builder's medians and total (I-37)", () => {
    const sharedPage = renderSharedPage(DECK);
    const builderChart = renderBuilderChart(DECK);

    expect(filledCurveBars(sharedPage.container)).toEqual([
      "Mana value 0: 1 permanent, 0 spells",
      "Mana value 3: 1 permanent, 2 spells",
      "Mana value 5: 1 permanent, 0 spells",
    ]);
    expect(filledCurveBars(sharedPage.container)).toEqual(
      filledCurveBars(builderChart.container)
    );
    expect(curveFigures(sharedPage.container)).toEqual([
      "Median 3, or 0 with lands",
      "Total mana value 14",
    ]);
    expect(curveFigures(sharedPage.container)).toEqual(
      curveFigures(builderChart.container)
    );
  });

  it("shows the builder's average mana value in the Stats panel, without the companion or Considering (I-37)", () => {
    const stats = computeDeckStats(DECK);

    renderSharedPage(DECK);

    expect(stats.avgCmc).toBe(2.25);
    expect(statValue("Avg. CMC")).toBe(stats.avgCmc.toFixed(2));
  });

  it("currently draws the colour bar from colour identity, one per row with lands and the command zone, where computeDeckStats counts mana symbols per copy of each nonland card (pinned; see B2-41)", () => {
    const stats = computeDeckStats(DECK);

    const { container } = renderSharedPage(DECK);

    expect(colourSegments(container)).toEqual(["U: 4", "G: 5"]);
    expect(stats.colorDistribution).toEqual({ G: 3, U: 2 });
  });

  it("currently counts the Game Changer and the card-draw row in Considering: 2 each where computeDeckStats counts 1 (pinned; see B2-38, B2-41)", () => {
    const stats = computeDeckStats(DECK);

    renderSharedPage(DECK);

    expect(screen.getByText("2 Game Changers")).toBeInTheDocument();
    expect(statValue("Game Changers")).toBe("2");
    expect(statValue("Card draw")).toBe("2");
    expect(stats.gameChangersCount).toBe(1);
    expect(stats.draw).toBe(1);
  });

  it("draws no bar for a half mana value, as the builder's chart does not: computeDeckStats keeps a 0.5 key no bucket shows, though the median counts it (pinned; see B2-41)", () => {
    // An Un-set card: Scryfall gives Little Girl a mana value of 0.5.
    const halfManaDeck: Deck = {
      ...DECK,
      commander: null,
      companion: null,
      cards: [
        divergenceCard({
          name: "Little Girl",
          manaCost: "{HW}",
          cmc: 0.5,
          typeLine: "Creature — Human Child",
          colorIdentity: ["W"],
          category: "creature",
        }),
      ],
      maybeboard: [],
    };
    const stats = computeDeckStats(halfManaDeck);

    const sharedPage = renderSharedPage(halfManaDeck);
    const builderChart = renderBuilderChart(halfManaDeck);

    expect(filledCurveBars(sharedPage.container)).toEqual([]);
    expect(stats.manaCurve).toEqual({ 0.5: 1 });
    expect(filledCurveBars(builderChart.container)).toEqual([]);
    expect(curveFigures(sharedPage.container)).toEqual([
      "Median 0.5, or 0.5 with lands",
      "Total mana value 0.5",
    ]);
    expect(curveFigures(sharedPage.container)).toEqual(
      curveFigures(builderChart.container)
    );
  });
});
