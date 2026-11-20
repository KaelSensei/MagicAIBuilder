/**
 * The `/stats` page body (I-60 slice 2, requirements 1.2, 2.1 to 2.4, 3.4,
 * 3.5): captioned tables with a denominator on every figure, links to the
 * decks behind each row, the year picker and a failed load.
 *
 * Sociable: the report comes from the real counting (`buildPlayerStatsReport`
 * over slice 1's `countPlayerStats`); only the network boundary (`fetch`) is
 * stubbed where the browser reads the route.
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlayerStatsDeck } from "@/lib/deck/player-stats";
import {
  buildPlayerStatsReport,
  type PlayerStatsReport,
} from "@/lib/deck/player-stats-report";
import { renderWithProviders } from "@/test/render";
import { PlayerStatsView } from "./PlayerStatsView";

const IN_2026 = new Date("2026-03-01T10:00:00.000Z");

/** One Commander deck created in 2026, green when asked. */
function aStatsDeck(index: number, green: boolean): PlayerStatsDeck {
  return {
    deckId: `deck-${index}`,
    format: "commander",
    commanders: [`Commander ${index}`],
    colorIdentity: green ? ["G"] : ["B"],
    computedBracket: 2,
    targetBracket: 3,
    mainCards: [{ name: "Sol Ring", typeLine: "Artifact" }],
    createdAt: IN_2026,
    updatedAt: new Date("2026-05-01T10:00:00.000Z"),
    snapshotDates: [],
  };
}

/** Twelve Commander decks in 2026, the first seven of them green. */
function twelveDecksSevenGreen(year = 2026): PlayerStatsReport {
  const rows = Array.from({ length: 12 }, (_, index) =>
    aStatsDeck(index, index < 7)
  );
  return buildPlayerStatsReport({
    year,
    years: [2026, 2025],
    decks: rows.map((row) => ({ id: row.deckId, name: `Deck ${row.deckId}` })),
    rows,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PlayerStatsView", () => {
  it("the colours table shows 7 of 12 and links the 7 decks", () => {
    renderWithProviders(
      <PlayerStatsView
        initialReport={twelveDecksSevenGreen()}
        initialYear={2026}
      />
    );

    const table = screen.getByRole("table", {
      name: "Colours in your Commander decks",
    });
    const green = within(table).getByRole("row", { name: /^Green/ });
    expect(within(green).getByText("7 of 12 decks")).toBeVisible();
    const links = within(green).getAllByRole("link");
    expect(links).toHaveLength(7);
    expect(links[0]).toHaveAccessibleName("Deck deck-0");
    expect(links[0]).toHaveAttribute("href", "/builder/deck-0");
  });

  it("shows every section as a captioned table, and changed decks as a floor", () => {
    renderWithProviders(
      <PlayerStatsView
        initialReport={twelveDecksSevenGreen()}
        initialYear={2026}
      />
    );

    const captions = screen
      .getAllByRole("table")
      .map((table) => table.querySelector("caption")?.textContent);
    expect(captions).toEqual([
      "Colours in your Commander decks",
      "Colour identities",
      "Commanders and partner pairs",
      "The ten cards you use most",
      "Cards shared across decks",
      "Brackets",
      "Decks added and changed",
      "Active decks per format",
    ]);
    const activity = screen.getByRole("table", {
      name: "Decks added and changed",
    });
    expect(
      within(activity).getByRole("row", { name: /^Changed/ })
    ).toHaveTextContent("at least 12 of 12 decks");
    expect(screen.getByText(/do not check two-card combos/)).toBeVisible();
  });

  it("asks the route for the year the player picks", async () => {
    const fetchStats = vi.fn(async () =>
      Response.json(twelveDecksSevenGreen(2025))
    );
    vi.stubGlobal("fetch", fetchStats);
    renderWithProviders(
      <PlayerStatsView
        initialReport={twelveDecksSevenGreen()}
        initialYear={2026}
      />
    );

    await userEvent.selectOptions(screen.getByLabelText("Year"), "2025");

    await waitFor(() =>
      expect(fetchStats).toHaveBeenCalledWith("/api/user/stats?year=2025")
    );
    expect(
      await screen.findByRole("heading", { name: "Your decks in 2025" })
    ).toBeVisible();
  });

  it("shows a catalogue message and a retry when the statistics fail to load", async () => {
    const fetchStats = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(Response.json(twelveDecksSevenGreen()));
    vi.stubGlobal("fetch", fetchStats);
    renderWithProviders(
      <PlayerStatsView initialReport={null} initialYear={2026} />
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your statistics could not be loaded."
    );
    expect(screen.queryByText(/500/)).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("table", {
        name: "Colours in your Commander decks",
      })
    ).toBeVisible();
  });
});
