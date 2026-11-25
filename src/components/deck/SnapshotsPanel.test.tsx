/**
 * The deck History panel, `SnapshotsPanel.tsx`: how a player who cannot see the chevron opens and
 * closes the snapshot list, and how each snapshot's card count reads against the deck as it is now.
 * The panel reads the list over `fetch` when it opens; MSW serves it, and any other request fails
 * the test.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { SnapshotsPanel } from "./SnapshotsPanel";
import { setupMsw } from "@/test/msw";
import { renderWithIntl } from "@/test/render-with-intl";
import { renderWithProviders } from "@/test/render";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";

const DECK_ID = "deck-with-history";

/**
 * A 100-card Commander deck held in 70 rows plus its commander: Atraxa, 30 Forests in one row and
 * 69 other single cards. Its title bar reads 100.
 */
const HUNDRED_CARD_DECK = aDeck({
  commander: aDeckCard({ id: "atraxa", name: "Atraxa, Praetors' Voice" }),
  cards: [
    aDeckCard({ id: "forest", name: "Forest", quantity: 30 }),
    ...Array.from({ length: 69 }, (_, index) =>
      aDeckCard({ id: `spell-${index + 1}`, name: `Spell ${index + 1}` })
    ),
  ],
});

/** @returns one snapshot of the deck as the list route answers it, holding `cardCount` cards */
function snapshotHolding(cardCount: number) {
  return {
    id: "snapshot-1",
    name: "Before the cuts",
    commander: "Atraxa, Praetors' Voice",
    cardCount,
    createdAt: "2026-11-09T12:00:00.000Z",
  };
}

const server = setupMsw(
  http.get(`/api/decks/${DECK_ID}/snapshots`, () => HttpResponse.json([]))
);

/** Serves one snapshot holding `cardCount` cards for the rest of the test. */
function serveSnapshotHolding(cardCount: number): void {
  server.use(
    http.get(`/api/decks/${DECK_ID}/snapshots`, () =>
      HttpResponse.json([snapshotHolding(cardCount)])
    )
  );
}

describe("SnapshotsPanel", () => {
  it("opens and closes the snapshot list from a named disclosure button that reports whether the list is open", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <SnapshotsPanel deckId={DECK_ID} currentDeck={HUNDRED_CARD_DECK} />
    );

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
    renderWithIntl(<SnapshotsPanel deckId={DECK_ID} currentDeck={aDeck()} />, {
      locale: "fr",
    });

    expect(
      screen.getByRole("button", { name: "Liste des snapshots" })
    ).toBeDefined();
  });

  // WCAG 2.2 SC 1.3.1 and 4.1.2 (I-04 accessibility bundle 4): a placeholder
  // is not a name, so the snapshot's name field carries its own.
  it("names the snapshot's name field for a screen reader and keeps the example as its placeholder", async () => {
    const user = userEvent.setup();
    renderWithIntl(<SnapshotsPanel deckId={DECK_ID} currentDeck={aDeck()} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByRole("textbox", { name: "Snapshot name" })
    ).toHaveAttribute("placeholder", 'e.g. "v1 budget"');
  });

  it("names the snapshot's name field in French", async () => {
    const user = userEvent.setup();
    renderWithIntl(<SnapshotsPanel deckId={DECK_ID} currentDeck={aDeck()} />, {
      locale: "fr",
    });

    await user.click(screen.getByRole("button", { name: "Sauvegarder" }));

    expect(
      screen.getByRole("textbox", { name: "Nom du snapshot" })
    ).toBeInTheDocument();
  });

  it("reads a snapshot of the deck as 100 cards and shows no difference against the unchanged deck", async () => {
    serveSnapshotHolding(100);
    const user = userEvent.setup();
    renderWithProviders(
      <SnapshotsPanel deckId={DECK_ID} currentDeck={HUNDRED_CARD_DECK} />
    );

    await user.click(screen.getByRole("button", { name: "Snapshot list" }));

    expect(await screen.findByText("100 cards")).toBeDefined();
    expect(screen.queryByText(/^[+-]\d+ cards?$/)).toBeNull();
  });

  it.each([
    [98, "+2 cards"],
    [99, "+1 card"],
    [101, "-1 card"],
  ])(
    "shows what the deck gained or lost since a snapshot of %i cards: %s",
    async (snapshotCount, badge) => {
      serveSnapshotHolding(snapshotCount);
      const user = userEvent.setup();
      renderWithProviders(
        <SnapshotsPanel deckId={DECK_ID} currentDeck={HUNDRED_CARD_DECK} />
      );

      await user.click(screen.getByRole("button", { name: "Snapshot list" }));

      expect(await screen.findByText(badge)).toBeDefined();
    }
  );

  it("writes the card count and the difference in the player's language", async () => {
    serveSnapshotHolding(99);
    const user = userEvent.setup();
    renderWithProviders(
      <SnapshotsPanel deckId={DECK_ID} currentDeck={HUNDRED_CARD_DECK} />,
      { locale: "fr" }
    );

    await user.click(
      screen.getByRole("button", { name: "Liste des snapshots" })
    );

    expect(await screen.findByText("99 cartes")).toBeDefined();
    expect(screen.getByText("+1 carte")).toBeDefined();
  });
});
