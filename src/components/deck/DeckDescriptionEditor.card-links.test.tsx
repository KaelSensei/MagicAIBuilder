/**
 * The primer editor's preview resolves `[[Card Name]]` mentions against the deck being built,
 * read from the deck store, and lists the names the deck does not hold.
 *
 * Deck-building context. The store is the real one, seeded with the deck; nothing is saved, so no
 * request leaves the test. The dialog fades in from opacity 0 and jsdom runs no animation, so
 * presence is asserted instead of visibility.
 */
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useDeckStore } from "@/lib/deck/store";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import type { TestLocale } from "@/test/intl-catalogs";
import { renderWithProviders } from "@/test/render";
import { DeckDescriptionEditor } from "./DeckDescriptionEditor";

const DECK_ID = "deck-1";
const editLabel: Readonly<Record<TestLocale, string>> = {
  en: "Edit description",
  fr: "Modifier la description",
};
const SOL_RING_ID = "fc817e07-c1f3-469f-9cf7-0945dea7400f";

beforeEach(() => {
  useDeckStore.setState({
    decks: {
      [DECK_ID]: aDeck({
        id: DECK_ID,
        cards: [
          aDeckCard({
            id: "row-sol-ring",
            name: "Sol Ring",
            scryfallId: SOL_RING_ID,
            imageUri: "https://cards.scryfall.io/normal/front/f/c/sol-ring.jpg",
          }),
        ],
      }),
    },
    activeDeckId: DECK_ID,
  });
});

afterEach(() => {
  useDeckStore.setState(useDeckStore.getInitialState(), true);
});

function openEditorWith(draft: string, locale: TestLocale = "en") {
  renderWithProviders(
    <DeckDescriptionEditor deckId={DECK_ID} description="" />,
    { locale }
  );
  fireEvent.click(screen.getByRole("button", { name: editLabel[locale] }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: draft } });
}

describe("DeckDescriptionEditor card mentions", () => {
  it("links a mention of a deck card in the preview and lists a name outside the deck", () => {
    openEditorWith("Keep [[Sol Ring]], not [[Not In This Deck]].");

    const preview = screen.getByRole("region", { name: "Preview" });
    expect(
      within(preview).getByRole("link", { name: "Sol Ring" })
    ).toHaveAttribute("href", `https://scryfall.com/card/${SOL_RING_ID}`);
    expect(
      within(preview).getByText(/not Not In This Deck\./)
    ).toBeInTheDocument();

    const unresolved = within(preview).getByRole("list", {
      name: "Not in this deck",
    });
    expect(
      within(unresolved)
        .getAllByRole("listitem")
        .map((item) => item.textContent)
    ).toEqual(["Not In This Deck"]);
  });

  it("names the list of unresolved cards in French", () => {
    openEditorWith("[[Pas dans le deck]]", "fr");

    expect(
      screen.getByRole("list", { name: "Pas dans ce deck" })
    ).toBeInTheDocument();
  });

  it("shows no unresolved list when every mention resolves", () => {
    openEditorWith("Keep [[sol ring]].");

    expect(
      screen.queryByRole("list", { name: "Not in this deck" })
    ).not.toBeInTheDocument();
  });

  it("closes an open card preview on Escape and keeps the editor and its draft", async () => {
    const user = userEvent.setup();
    openEditorWith("Keep [[Sol Ring]].");
    const link = screen.getByRole("link", { name: "Sol Ring" });

    await user.click(screen.getByRole("textbox"));
    await user.tab();
    expect(link).toHaveFocus();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("Keep [[Sol Ring]].");
  });
});
