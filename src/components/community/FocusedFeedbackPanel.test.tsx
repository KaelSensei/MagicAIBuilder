import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FocusedFeedbackPanel } from "./FocusedFeedbackPanel";

const labels = {
  title: "Feedback wanted",
  ownerHint: "Ask one focused question.",
  enable: "Show this request",
  placeholder: "What needs help?",
  save: "Save request",
  saving: "Saving…",
  error: "Could not save.",
};

describe("FocusedFeedbackPanel", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows a focused question to a public visitor", () => {
    render(
      <FocusedFeedbackPanel
        deckId="deck-1"
        isOwner={false}
        initialEnabled
        initialQuestion="Which card should I cut?"
        labels={labels}
      />
    );

    expect(screen.getByText("Which card should I cut?")).toBeVisible();
  });

  it("hides disabled requests from public visitors", () => {
    const { container } = render(
      <FocusedFeedbackPanel
        deckId="deck-1"
        isOwner={false}
        initialEnabled={false}
        initialQuestion="Which card should I cut?"
        labels={labels}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("lets the owner save a focused request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <FocusedFeedbackPanel
        deckId="deck-1"
        isOwner
        initialEnabled={false}
        initialQuestion=""
        labels={labels}
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByPlaceholderText("What needs help?"), {
      target: { value: "  Is the mana base reliable?  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save request" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/decks/deck-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            seekingFeedback: true,
            feedbackQuestion: "Is the mana base reliable?",
          }),
        })
      )
    );
  });
});
