import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckReportButton } from "./DeckReportButton";

afterEach(() => vi.unstubAllGlobals());

describe("DeckReportButton", () => {
  it("stays hidden for anonymous viewers and deck owners", () => {
    const { unmount } = renderWithIntl(
      <DeckReportButton deckId="deck-1" isSignedIn={false} isOwner={false} />
    );
    expect(screen.queryByRole("button", { name: /report deck/i })).toBeNull();
    unmount();
    renderWithIntl(<DeckReportButton deckId="deck-1" isSignedIn isOwner />);
    expect(screen.queryByRole("button", { name: /report deck/i })).toBeNull();
  });

  it("submits the selected reason and confirms success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    renderWithIntl(<DeckReportButton deckId="deck-1" isSignedIn isOwner={false} />);

    fireEvent.click(screen.getByRole("button", { name: /report deck/i }));
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: "harassment" } });
    fireEvent.click(screen.getByRole("button", { name: /submit report/i }));

    await waitFor(() => expect(screen.getByText(/report submitted/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/community/decks/deck-1/reports",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ reason: "harassment" }) })
    );
  });

  it("keeps the dialog open when submission fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    renderWithIntl(<DeckReportButton deckId="deck-1" isSignedIn isOwner={false} />);
    fireEvent.click(screen.getByRole("button", { name: /report deck/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
    expect(await screen.findByText(/could not submit/i)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
