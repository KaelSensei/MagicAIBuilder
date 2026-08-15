import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { DeckStats } from "./DeckStats";
import messages from "@/messages/en/deck.json";
import type { DeckStats as DeckStatsData } from "@/lib/deck/types";
import type { DeckFormat } from "@/lib/deck/formats";
import type { FormatStats } from "@/lib/deck/format-stats";

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
});
