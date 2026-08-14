import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import enDeck from "@/messages/en/deck.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href, ...props }, children),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
}));

import { DeckRatingPanel, type DeckRatingsResponse } from "./DeckRatingPanel";

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ deck: enDeck }}>
      {ui}
    </NextIntlClientProvider>
  );
}

const EMPTY_AGGREGATE: DeckRatingsResponse = {
  average: 0,
  count: 0,
  histogram: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  badge: null,
  reviews: [],
  viewerRating: null,
};

function aggregate(overrides: Partial<DeckRatingsResponse> = {}): DeckRatingsResponse {
  return { ...EMPTY_AGGREGATE, ...overrides };
}

/** Resolves every GET with `data`; other verbs resolve OK so a reload follows. */
function mockFetch(data: DeckRatingsResponse) {
  const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
    if (!init?.method || init.method === "GET") {
      return Promise.resolve({ ok: true, status: 200, json: async () => data });
    }
    return Promise.resolve({ ok: true, status: 201, json: async () => ({}) });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const defaultProps = { deckId: "deck-1", isOwner: false, isSignedIn: true };

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DeckRatingPanel", () => {
  it("fetches and shows the aggregate on mount", async () => {
    const fetchMock = mockFetch(
      aggregate({ average: 4.5, count: 12, histogram: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 7 } })
    );
    renderWithIntl(<DeckRatingPanel {...defaultProps} />);

    expect(await screen.findByText(/12 ratings/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/community/decks/deck-1/ratings");
  });

  it("invites the first rating when there are none", async () => {
    mockFetch(aggregate());
    renderWithIntl(<DeckRatingPanel {...defaultProps} />);

    expect(await screen.findByText(/be the first/i)).toBeInTheDocument();
  });

  it("shows the community favourite badge when the API returns it", async () => {
    mockFetch(aggregate({ average: 4.8, count: 10, badge: "highly_rated" }));
    renderWithIntl(<DeckRatingPanel {...defaultProps} />);

    expect(await screen.findByText(/community favourite/i)).toBeInTheDocument();
  });

  it("POSTs the chosen rating and reloads the aggregate", async () => {
    const fetchMock = mockFetch(aggregate({ average: 4, count: 1 }));
    const user = userEvent.setup();
    renderWithIntl(<DeckRatingPanel {...defaultProps} />);

    await user.click(await screen.findByRole("button", { name: /rate 4 stars/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/community/decks/deck-1/ratings",
        expect.objectContaining({ method: "POST", body: JSON.stringify({ rating: 4 }) })
      );
    });
    // One GET on mount, the POST, then a GET to refresh.
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("lets a voter remove their own rating", async () => {
    const fetchMock = mockFetch(aggregate({ average: 3, count: 1, viewerRating: 3 }));
    const user = userEvent.setup();
    renderWithIntl(<DeckRatingPanel {...defaultProps} />);

    await user.click(await screen.findByRole("button", { name: /remove my rating/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/community/decks/deck-1/ratings",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("tells the owner they cannot rate their own deck and hides the input", async () => {
    mockFetch(aggregate({ average: 4, count: 2 }));
    renderWithIntl(<DeckRatingPanel {...defaultProps} isOwner />);

    expect(await screen.findByText(/cannot rate your own deck/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /rate 5 stars/i })).not.toBeInTheDocument();
  });

  it("prompts anonymous viewers to sign in and hides the input", async () => {
    mockFetch(aggregate({ average: 4, count: 2 }));
    renderWithIntl(<DeckRatingPanel {...defaultProps} isSignedIn={false} />);

    expect(await screen.findByText(/sign in to rate/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /rate 5 stars/i })).not.toBeInTheDocument();
  });

  it("submits a written review with title and body", async () => {
    const fetchMock = mockFetch(aggregate({ viewerRating: 5 }));
    const user = userEvent.setup();
    renderWithIntl(<DeckRatingPanel {...defaultProps} />);

    await user.click(await screen.findByRole("button", { name: /write a review/i }));
    await user.type(screen.getByLabelText(/title/i), "Solid build");
    await user.type(screen.getByLabelText(/^review$/i), "Great ramp package");
    await user.click(screen.getByRole("button", { name: /post review/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/community/decks/deck-1/ratings",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            rating: 5,
            title: "Solid build",
            body: "Great ramp package",
          }),
        })
      );
    });
  });

  it("renders existing reviews with their author", async () => {
    mockFetch(
      aggregate({
        average: 5,
        count: 1,
        reviews: [
          {
            id: "r-1",
            userId: "u-2",
            deckId: "deck-1",
            rating: 5,
            title: "Excellent",
            body: "Very tuned",
            helpfulCount: 0,
            createdAt: new Date("2026-08-01"),
            author: { name: "Voter", username: "voter", image: null },
          },
        ],
      })
    );
    renderWithIntl(<DeckRatingPanel {...defaultProps} />);

    expect(await screen.findByText("Excellent")).toBeInTheDocument();
    expect(screen.getByText("Very tuned")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voter" })).toBeInTheDocument();
  });

  it("warns when saving a rating fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        if (!init?.method || init.method === "GET") {
          return Promise.resolve({ ok: true, status: 200, json: async () => aggregate() });
        }
        return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
      })
    );
    const user = userEvent.setup();
    renderWithIntl(<DeckRatingPanel {...defaultProps} />);

    await user.click(await screen.findByRole("button", { name: /rate 5 stars/i }));

    expect(await screen.findByText(/could not save your rating/i)).toBeInTheDocument();
  });
});
