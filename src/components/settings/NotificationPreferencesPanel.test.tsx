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
});
