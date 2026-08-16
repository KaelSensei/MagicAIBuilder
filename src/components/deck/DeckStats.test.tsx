import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { DeckStats } from "./DeckStats";
import messages from "@/messages/en/deck.json";
import type { DeckStats as DeckStatsData } from "@/lib/deck/types";
import type { DeckFormat } from "@/lib/deck/formats";
import type { FormatStats } from "@/lib/deck/format-stats";
import type { ManaAlignment } from "@/lib/deck/mana-alignment";
import type { TurnOnePlayability } from "@/lib/deck/turn-one";

// Pulls live price from the store; irrelevant to what is asserted here.
vi.mock("./DeckPriceDisplay", () => ({ DeckPriceDisplay: () => null }));

function makeFormatStats(overrides: Partial<FormatStats> = {}): FormatStats {
  return {
    threats: 20,
    threatDensity: 0.4,
    interaction: 10,
    interactionRatio: 0.2,
    curveStatus: "on-target",
    threatStatus: "on-target",
    interactionStatus: "on-target",
    avgCmcTarget: [1.7, 2.8],
    threatDensityTarget: [0.3, 0.55],
    interactionRatioTarget: [0.15, 0.35],
    ...overrides,
  };
}

function makeAlignment(overrides: Partial<ManaAlignment> = {}): ManaAlignment {
  return {
    colors: [
      {
        color: "U",
        pips: 30,
        pipShare: 1,
        sources: 20,
        sourceShare: 1,
        gap: 0,
        status: "aligned",
        recommendedSources: 20,
      },
    ],
    totalPips: 30,
    totalSources: 20,
    colorlessSources: 0,
    isAligned: true,
    ...overrides,
  };
}

function makeStats(overrides: Partial<DeckStatsData> = {}): DeckStatsData {
  return {
    totalCards: 100,
    lands: 37,
    creatures: 25,
    ramp: 10,
    draw: 10,
    removal: 8,
    boardWipes: 3,
    avgCmc: 3.1,
    manaCurve: { 1: 5, 2: 15, 3: 20 },
    colorDistribution: { U: 30 },
    gameChangersCount: 0,
    gameChangersList: [],
    totalPrice: 100,
    overBudgetCards: [],
    bannedCards: [],
    colorIdentityViolations: [],
    flexibleLands: 0,
    formatStats: null,
    manaAlignment: null,
    turnOnePlayability: null,
    ...overrides,
  };
}

function renderStats(stats: DeckStatsData | null, format: DeckFormat = "commander") {
  return render(
    <NextIntlClientProvider locale="en" messages={{ deck: messages }}>
      <DeckStats stats={stats} format={format} targetBracket={3} />
    </NextIntlClientProvider>
  );
}

describe("DeckStats", () => {
  it("prompts to build a deck when there are no stats", () => {
    renderStats(null);
    expect(screen.getByText(/build your deck to see stats/i)).toBeDefined();
  });

  describe("Commander", () => {
    it("counts cards against the 100-card deck size", () => {
      renderStats(makeStats());
      expect(screen.getByText("100/100")).toBeDefined();
    });

    it("shows the bracket benchmarks", () => {
      renderStats(makeStats());
      expect(screen.getByText("Ramp")).toBeDefined();
      expect(screen.getByText("Card draw")).toBeDefined();
    });

    it("shows no format panel — bracket scoring covers it", () => {
      renderStats(makeStats());
      expect(screen.queryByText(/Commander Checks/i)).toBeNull();
    });
  });

  describe("non-Commander formats", () => {
    it("counts cards against the format's deck size, not Commander's 100", () => {
      renderStats(makeStats({ totalCards: 60 }), "modern");
      expect(screen.getByText("60/60")).toBeDefined();
    });

    // Bracket targets are Commander's; a Modern deck was showing "target for B3".
    it("hides the bracket benchmarks", () => {
      renderStats(makeStats({ totalCards: 60 }), "modern");
      expect(screen.queryByText("Ramp")).toBeNull();
      expect(screen.queryByText(/target for B3/i)).toBeNull();
    });

    it("shows the format panel headed by the format name", () => {
      renderStats(
        makeStats({ totalCards: 60, formatStats: makeFormatStats() }),
        "modern"
      );
      expect(screen.getByText("Modern Checks")).toBeDefined();
    });

    it("renders threat and interaction counts with their share of non-lands", () => {
      renderStats(
        makeStats({ totalCards: 60, formatStats: makeFormatStats() }),
        "modern"
      );
      expect(screen.getByText("20 · 40%")).toBeDefined();
      expect(screen.getByText("10 · 20%")).toBeDefined();
    });

    it("shows the format's own curve band", () => {
      renderStats(
        makeStats({ totalCards: 60, formatStats: makeFormatStats() }),
        "modern"
      );
      expect(screen.getByText("1.7–2.8")).toBeDefined();
    });

    it("rounds shares to whole percentages", () => {
      renderStats(
        makeStats({
          totalCards: 60,
          formatStats: makeFormatStats({ interaction: 7, interactionRatio: 7 / 36 }),
        }),
        "modern"
      );
      expect(screen.getByText("7 · 19%")).toBeDefined();
    });
  });

  describe("mana alignment", () => {
    /** The alignment card, so colour names can be told apart from ColorDistribution's. */
    function alignmentPanel(): HTMLElement {
      const heading = screen.getByText("Mana Alignment");
      const panel = heading.parentElement;
      if (!panel) throw new Error("mana alignment panel has no container");
      return panel;
    }

    it("stays hidden when there is nothing to align", () => {
      renderStats(makeStats({ manaAlignment: null }));
      expect(screen.queryByText(/mana alignment/i)).toBeNull();
    });

    it("names each colour the deck plays", () => {
      renderStats(makeStats({ manaAlignment: makeAlignment() }));
      // Scoped to the panel: ColorDistribution names the colours too.
      expect(within(alignmentPanel()).getByText("Blue")).toBeDefined();
    });

    it("shows sources against the recommendation and the pip share", () => {
      renderStats(makeStats({ manaAlignment: makeAlignment() }));
      expect(screen.getByText("20/20 sources · 100% of pips")).toBeDefined();
    });

    it("reports the shortfall for an under-supported colour", () => {
      const alignment = makeAlignment({
        colors: [
          {
            color: "W",
            pips: 20,
            pipShare: 0.8,
            sources: 4,
            sourceShare: 0.2,
            gap: -60,
            status: "under",
            recommendedSources: 16,
          },
        ],
        isAligned: false,
      });
      renderStats(makeStats({ manaAlignment: alignment }));
      expect(screen.getByText("4/16 sources · 80% of pips")).toBeDefined();
    });

    it("lists colourless-only lands separately when the deck runs any", () => {
      renderStats(makeStats({ manaAlignment: makeAlignment({ colorlessSources: 3 }) }));
      expect(screen.getByText("Colourless only")).toBeDefined();
    });

    it("omits the colourless row when every land makes coloured mana", () => {
      renderStats(makeStats({ manaAlignment: makeAlignment({ colorlessSources: 0 }) }));
      expect(screen.queryByText("Colourless only")).toBeNull();
    });
  });

  describe("turn 1 playability", () => {
    function makePlayability(
      overrides: Partial<TurnOnePlayability> = {}
    ): TurnOnePlayability {
      return {
        anyPlay: 0.62,
        byColor: [{ color: "G", spells: 8, sources: 24, probability: 0.51 }],
        oneDrops: 8,
        lands: 24,
        deckSize: 60,
        ...overrides,
      };
    }

    it("stays hidden when the deck has no one-drops", () => {
      renderStats(makeStats({ turnOnePlayability: null }));
      expect(screen.queryByText("Turn 1 Playability")).toBeNull();
    });

    it("shows the colour-blind chance as a whole percentage", () => {
      renderStats(makeStats({ turnOnePlayability: makePlayability() }));
      expect(screen.getByText("62%")).toBeDefined();
    });

    it("names the colour on each per-colour row", () => {
      renderStats(makeStats({ turnOnePlayability: makePlayability() }));
      expect(screen.getByText("Green one-drop")).toBeDefined();
    });

    it("counts the one-drops in the footnote, pluralised", () => {
      renderStats(makeStats({ turnOnePlayability: makePlayability({ oneDrops: 1 }) }));
      expect(screen.getByText(/1 one-mana spell\./)).toBeDefined();
    });

    it("renders no colour rows for a deck of colourless one-drops", () => {
      renderStats(makeStats({ turnOnePlayability: makePlayability({ byColor: [] }) }));
      // Anchored to a colour name: "Any one-drop" is the headline, not a row.
      expect(screen.queryByText(/^(White|Blue|Black|Red|Green) one-drop$/)).toBeNull();
      expect(screen.getByText("Any one-drop")).toBeDefined();
    });
  });
});
