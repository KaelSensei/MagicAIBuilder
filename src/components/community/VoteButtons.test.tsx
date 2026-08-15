import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { VoteButtons } from "./VoteButtons";
import messages from "@/messages/en/deck.json";

function renderButtons(props: Partial<Parameters<typeof VoteButtons>[0]> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ deck: messages }}>
      <VoteButtons
        deckId="deck-1"
        score={3}
        viewerVote={null}
        canVote
        {...props}
      />
    </NextIntlClientProvider>
  );
}

function mockVoteResponse(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  });
}

describe("VoteButtons", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockVoteResponse({ score: 4, viewerVote: 1 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows the current score", () => {
    renderButtons();
    expect(screen.getByText("3")).toBeDefined();
  });

  it("marks the viewer's own vote as pressed", () => {
    renderButtons({ viewerVote: 1 });

    expect(screen.getByRole("button", { name: /upvote/i })).toHaveProperty(
      "ariaPressed",
      "true"
    );
    expect(screen.getByRole("button", { name: /downvote/i })).toHaveProperty(
      "ariaPressed",
      "false"
    );
  });

  it("posts an upvote and adopts the returned tally", async () => {
    renderButtons();

    fireEvent.click(screen.getByRole("button", { name: /upvote/i }));

    await waitFor(() => expect(screen.getByText("4")).toBeDefined());
    expect(fetch).toHaveBeenCalledWith(
      "/api/community/decks/deck-1/vote",
      expect.objectContaining({ method: "POST" })
    );
  });

  // Clicking the direction already cast is how every familiar voting UI clears
  // a vote; a separate "remove" control would be redundant.
  it("clears the vote by clicking the direction already cast", async () => {
    vi.stubGlobal("fetch", mockVoteResponse({ score: 2, viewerVote: null }));
    renderButtons({ viewerVote: 1 });

    fireEvent.click(screen.getByRole("button", { name: /upvote/i }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/community/decks/deck-1/vote",
        expect.objectContaining({ method: "DELETE" })
      )
    );
  });

  it("disables both buttons for anonymous visitors", () => {
    renderButtons({ canVote: false });

    expect(screen.getByRole("button", { name: /upvote/i })).toHaveProperty(
      "disabled",
      true
    );
    expect(screen.getByRole("button", { name: /downvote/i })).toHaveProperty(
      "disabled",
      true
    );
  });

  it("sends no request when the viewer cannot vote", () => {
    renderButtons({ canVote: false });

    fireEvent.click(screen.getByRole("button", { name: /upvote/i }));

    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps the previous score when the request fails", async () => {
    vi.stubGlobal("fetch", mockVoteResponse({}, false));
    renderButtons();

    fireEvent.click(screen.getByRole("button", { name: /upvote/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByText("3")).toBeDefined();
  });

  it("survives a network error without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    renderButtons();

    fireEvent.click(screen.getByRole("button", { name: /upvote/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByText("3")).toBeDefined();
  });
});
