import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { NotificationPreferencesPanel } from "./NotificationPreferencesPanel";

describe("NotificationPreferencesPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads preferences and persists a changed event control", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ replies: true, mentions: true, follows: true, watchedDecks: true }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ replies: false }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    renderWithIntl(<NotificationPreferencesPanel />);

    const replies = await screen.findByRole("checkbox", { name: "Replies" });
    fireEvent.click(replies);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/user/notification-preferences",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ replies: false }),
        })
      );
    });
    expect(replies).not.toBeChecked();
  });

  // B2-13: the route now answers a JSON 500 instead of Next's HTML page when
  // the database fails. The panel treats that body like any failed load.
  it("shows the alert with a retry and disabled controls when the route answers its JSON 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: "Failed to load notification preferences" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    renderWithIntl(<NotificationPreferencesPanel />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Your notification preferences could not be saved."
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(
      screen.queryByText("Failed to load notification preferences")
    ).not.toBeInTheDocument();
    for (const name of [
      "Replies",
      "Mentions",
      "New followers",
      "Watched decks",
    ]) {
      expect(screen.getByRole("checkbox", { name })).toBeDisabled();
    }
  });
});
