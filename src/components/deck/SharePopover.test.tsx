/**
 * The share popover: the one control a player has over a deck's share link.
 *
 * Sociable: the real component, the real clipboard hook and the real catalogs.
 * MSW stands in for `POST` and `DELETE /api/decks/[id]/share` and records what
 * the popover sent, so the tests assert what a player sees and what the server
 * was asked, not how the component is wired.
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { useMsw } from "@/test/msw";
import { SharePopover } from "./SharePopover";

const DECK_ID = "deck-1";
const SHARE_URL = "https://magicaibuilder.test/share/abc123XYZABC";

describe("SharePopover", () => {
  let sent: string[] = [];
  const server = useMsw(
    http.post(`/api/decks/${DECK_ID}/share`, () => {
      sent.push("POST");
      return HttpResponse.json({
        shareUrl: SHARE_URL,
        shareToken: "abc123XYZABC",
      });
    }),
    http.delete(`/api/decks/${DECK_ID}/share`, () => {
      sent.push("DELETE");
      return HttpResponse.json({ success: true });
    })
  );

  beforeEach(() => {
    sent = [];
  });

  it("is reachable as the Share button and opens a dialog named after the deck sharing", async () => {
    renderWithIntl(
      <SharePopover deckId={DECK_ID} initialShareEnabled={false} />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    const dialog = screen.getByRole("dialog", { name: "Share deck" });
    expect(
      within(dialog).getByRole("switch", { name: "Enable sharing" })
    ).not.toBeChecked();
    expect(sent).toEqual([]);
  });

  it("creates a link, copies it and revokes it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderWithIntl(
      <SharePopover deckId={DECK_ID} initialShareEnabled={false} />
    );
    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    await userEvent.click(
      screen.getByRole("switch", { name: "Enable sharing" })
    );
    const link = await screen.findByRole("textbox", { name: "Share link" });
    expect(link).toHaveValue(SHARE_URL);
    expect(
      screen.getByRole("switch", { name: "Disable sharing" })
    ).toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(SHARE_URL));
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("switch", { name: "Disable sharing" })
    );
    await waitFor(() =>
      expect(
        screen.getByRole("switch", { name: "Enable sharing" })
      ).not.toBeChecked()
    );
    expect(
      screen.queryByRole("textbox", { name: "Share link" })
    ).not.toBeInTheDocument();
    expect(sent).toEqual(["POST", "DELETE"]);
  });

  /**
   * The owner's deck tells whether a link is live but never carries the token
   * (`deck-for-viewer.ts` omits it), so the popover recovers the URL through
   * `POST`, which reuses the existing token instead of rotating it.
   */
  it("shows a deck with a live link as shared and recovers the link to copy", async () => {
    renderWithIntl(<SharePopover deckId={DECK_ID} initialShareEnabled />);

    expect(screen.getByRole("button", { name: "Share" })).toHaveTextContent(
      "Public"
    );
    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(
      screen.getByRole("switch", { name: "Disable sharing" })
    ).toBeChecked();
    expect(
      await screen.findByRole("textbox", { name: "Share link" })
    ).toHaveValue(SHARE_URL);
    expect(sent).toEqual(["POST"]);
  });

  it("keeps the link when the server refuses to revoke it", async () => {
    server.use(
      http.delete(`/api/decks/${DECK_ID}/share`, () =>
        HttpResponse.json({ error: "Forbidden" }, { status: 403 })
      )
    );
    renderWithIntl(<SharePopover deckId={DECK_ID} initialShareEnabled />);
    await userEvent.click(screen.getByRole("button", { name: "Share" }));
    await screen.findByRole("textbox", { name: "Share link" });

    await userEvent.click(
      screen.getByRole("switch", { name: "Disable sharing" })
    );

    await waitFor(() =>
      expect(
        screen.getByRole("switch", { name: "Disable sharing" })
      ).toBeEnabled()
    );
    expect(
      screen.getByRole("switch", { name: "Disable sharing" })
    ).toBeChecked();
    expect(screen.getByRole("textbox", { name: "Share link" })).toHaveValue(
      SHARE_URL
    );
  });

  it("closes on Escape and on a click outside", async () => {
    renderWithIntl(
      <div>
        <p>outside</p>
        <SharePopover deckId={DECK_ID} initialShareEnabled={false} />
      </div>
    );
    await userEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(
      screen.getByRole("dialog", { name: "Share deck" })
    ).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Share" }));
    await userEvent.click(screen.getByText("outside"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("speaks French under /fr", async () => {
    renderWithIntl(
      <SharePopover deckId={DECK_ID} initialShareEnabled={false} />,
      {
        locale: "fr",
      }
    );

    await userEvent.click(screen.getByRole("button", { name: "Partager" }));

    expect(
      screen.getByRole("dialog", { name: "Partager le deck" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Activer le partage" })
    ).toBeInTheDocument();
  });
});
