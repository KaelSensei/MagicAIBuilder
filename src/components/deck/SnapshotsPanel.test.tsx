/**
 * The deck History panel, `SnapshotsPanel.tsx`: how a player who cannot see the chevron opens and
 * closes the snapshot list. The panel reads the list over `fetch` when it opens; MSW serves it, and
 * any other request fails the test.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { SnapshotsPanel } from "./SnapshotsPanel";
import { setupMsw } from "@/test/msw";
import { renderWithIntl } from "@/test/render-with-intl";

const DECK_ID = "deck-with-history";

setupMsw(
  http.get(`/api/decks/${DECK_ID}/snapshots`, () => HttpResponse.json([]))
);

describe("SnapshotsPanel", () => {
  it("opens and closes the snapshot list from a named disclosure button that reports whether the list is open", async () => {
    const user = userEvent.setup();
    renderWithIntl(<SnapshotsPanel deckId={DECK_ID} currentCardCount={99} />);

    const disclosure = screen.getByRole("button", { name: "Snapshot list" });
    expect(disclosure.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("No snapshots yet. Save one above!")).toBeNull();

    await user.click(disclosure);
    expect(disclosure.getAttribute("aria-expanded")).toBe("true");
    expect(
      await screen.findByText("No snapshots yet. Save one above!")
    ).toBeDefined();

    await user.click(disclosure);
    expect(disclosure.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("No snapshots yet. Save one above!")).toBeNull();
  });

  it("names the disclosure button in the player's language", () => {
    renderWithIntl(<SnapshotsPanel deckId={DECK_ID} currentCardCount={0} />, {
      locale: "fr",
    });

    expect(
      screen.getByRole("button", { name: "Liste des snapshots" })
    ).toBeDefined();
  });
});
