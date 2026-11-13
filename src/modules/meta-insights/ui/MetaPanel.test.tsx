import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import React from "react";
import { MetaPanel } from "./MetaPanel";

const metaAnalysisMocks = vi.hoisted(() => ({
  fetchSource: vi.fn(),
  errorEdhrec: null as string | null,
}));

vi.mock(import("@/modules/meta-insights/client/useMetaAnalysis"), () => ({
  useMetaAnalysis: () => ({
    edhrec: {
      cards: [{ name: "Sol Ring", inclusion: 0.8, sample: { decksWithCard: 80, eligibleDecks: 100 } }],
      _meta: { cached: false, observedAt: "2026-08-29T10:30:00.000Z" },
    },
    tournament: {
      decks: [
        {
          name: "Atraxa spring list",
          url: "https://www.mtgtop8.com/event?e=1",
          source: "mtgtop8",
          date: "2024-05-05",
        },
        {
          name: "Atraxa summer list",
          url: "https://www.mtgtop8.com/event?e=2",
          source: "mtgtop8",
          date: "2024-06-10",
        },
      ],
      _meta: { cached: false, observedAt: "2026-08-28T10:30:00.000Z" },
    },
    isLoadingEdhrec: false,
    isLoadingTournament: false,
    errorEdhrec: metaAnalysisMocks.errorEdhrec,
    errorTournament: null,
    sourceHealth: {
      edhrec: { status: "available", attempts: 1 },
      tournament: { status: "available", attempts: 1 },
    },
    fetchAll: vi.fn(),
    fetchSource: metaAnalysisMocks.fetchSource,
  }),
}));

vi.mock(import("@/modules/meta-insights/client/useMetaShifts"), () => ({
  useMetaShifts: () => ({
    report: null,
    snapshotCount: 0,
    isLoading: false,
    error: null,
    fetchShifts: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock(import("@/i18n/navigation"), () => import("@/test/i18n-navigation-stub"));

describe("MetaPanel", () => {
  it("keeps the recommendation add action visible and touch-friendly without hover", () => {
    renderWithIntl(
      <MetaPanel commanderName="Atraxa" deckCardNames={new Set<string>()} onAddCard={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: /meta analysis/i }));

    const add = screen.getByRole("button", { name: "Add Sol Ring" });
    expect(add).not.toHaveClass("opacity-0");
    expect(add).toHaveClass("h-10", "w-10");
  });

  it("explains when all popular cards are in the deck and restores the list when unfiltered", () => {
    renderWithIntl(
      <MetaPanel commanderName="Atraxa" deckCardNames={new Set(["Sol Ring"])} onAddCard={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: /meta analysis/i }));
    const missingFilter = screen.getByRole("checkbox", { name: "Not in deck" });
    fireEvent.click(missingFilter);

    expect(screen.getByText("All popular cards already in your deck!")).toBeInTheDocument();
    expect(screen.queryByText("Sol Ring")).not.toBeInTheDocument();

    fireEvent.click(missingFilter);
    expect(screen.getByText("Sol Ring")).toBeInTheDocument();
    expect(screen.queryByText("All popular cards already in your deck!")).not.toBeInTheDocument();
  });

  it("shows source observation times beside external recommendation sections", () => {
    renderWithIntl(
      <MetaPanel
        commanderName="Atraxa"
        deckCardNames={new Set<string>()}
        onAddCard={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /meta analysis/i }));

    expect(
      screen.getByText(/source: edhrec.*aug 29, 2026/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/source: mtgtop8 \/ mtgdecks.*aug 28, 2026/i)
    ).toBeInTheDocument();
    expect(screen.getByText("80 / 100 decks")).toBeInTheDocument();
  });

  it("discloses the covered tournament evidence window", () => {
    renderWithIntl(
      <MetaPanel commanderName="Atraxa" deckCardNames={new Set<string>()} onAddCard={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: /meta analysis/i }));

    expect(
      screen.getByText("Tournament evidence: May 5, 2024 – Jun 10, 2024")
    ).toBeInTheDocument();
  });

  it("retries only the failed EDHREC source", () => {
    metaAnalysisMocks.errorEdhrec = "EDHREC is temporarily unavailable";
    renderWithIntl(
      <MetaPanel commanderName="Atraxa" deckCardNames={new Set<string>()} onAddCard={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: /meta analysis/i }));
    const error = screen.getByText("EDHREC is temporarily unavailable");
    const retry = error.parentElement?.querySelector("button");
    expect(retry).not.toBeNull();

    fireEvent.click(retry!);

    expect(metaAnalysisMocks.fetchSource).toHaveBeenCalledWith("edhrec");
    metaAnalysisMocks.errorEdhrec = null;
  });
});
