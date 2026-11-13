/**
 * Solitary tests of the meta panel hook (master plan MI-05). The panel suites
 * (`ui/MetaPanel.characterization.test.tsx`, `ui/MetaPanel.test.tsx`) are the
 * contract for what a visitor sees; these pin the hook's own API for its next
 * user, through the fetch boundary the two source hooks read.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MetaShift } from "@/modules/meta-insights/domain/history";
import { useMetaPanel } from "./useMetaPanel";

interface Served {
  readonly body: unknown;
  readonly status?: number;
}

interface MetaApi {
  readonly edhrec?: Served;
  readonly tournament?: Served;
  readonly history?: Served;
}

function routeOf(url: string): keyof MetaApi {
  if (url.includes("/history")) return "history";
  return url.includes("source=tournament") ? "tournament" : "edhrec";
}

/** Replaces `fetch` with a stub that answers from `api`, and returns the URLs it was asked for. */
function stubMetaApi(api: MetaApi): () => readonly string[] {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL): Promise<Response> => {
      const served = api[routeOf(String(input))] ?? { body: {} };
      return new Response(JSON.stringify(served.body), {
        status: served.status ?? 200,
      });
    }
  );
  vi.stubGlobal("fetch", fetchMock);
  return () => fetchMock.mock.calls.map(([input]) => String(input));
}

const CARDS = [
  { name: "Sol Ring", inclusion: 0.8 },
  { name: "Arcane Signet", inclusion: 0.65 },
  { name: "Command Tower", inclusion: 0.9 },
];

const rose = (name: string): MetaShift => ({
  kind: "rose",
  name,
  baseline: 0.5,
  current: 0.6,
  delta: 0.1,
});

const STEADY: MetaShift = {
  kind: "steady",
  name: "Command Tower",
  baseline: 0.9,
  current: 0.9,
  delta: 0,
};

function historyWith(shifts: readonly MetaShift[]): Served {
  return {
    body: {
      report: {
        baselineCapturedOn: "2026-07-25T12:00:00.000Z",
        currentCapturedOn: "2026-08-22T12:00:00.000Z",
        spanDays: 28,
        shifts,
      },
      snapshotCount: 2,
    },
  };
}

const DECKS = {
  body: {
    decks: [
      { name: "Undated", url: "https://x/1", source: "mtgtop8" },
      {
        name: "Summer",
        url: "https://x/2",
        source: "mtgtop8",
        date: "2024-06-10",
      },
      {
        name: "Spring",
        url: "https://x/3",
        source: "mtgtop8",
        date: "2024-05-05",
      },
      {
        name: "Malformed",
        url: "https://x/4",
        source: "mtgtop8",
        date: "May 2024",
      },
    ],
  },
};

const ALL_SOURCES: MetaApi = {
  edhrec: { body: { cards: CARDS } },
  tournament: DECKS,
  history: historyWith([rose("Sol Ring"), STEADY]),
};

function renderPanel(
  commanderName: string | null = "Atraxa, Praetors' Voice",
  deckCardNames: ReadonlySet<string> = new Set()
) {
  return renderHook(() => useMetaPanel(commanderName, deckCardNames));
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useMetaPanel", () => {
  it("starts collapsed and reads nothing until the panel is opened", () => {
    const requested = stubMetaApi(ALL_SOURCES);
    const { result } = renderPanel();

    expect(result.current.expanded).toBe(false);
    expect(result.current.edhrec.cards).toEqual([]);
    expect(requested()).toEqual([]);
  });

  it("opening reads both sources once, and the history once EDHREC has answered", async () => {
    const requested = stubMetaApi(ALL_SOURCES);
    const { result } = renderPanel();

    act(() => result.current.toggleExpanded());

    expect(result.current.expanded).toBe(true);
    expect(result.current.isFetching).toBe(true);
    expect(requested()).toEqual([
      "/api/meta/atraxa-praetors-voice?source=edhrec",
      "/api/meta/atraxa-praetors-voice?source=tournament",
    ]);

    await waitFor(() => expect(result.current.shifts.report).not.toBeNull());
    expect(result.current.isFetching).toBe(false);
    expect(requested()[2]).toBe(
      "/api/meta/atraxa-praetors-voice/history?days=90"
    );

    act(() => result.current.toggleExpanded());
    act(() => result.current.toggleExpanded());
    expect(requested()).toHaveLength(3);
  });

  it("reads the new commander's sources, then its history, when the commander changes while open", async () => {
    const requested = stubMetaApi(ALL_SOURCES);
    const deckCardNames = new Set<string>();
    const initialProps: { readonly commander: string | null } = {
      commander: "Atraxa, Praetors' Voice",
    };
    const { result, rerender } = renderHook(
      ({ commander }: typeof initialProps) =>
        useMetaPanel(commander, deckCardNames),
      { initialProps }
    );
    act(() => result.current.toggleExpanded());
    await waitFor(() => expect(result.current.shifts.report).not.toBeNull());

    rerender({ commander: "Kenrith, the Returned King" });

    expect(result.current.expanded).toBe(true);
    expect(result.current.isFetching).toBe(true);
    expect(result.current.edhrec.cards).toEqual([]);
    expect(result.current.tournament.decks).toEqual([]);
    expect(result.current.shifts.report).toBeNull();
    expect(requested().slice(3)).toEqual([
      "/api/meta/kenrith-the-returned-king?source=edhrec",
      "/api/meta/kenrith-the-returned-king?source=tournament",
    ]);

    await waitFor(() => expect(result.current.shifts.report).not.toBeNull());
    expect(requested().slice(5)).toEqual([
      "/api/meta/kenrith-the-returned-king/history?days=90",
    ]);

    rerender({ commander: null });
    expect(result.current.edhrec.cards).toEqual([]);
    expect(requested()).toHaveLength(6);
  });

  it("does not read for a deck without a commander", () => {
    const requested = stubMetaApi(ALL_SOURCES);
    const { result } = renderPanel(null);

    act(() => result.current.toggleExpanded());

    expect(result.current.expanded).toBe(true);
    expect(requested()).toEqual([]);
  });

  it("hides the deck's own cards only while the missing-only filter is on", async () => {
    stubMetaApi(ALL_SOURCES);
    const { result } = renderPanel(
      "Atraxa, Praetors' Voice",
      new Set(["Sol Ring"])
    );
    act(() => result.current.toggleExpanded());
    await waitFor(() => expect(result.current.edhrec.cards).toHaveLength(3));

    expect(result.current.edhrec.visibleCards.map((card) => card.name)).toEqual(
      ["Sol Ring", "Arcane Signet", "Command Tower"]
    );

    act(() => result.current.edhrec.setShowOnlyMissing(true));
    expect(result.current.edhrec.showOnlyMissing).toBe(true);
    expect(result.current.edhrec.visibleCards.map((card) => card.name)).toEqual(
      ["Arcane Signet", "Command Tower"]
    );

    act(() => result.current.edhrec.setShowOnlyMissing(false));
    expect(result.current.edhrec.visibleCards).toHaveLength(3);
  });

  it("lists the movements without the steady cards, at most eight, in the report's order", async () => {
    const shifts = Array.from({ length: 10 }, (_, index) =>
      rose(`Card ${index + 1}`)
    );
    stubMetaApi({
      ...ALL_SOURCES,
      history: historyWith([shifts[0], STEADY, ...shifts.slice(1)]),
    });
    const { result } = renderPanel();
    act(() => result.current.toggleExpanded());

    await waitFor(() => expect(result.current.shifts.report).not.toBeNull());
    expect(result.current.shifts.movements.map((shift) => shift.name)).toEqual(
      shifts.slice(0, 8).map((shift) => shift.name)
    );
  });

  it("spans the tournament evidence window over the ISO-dated events only", async () => {
    stubMetaApi(ALL_SOURCES);
    const { result } = renderPanel();
    act(() => result.current.toggleExpanded());

    await waitFor(() =>
      expect(result.current.tournament.decks).toHaveLength(4)
    );
    expect(result.current.tournament.evidenceWindow).toEqual({
      start: "2024-05-05",
      end: "2024-06-10",
    });
  });

  it("has no evidence window when no event carries an ISO date", async () => {
    stubMetaApi({
      ...ALL_SOURCES,
      tournament: { body: { decks: [DECKS.body.decks[0]] } },
    });
    const { result } = renderPanel();
    act(() => result.current.toggleExpanded());

    await waitFor(() =>
      expect(result.current.tournament.decks).toHaveLength(1)
    );
    expect(result.current.tournament.evidenceWindow).toBeNull();
  });

  it("refreshes both sources past the cache, and retries one source alone", async () => {
    const requested = stubMetaApi(ALL_SOURCES);
    const { result } = renderPanel();
    act(() => result.current.toggleExpanded());
    await waitFor(() => expect(result.current.shifts.report).not.toBeNull());

    act(() => result.current.refresh());
    expect(requested().slice(3, 5)).toEqual([
      "/api/meta/atraxa-praetors-voice?source=edhrec&refresh=true",
      "/api/meta/atraxa-praetors-voice?source=tournament&refresh=true",
    ]);
    await waitFor(() => expect(result.current.isFetching).toBe(false));

    const before = requested().length;
    act(() => result.current.tournament.retry());
    expect(requested().slice(before)).toEqual([
      "/api/meta/atraxa-praetors-voice?source=tournament",
    ]);
    await waitFor(() => expect(result.current.isFetching).toBe(false));

    const beforeEdhrec = requested().length;
    act(() => result.current.edhrec.retry());
    expect(requested().slice(beforeEdhrec)).toEqual([
      "/api/meta/atraxa-praetors-voice?source=edhrec",
    ]);
    await waitFor(() => expect(result.current.isFetching).toBe(false));
  });

  it("surfaces each source's error and health on its own section", async () => {
    stubMetaApi({
      ...ALL_SOURCES,
      edhrec: {
        body: { error: "EDHREC is temporarily unavailable" },
        status: 503,
      },
    });
    const { result } = renderPanel();
    act(() => result.current.toggleExpanded());

    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(result.current.edhrec.error).toBe(
      "EDHREC is temporarily unavailable"
    );
    expect(result.current.edhrec.health).toEqual({
      status: "unavailable",
      attempts: 1,
    });
    expect(result.current.tournament.error).toBeNull();
    expect(result.current.tournament.health).toEqual({
      status: "available",
      attempts: 1,
    });
    // The history waits for an EDHREC answer that never came.
    expect(result.current.shifts.report).toBeNull();
    expect(result.current.shifts.isLoading).toBe(false);
  });
});
