import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { MetaPanel, TournamentDeckRow } from "./MetaPanel";
import type { TournamentDeck } from "@/lib/meta/fetch";
import deckMessages from "@/messages/en/deck.json";

vi.mock("@/hooks/useMetaAnalysis", () => ({
  useMetaAnalysis: () => ({
    edhrec: {
      cards: [{ name: "Sol Ring", inclusion: 0.8 }],
      _meta: { cached: false, observedAt: "2026-08-29T10:30:00.000Z" },
    },
    tournament: {
      decks: [],
      _meta: { cached: false, observedAt: "2026-08-28T10:30:00.000Z" },
    },
    isLoadingEdhrec: false,
    isLoadingTournament: false,
    errorEdhrec: null,
    errorTournament: null,
    fetchAll: vi.fn(),
  }),
}));

vi.mock("@/hooks/useMetaShifts", () => ({
  useMetaShifts: () => ({
    report: null,
    snapshotCount: 0,
    isLoading: false,
    error: null,
    fetchShifts: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
  }: {
    readonly href: string;
    readonly children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const deck: TournamentDeck = {
  name: "Atraxa 7ccm",
  player: "Roméo Vincent",
  event: "Open Qualifier DC @ Pisany (France)",
  date: "2024-05-05",
  placement: "8",
  format: "Duel Commander",
  eventLevel: 2,
  url: "https://www.mtgtop8.com/event?e=55289&d=611376&f=EDH",
  source: "mtgtop8",
};

describe("TournamentDeckRow", () => {
  it("shows the placement, the event context and the source format", () => {
    render(<TournamentDeckRow deck={deck} />);
    expect(screen.getByText("#8")).toBeInTheDocument();
    expect(screen.getByText("#8")).toHaveAttribute("title", "★★");
    expect(screen.getByText("Atraxa 7ccm")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Roméo Vincent · Open Qualifier DC @ Pisany (France) · 2024-05-05"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Duel Commander")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", deck.url);
  });

  it("omits the placement badge and format line when the source has none", () => {
    render(
      <TournamentDeckRow
        deck={{ name: "Deck", url: "https://x", source: "mtgdecks" }}
      />
    );
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    expect(screen.queryByText("Duel Commander")).not.toBeInTheDocument();
  });
});

describe("MetaPanel", () => {
  it("shows source observation times beside external recommendation sections", () => {
    render(
      <NextIntlClientProvider
        locale="en"
        messages={{ deck: deckMessages }}
        timeZone="UTC"
      >
        <MetaPanel
          commanderName="Atraxa"
          deckCardNames={new Set<string>()}
          onAddCard={vi.fn()}
        />
      </NextIntlClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /meta analysis/i }));

    expect(
      screen.getByText(/source: edhrec.*aug 29, 2026/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/source: mtgtop8 \/ mtgdecks.*aug 28, 2026/i)
    ).toBeInTheDocument();
  });
});
