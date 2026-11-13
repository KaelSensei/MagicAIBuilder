/**
 * Characterization suite of the meta panel, written before its split (master plan MI-05).
 *
 * It pins what the panel shows for each state of its three sources, through the one boundary the
 * split leaves untouched: `fetch` against `GET /api/meta/:slug` and `/history`. No hook is mocked,
 * so the rows, the empty, loading and error states, the source attribution, the shift arrows and
 * values, and the fetch sequence are all asserted as a visitor sees them. Every test must stay green,
 * unchanged, while the rows and the state move to their own files.
 *
 * The one module replaced is `@/i18n/navigation`: next-intl's navigation imports `next/navigation`
 * without an extension, which Vitest cannot load outside a bundler, so every component test uses the
 * shared typed stub (`src/test/i18n-navigation-stub.tsx`). Inlining next-intl in the Vitest config
 * would remove this seam.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import React from "react";
import { MetaPanel } from "./MetaPanel";
import type { MetaShift } from "@/modules/meta-insights/domain/history";

// eslint-disable-next-line no-restricted-syntax -- the one seam left; the header says why and what removes it
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

/** One answer of the meta API: its JSON body and, unless 200, its status. */
interface Served {
  readonly body: unknown;
  readonly status?: number;
}

/** What each of the three requests the panel sends gets back; a promise that never settles keeps a source loading. */
interface MetaApi {
  readonly edhrec?: Served | Promise<Served>;
  readonly tournament?: Served | Promise<Served>;
  readonly history?: Served | Promise<Served>;
}

const NEVER = new Promise<Served>(() => {});

function routeOf(url: string): keyof MetaApi {
  if (url.includes("/history")) return "history";
  return url.includes("source=tournament") ? "tournament" : "edhrec";
}

/** Replaces `fetch` with a stub that answers from `api`, and returns the URLs it was asked for. */
function stubMetaApi(api: MetaApi): () => readonly string[] {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL): Promise<Response> => {
      const served = await (api[routeOf(String(input))] ?? { body: {} });
      return new Response(JSON.stringify(served.body), {
        status: served.status ?? 200,
      });
    }
  );
  vi.stubGlobal("fetch", fetchMock);
  return () => fetchMock.mock.calls.map(([input]) => String(input));
}

const EDHREC = {
  body: {
    cards: [
      {
        name: "Sol Ring",
        inclusion: 0.8,
        sample: { decksWithCard: 80, eligibleDecks: 100 },
      },
      { name: "Arcane Signet", inclusion: 0.65 },
    ],
    _meta: { cached: false, observedAt: "2026-08-29T10:30:00.000Z" },
  },
};

const TOURNAMENT = {
  body: {
    decks: [
      {
        name: "Atraxa spring list",
        player: "Roméo Vincent",
        event: "Open Qualifier",
        date: "2024-05-05",
        placement: "8",
        format: "Duel Commander",
        eventLevel: 2,
        url: "https://www.mtgtop8.com/event?e=1",
        source: "mtgtop8",
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
};

const FOUR_KINDS: readonly MetaShift[] = [
  { kind: "rose", name: "Sol Ring", baseline: 0.7, current: 0.85, delta: 0.15 },
  {
    kind: "steady",
    name: "Command Tower",
    baseline: 0.9,
    current: 0.9,
    delta: 0,
  },
  {
    kind: "fell",
    name: "Rhystic Study",
    baseline: 0.6,
    current: 0.5,
    delta: -0.1,
  },
  { kind: "entered", name: "The One Ring", current: 0.4, deltaAtLeast: 0.05 },
  { kind: "left", name: "Mana Crypt", baseline: 0.42, deltaAtMost: -0.07 },
];

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

const NO_HISTORY: Served = { body: { report: null, snapshotCount: 0 } };

const ALL_SOURCES: MetaApi = {
  edhrec: EDHREC,
  tournament: TOURNAMENT,
  history: historyWith(FOUR_KINDS),
};

function renderPanel(
  commanderName: string | null = "Atraxa, Praetors' Voice",
  { deckCardNames = new Set<string>(), onAddCard = vi.fn() } = {}
) {
  const view = renderWithIntl(
    <MetaPanel
      commanderName={commanderName}
      deckCardNames={deckCardNames}
      onAddCard={onAddCard}
    />
  );
  return { ...view, onAddCard };
}

function expand(): void {
  fireEvent.click(screen.getByRole("button", { name: "Meta Analysis" }));
}

/** The element around `text`; a test that needs it fails plainly when the markup has no parent. */
function rowAround(text: string): HTMLElement {
  const parent = screen.getByText(text).parentElement;
  if (!parent) throw new Error(`No element around "${text}"`);
  return parent;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("MetaPanel before it is expanded", () => {
  it("shows only the collapsed header and requests nothing", () => {
    const requested = stubMetaApi(ALL_SOURCES);
    renderPanel();

    expect(
      screen.getByRole("button", { name: "Meta Analysis" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Popular (EDHRec)")).not.toBeInTheDocument();
    expect(requested()).toEqual([]);
  });

  it("asks the visitor to select a commander when the deck has none, and requests nothing", () => {
    const requested = stubMetaApi(ALL_SOURCES);
    renderPanel(null);
    expand();

    expect(
      screen.getByText("Select a commander to see meta data")
    ).toBeInTheDocument();
    expect(screen.queryByText("Popular (EDHRec)")).not.toBeInTheDocument();
    expect(requested()).toEqual([]);
  });
});

describe("MetaPanel once expanded for a commander", () => {
  it("requests both sources once, then the history only after EDHREC has answered", async () => {
    const requested = stubMetaApi(ALL_SOURCES);
    renderPanel();
    expand();

    expect(requested()).toEqual([
      "/api/meta/atraxa-praetors-voice?source=edhrec",
      "/api/meta/atraxa-praetors-voice?source=tournament",
    ]);
    await screen.findByText("Sol Ring");
    // The history request leaves from an effect that runs after EDHREC's
    // answer renders, so it can land a tick after the card appears.
    await waitFor(() =>
      expect(requested()[2]).toBe(
        "/api/meta/atraxa-praetors-voice/history?days=90"
      )
    );

    fireEvent.click(screen.getByRole("button", { name: "Meta Analysis" }));
    expand();
    expect(requested()).toHaveLength(3);
  });

  it("orders the sections popular cards, meta shifts, competitive decks", async () => {
    stubMetaApi(ALL_SOURCES);
    renderPanel();
    expand();
    await screen.findByText("Sol Ring");

    const titles = screen
      .getAllByText(
        /^(Popular \(EDHRec\)|Meta shifts|Competitive \(Tournaments\))$/
      )
      .map((element) => element.textContent);
    expect(titles).toEqual([
      "Popular (EDHRec)",
      "Meta shifts",
      "Competitive (Tournaments)",
    ]);
  });

  it("links to the community decks and to the commander's EDHREC page under the same slug", async () => {
    stubMetaApi(ALL_SOURCES);
    renderPanel();
    expand();

    const community = screen.getByRole("link", {
      name: "Browse community decks for this commander",
    });
    expect(community).toHaveAttribute(
      "href",
      "/commanders/atraxa-praetors-voice/decks"
    );
    const edhrec = screen.getByRole("link", {
      name: "View this commander on EDHRec",
    });
    expect(edhrec).toHaveAttribute(
      "href",
      "https://edhrec.com/commanders/atraxa-praetors-voice"
    );
    expect(edhrec).toHaveAttribute("target", "_blank");
    expect(edhrec).toHaveAttribute("rel", "noopener noreferrer");
    await screen.findByText("Sol Ring");
  });

  it("refreshes both sources, bypassing the cache, from the Refresh button", async () => {
    const requested = stubMetaApi(ALL_SOURCES);
    renderPanel();
    expand();
    await screen.findByText("Sol Ring");

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(requested().slice(3)).toEqual([
      "/api/meta/atraxa-praetors-voice?source=edhrec&refresh=true",
      "/api/meta/atraxa-praetors-voice?source=tournament&refresh=true",
    ]);
  });

  it("currently keeps the previous commander's cards when the commander changes while open, and refetches only once re-expanded (pinned; see the MI-05 follow-up)", async () => {
    const requested = stubMetaApi(ALL_SOURCES);
    const { rerender } = renderPanel();
    expand();
    await screen.findByText("vs 7/25/2026");

    rerender(
      <MetaPanel
        commanderName="Kenrith, the Returned King"
        deckCardNames={new Set<string>()}
        onAddCard={vi.fn()}
      />
    );

    // The history is asked for the new commander, then discarded by the reset
    // that follows it; the sources are not asked again, so the old cards stay.
    expect(requested().slice(3)).toEqual([
      "/api/meta/kenrith-the-returned-king/history?days=90",
    ]);
    expect(screen.getAllByText("Sol Ring").length).toBeGreaterThan(0);
    expect(await screen.findByText(/^No history yet/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Meta Analysis" }));
    expand();

    expect(requested().slice(4)).toEqual([
      "/api/meta/kenrith-the-returned-king?source=edhrec",
      "/api/meta/kenrith-the-returned-king?source=tournament",
    ]);
    await screen.findByText("vs 7/25/2026");
    expect(requested().at(-1)).toBe(
      "/api/meta/kenrith-the-returned-king/history?days=90"
    );
  });
});

describe("MetaPanel popular cards (EDHREC)", () => {
  it("shows each card's name, rounded inclusion, sample and an add button, and a check once in the deck", async () => {
    stubMetaApi(ALL_SOURCES);
    const { onAddCard } = renderPanel("Atraxa, Praetors' Voice", {
      deckCardNames: new Set(["Arcane Signet"]),
    });
    expand();

    await screen.findByText("Sol Ring");
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("80 / 100 decks")).toBeInTheDocument();
    expect(screen.getByText("Arcane Signet")).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Arcane Signet" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Sol Ring" }));

    expect(onAddCard).toHaveBeenCalledWith("Sol Ring");
    expect(
      screen.queryByRole("button", { name: "Add Sol Ring" })
    ).not.toBeInTheDocument();
    // The card row stays listed (the second "Sol Ring" is its meta-shift line).
    expect(screen.getAllByText("Sol Ring")).toHaveLength(2);
  });

  it("attributes the cards to EDHREC with the observation time, and says when they are stale", async () => {
    stubMetaApi({
      ...ALL_SOURCES,
      edhrec: {
        body: { ...EDHREC.body, _meta: { ...EDHREC.body._meta, stale: true } },
      },
    });
    renderPanel();
    expand();

    expect(
      await screen.findByText(
        /source: edhrec.*last observed aug 29, 2026.*stale/i
      )
    ).toBeInTheDocument();
  });

  it("shows skeleton rows for both sources while they load, and no empty message", () => {
    stubMetaApi({ edhrec: NEVER, tournament: NEVER });
    const { container } = renderPanel();
    expand();

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(7);
    expect(
      screen.queryByText("No EDHRec data for this commander")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("No recent tournament decks found")
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("says when EDHREC lists no card, without the in-deck filter", async () => {
    stubMetaApi({ ...ALL_SOURCES, edhrec: { body: { cards: [] } } });
    renderPanel();
    expand();

    expect(
      await screen.findByText("No EDHRec data for this commander")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Not in deck" })
    ).not.toBeInTheDocument();
  });

  it("shows the EDHREC error with a retry that requests that source alone", async () => {
    const requested = stubMetaApi({
      ...ALL_SOURCES,
      edhrec: {
        body: { error: "EDHREC is temporarily unavailable" },
        status: 503,
      },
    });
    renderPanel();
    expand();

    expect(
      await screen.findByText("EDHREC is temporarily unavailable")
    ).toBeInTheDocument();
    fireEvent.click(
      within(rowAround("EDHREC is temporarily unavailable")).getByRole(
        "button",
        { name: "Refresh" }
      )
    );

    expect(requested().slice(2)).toEqual([
      "/api/meta/atraxa-praetors-voice?source=edhrec",
    ]);
  });
});

describe("MetaPanel meta shifts", () => {
  it("shows the baseline date and one line per movement, with its arrow, value and note, skipping steady cards", async () => {
    stubMetaApi(ALL_SOURCES);
    renderPanel();
    expand();

    await screen.findByText("vs 7/25/2026");
    expect(screen.queryByText("Command Tower")).not.toBeInTheDocument();

    const rose = rowAround("+15 pts");
    expect(rose).toHaveTextContent("Sol Ring");
    expect(rose.querySelector("svg.lucide-arrow-up-right")).not.toBeNull();
    expect(screen.getByText("+15 pts")).toHaveClass("text-green-400");

    const fell = rowAround("-10 pts");
    expect(fell).toHaveTextContent("Rhystic Study");
    expect(fell.querySelector("svg.lucide-arrow-down-right")).not.toBeNull();
    expect(screen.getByText("-10 pts")).toHaveClass("text-red-400");

    const entered = rowAround("≥ +5 pts");
    expect(entered).toHaveTextContent("The One Ring");
    expect(entered).toHaveTextContent("New in the list");
    expect(entered).toHaveAttribute(
      "title",
      "Below the list before, so the rise is a lower bound"
    );
    expect(entered.querySelector("svg.lucide-sparkles")).not.toBeNull();
    expect(screen.getByText("≥ +5 pts")).toHaveClass("text-green-400");

    const left = rowAround("≤ -7 pts");
    expect(left).toHaveTextContent("Mana Crypt");
    expect(left).toHaveTextContent("Out of the list");
    expect(left).toHaveAttribute(
      "title",
      "Below the list now, so the fall is an upper bound"
    );
    expect(left.querySelector("svg.lucide-arrow-down-right")).not.toBeNull();
    expect(screen.getByText("≤ -7 pts")).toHaveClass("text-red-400");
  });

  it("shows at most eight movements, in the report's order", async () => {
    const shifts: MetaShift[] = Array.from({ length: 10 }, (_, index) => ({
      kind: "rose",
      name: `Card ${index + 1}`,
      baseline: 0.5,
      current: 0.6,
      delta: 0.1,
    }));
    stubMetaApi({ ...ALL_SOURCES, history: historyWith(shifts) });
    renderPanel();
    expand();

    await screen.findByText("Card 8");
    expect(screen.getAllByText("+10 pts")).toHaveLength(8);
    expect(screen.getByText("Card 1")).toBeInTheDocument();
    expect(screen.queryByText("Card 9")).not.toBeInTheDocument();
  });

  it("explains that there is no history yet when nothing was recorded", async () => {
    stubMetaApi({ ...ALL_SOURCES, history: NO_HISTORY });
    renderPanel();
    expand();

    expect(await screen.findByText(/^No history yet/)).toBeInTheDocument();
  });

  it("says the commander was recorded once when one snapshot exists", async () => {
    stubMetaApi({
      ...ALL_SOURCES,
      history: { body: { report: null, snapshotCount: 1 } },
    });
    renderPanel();
    expand();

    expect(
      await screen.findByText(/^Recorded once so far/)
    ).toBeInTheDocument();
  });

  it("says nothing moved when the report holds only steady cards", async () => {
    stubMetaApi({ ...ALL_SOURCES, history: historyWith([FOUR_KINDS[1]]) });
    renderPanel();
    expand();

    expect(
      await screen.findByText("Nothing moved by more than a point")
    ).toBeInTheDocument();
    expect(screen.getByText("vs 7/25/2026")).toBeInTheDocument();
  });

  it("shows the shifts error when the history cannot be read", async () => {
    stubMetaApi({
      ...ALL_SOURCES,
      history: { body: { error: "boom" }, status: 500 },
    });
    renderPanel();
    expand();

    expect(
      await screen.findByText("Could not load meta shifts")
    ).toBeInTheDocument();
  });
});

describe("MetaPanel competitive decks (tournaments)", () => {
  it("links each deck to its source page with its placement and event context, and discloses the evidence window", async () => {
    stubMetaApi(ALL_SOURCES);
    renderPanel();
    expand();

    const spring = await screen.findByRole("link", {
      name: /Atraxa spring list/,
    });
    expect(spring).toHaveAttribute("href", "https://www.mtgtop8.com/event?e=1");
    expect(spring).toHaveTextContent("#8");
    expect(spring).toHaveTextContent(
      "Roméo Vincent · Open Qualifier · 2024-05-05"
    );
    expect(spring).toHaveTextContent("Duel Commander");
    expect(
      screen.getByRole("link", { name: /Atraxa summer list/ })
    ).toHaveAttribute("href", "https://www.mtgtop8.com/event?e=2");
    expect(
      screen.getByText(/source: mtgtop8 \/ mtgdecks.*aug 28, 2026/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tournament evidence: May 5, 2024 – Jun 10, 2024")
    ).toBeInTheDocument();
  });

  it("says when no recent tournament deck was found", async () => {
    stubMetaApi({ ...ALL_SOURCES, tournament: { body: { decks: [] } } });
    renderPanel();
    expand();

    expect(
      await screen.findByText("No recent tournament decks found")
    ).toBeInTheDocument();
  });

  it("shows the tournament error with a retry that requests that source alone", async () => {
    const requested = stubMetaApi({
      ...ALL_SOURCES,
      tournament: { body: { error: "MTGTop8 is down" }, status: 503 },
    });
    renderPanel();
    expand();

    await screen.findByText("MTGTop8 is down");
    fireEvent.click(
      within(rowAround("MTGTop8 is down")).getByRole("button", {
        name: "Refresh",
      })
    );

    expect(requested().slice(3)).toEqual([
      "/api/meta/atraxa-praetors-voice?source=tournament",
    ]);
  });
});
