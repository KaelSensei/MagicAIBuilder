import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { TournamentDeckRow } from "./MetaPanel";
import type { TournamentDeck } from "@/lib/meta/fetch";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { readonly href: string; readonly children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
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
      screen.getByText("Roméo Vincent · Open Qualifier DC @ Pisany (France) · 2024-05-05")
    ).toBeInTheDocument();
    expect(screen.getByText("Duel Commander")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", deck.url);
  });

  it("omits the placement badge and format line when the source has none", () => {
    render(<TournamentDeckRow deck={{ name: "Deck", url: "https://x", source: "mtgdecks" }} />);
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    expect(screen.queryByText("Duel Commander")).not.toBeInTheDocument();
  });
});
