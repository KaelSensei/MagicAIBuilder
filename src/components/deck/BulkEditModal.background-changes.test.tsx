/**
 * Bulk Edit while the deck changes behind the open dialog.
 *
 * The store replaces the deck object whenever a save answers with the deck's
 * new version or a queued row write settles. The dialog renders over the deck
 * the store holds, as the builder page does, so these tests change the store
 * and read the text box the player types into. No request is sent.
 */
import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useDeckStore } from "@/lib/deck/store";
import type { Deck } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { renderWithProviders } from "@/test/render";
import { BulkEditModal } from "./BulkEditModal";

/** What the player typed over the deck's list. */
const TYPED = "1 Sol Ring\n4 Forest";

const SWORDS = aDeckCard({
  id: "swords-row",
  name: "Swords to Plowshares",
  category: "removal",
});

/** The deck the player has open: two ramp cards and some Forests, no commander. */
function openDeck(): void {
  useDeckStore.setState({
    decks: {
      "deck-1": aDeck({
        version: 7,
        cards: [
          aDeckCard({ id: "sol-ring-row", name: "Sol Ring", category: "ramp" }),
          aDeckCard({
            id: "signet-row",
            name: "Arcane Signet",
            category: "ramp",
          }),
          aDeckCard({
            id: "forest-row",
            name: "Forest",
            typeLine: "Basic Land — Forest",
            category: "land",
            quantity: 10,
          }),
        ],
      }),
    },
    activeDeckId: "deck-1",
    undoStack: [],
  });
}

/** Replaces the open deck with a new object, as the store does after a write. */
function changeDeckInBackground(change: (deck: Deck) => Deck): void {
  act(() => {
    useDeckStore.setState((state) => {
      const deck = state.decks["deck-1"];
      if (!deck) throw new Error("the deck is open");
      return { decks: { ...state.decks, "deck-1": change(deck) } };
    });
  });
}

/** An earlier save answered with the deck's new version: same rows, new object. */
function adoptNextVersion(deck: Deck): Deck {
  return { ...deck, version: (deck.version ?? 0) + 1 };
}

/** A queued card addition settled: the row is in the deck now. */
function addSwords(deck: Deck): Deck {
  return { ...deck, cards: [...deck.cards, SWORDS] };
}

/** The modal over the deck the store holds, as the builder page renders it. */
function BulkEditOpenDeck() {
  const deck = useDeckStore((state) => state.decks["deck-1"]);
  if (!deck) return null;
  return (
    <BulkEditModal deck={deck}>
      <button type="button">Open bulk edit</button>
    </BulkEditModal>
  );
}

/** Opens the dialog and returns its text box. */
function openBulkEdit(): HTMLTextAreaElement {
  fireEvent.click(screen.getByRole("button", { name: "Open bulk edit" }));
  return screen.getByRole<HTMLTextAreaElement>("textbox");
}

describe("BulkEditModal — when the deck changes behind the open dialog", () => {
  beforeEach(() => {
    openDeck();
    renderWithProviders(<BulkEditOpenDeck />);
  });

  it.each([
    ["an earlier save answers with the deck's new version", adoptNextVersion],
    ["a queued card addition settles", addSwords],
  ])("keeps what the player typed when %s", (_change, change) => {
    const textarea = openBulkEdit();
    fireEvent.change(textarea, { target: { value: TYPED } });

    changeDeckInBackground(change);

    expect(textarea).toHaveValue(TYPED);
  });

  it("shows the deck's current rows when a write settles before the player types", () => {
    const textarea = openBulkEdit();

    changeDeckInBackground(addSwords);

    expect(textarea).toHaveDisplayValue(/^1 Swords to Plowshares$/m);
    expect(textarea).toHaveDisplayValue(/^10 Forest$/m);
  });

  it("fills a reopened dialog from the deck as it is then, not from the text typed before", () => {
    fireEvent.change(openBulkEdit(), { target: { value: TYPED } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    changeDeckInBackground(addSwords);

    const reopened = openBulkEdit();

    expect(reopened).toHaveDisplayValue(/^1 Swords to Plowshares$/m);
    expect(reopened).toHaveDisplayValue(/^10 Forest$/m);
  });
});
