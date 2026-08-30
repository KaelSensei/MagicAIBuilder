import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { PlaytestHistoryPanel } from "./PlaytestHistoryPanel";
import playtestMessages from "@/messages/en/playtest.json";
import type { PlaytestHistory } from "@/hooks/usePlaytestHistory";
import type { PlaytestSession } from "@/lib/playtest/analytics";
import type { SessionSummary } from "@/lib/playtest/session-input";

const historyResult = vi.hoisted(() => ({
  current: { data: undefined as PlaytestHistory | null | undefined },
}));

vi.mock("@/hooks/usePlaytestHistory", () => ({
  usePlaytestHistory: () => historyResult.current,
}));

function makeSummary(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    total: 6,
    winRate: 50,
    averageWinTurns: 7.5,
    mulligans: { 0: { count: 4, winRate: 75 }, 1: { count: 2, winRate: 0 } },
    matchups: {},
    trend: [],
    ...overrides,
  };
}

function renderPanel(
  summary: SessionSummary | null,
  sessions: readonly PlaytestSession[] = []
) {
  historyResult.current = {
    data: summary === null ? null : { sessions, summary },
  };
  render(
    <NextIntlClientProvider locale="en" messages={{ playtest: playtestMessages }}>
      <PlaytestHistoryPanel deckId="deck-1" />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  historyResult.current = { data: undefined };
});

describe("PlaytestHistoryPanel", () => {
  it("renders nothing while the history is still loading", () => {
    historyResult.current = { data: undefined };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={{ playtest: playtestMessages }}>
        <PlaytestHistoryPanel deckId="deck-1" />
      </NextIntlClientProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the deck has never been played", () => {
    // A panel of zeroes would read as "this deck loses every game" rather than
    // "you have not recorded anything yet" — the opposite of the truth.
    renderPanel(makeSummary({ total: 0, winRate: 0, averageWinTurns: 0, mulligans: {} }));
    expect(screen.queryByText("This deck's record")).toBeNull();
  });

  it("renders nothing when the deck is not the caller's", () => {
    renderPanel(null);
    expect(screen.queryByText("This deck's record")).toBeNull();
  });

  it("shows the headline figures", () => {
    renderPanel(makeSummary());
    expect(screen.getByText("6")).toBeDefined();
    expect(screen.getByText("50%")).toBeDefined();
    expect(screen.getByText("7.5")).toBeDefined();
    expect(
      screen.getByText(/self-reported solitaire results, not tournament win rates/i)
    ).toBeDefined();
  });

  it("dashes the win-turn figure when the deck has never won", () => {
    // "0.0 turns to win" would claim a win that never happened.
    renderPanel(makeSummary({ winRate: 0, averageWinTurns: 0 }));
    expect(screen.getByText("—")).toBeDefined();
  });

  it("breaks the record down by mulligan count, fewest first", () => {
    renderPanel(makeSummary());
    expect(screen.getByText("No mulligan")).toBeDefined();
    expect(screen.getByText("1 mulligan")).toBeDefined();
  });

  it("hides the opponent breakdown until a run says who it was against", () => {
    // Every session stores null until the player picks a difficulty; an empty
    // heading with no rows is worse than no section.
    renderPanel(makeSummary({ matchups: {} }));
    expect(screen.queryByText("By opponent")).toBeNull();
  });

  it("breaks the record down by opponent, weakest first", () => {
    renderPanel(
      makeSummary({
        matchups: {
          cedh: { wins: 1, losses: 4, winRate: 20 },
          budget: { wins: 5, losses: 1, winRate: 83 },
        },
      })
    );
    expect(screen.getByText("By opponent")).toBeDefined();
    const labels = screen.getAllByText(/^(Budget|Mid-range|cEDH)$/).map((n) => n.textContent);
    expect(labels).toEqual(["Budget", "cEDH"]);
  });

  it("shows the win-loss split for each opponent", () => {
    renderPanel(makeSummary({ matchups: { budget: { wins: 5, losses: 1, winRate: 83 } } }));
    expect(screen.getByText("5W–1L · 83%")).toBeDefined();
  });

  it("shows recent sessions with their result and run details", () => {
    const session: PlaytestSession = {
      id: "session-1",
      deckId: "deck-1",
      userId: "user-1",
      result: "win",
      turns: 6,
      mulliganCount: 1,
      createdAt: new Date("2026-08-28T12:00:00.000Z"),
    };
    renderPanel(makeSummary(), [session]);
    expect(screen.getByText("Win")).toBeDefined();
    expect(screen.getByText(/Turn 6 · 1 mulligan/)).toBeDefined();
  });

  it("shows the player's evidence note beside the recorded session", () => {
    const session: PlaytestSession = {
      id: "session-note",
      deckId: "deck-1",
      userId: "user-1",
      result: "loss",
      turns: 5,
      mulliganCount: 0,
      notes: "Missed blue mana for three turns.",
      createdAt: new Date("2026-08-28T12:00:00.000Z"),
    };
    renderPanel(makeSummary(), [session]);
    expect(screen.getByText("Missed blue mana for three turns.")).toBeDefined();
  });

  it("shows an unrecognised difficulty as stored rather than dropping it", () => {
    renderPanel(makeSummary({ matchups: { legacy: { wins: 2, losses: 2, winRate: 50 } } }));
    expect(screen.getByText("legacy")).toBeDefined();
  });

  it("declines to call a trend from too little play", () => {
    renderPanel(makeSummary({ trend: [{ date: "2026-08-01", winRate: 50, total: 6 }] }));
    expect(screen.getByText("Too few games")).toBeDefined();
  });

  it("reports a rising win rate as improving", () => {
    renderPanel(
      makeSummary({
        trend: [
          { date: "2026-08-01", winRate: 20, total: 5 },
          { date: "2026-08-02", winRate: 20, total: 5 },
          { date: "2026-08-03", winRate: 80, total: 5 },
          { date: "2026-08-04", winRate: 80, total: 5 },
        ],
      })
    );
    expect(screen.getByText("Improving")).toBeDefined();
  });
});
