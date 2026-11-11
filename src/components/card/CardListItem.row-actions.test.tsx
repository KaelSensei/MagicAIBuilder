/**
 * The editing controls on a deck card row: the player reaches each one by its
 * role and name, and using it saves through the deck store.
 *
 * Sociable: the row, its controls and the deck store are the real ones. Only
 * the network is replaced, by a `fetch` stub that records each request to the
 * deck API and answers it as the server would.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";
import { createGuestDeck } from "@/lib/deck/guest-deck";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard } from "@/lib/deck/types";
import { CardListItem } from "./CardListItem";

const DECK_ID = "deck-1";

interface RecordedRequest {
  readonly method: string;
  readonly path: string;
  readonly body: unknown;
}

const requests: RecordedRequest[] = [];

function requestUrl(input: RequestInfo | URL): URL {
  const href = input instanceof Request ? input.url : String(input);
  return new URL(href, "http://localhost");
}

/** Records a deck API request and answers it with a successful empty row. */
async function deckApi(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = requestUrl(input);
  const body: unknown =
    typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
  requests.push({ method: init?.method ?? "GET", path: url.pathname, body });
  return Response.json({ id: "saved-row" });
}

function deckRow(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "row-counterspell",
    scryfallId: "4f616706-ec97-4923-bb1e-11a69fbaa1f8",
    name: "Counterspell",
    manaCost: "{U}{U}",
    cmc: 2,
    typeLine: "Instant",
    oracleText: "Counter target spell.",
    colorIdentity: ["U"],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "instant",
    quantity: 1,
    notes: null,
    zone: "main",
    ...overrides,
  };
}

/** Opens a saved deck holding these rows, so the store saves through the API. */
function openSavedDeck(...cards: DeckCard[]): void {
  useDeckStore.setState({
    decks: {
      [DECK_ID]: {
        ...createGuestDeck(),
        id: DECK_ID,
        name: "Saved Deck",
        cards,
      },
    },
    activeDeckId: DECK_ID,
    isSyncing: false,
  });
}

function storedRow(rowId: string): DeckCard | undefined {
  return useDeckStore
    .getState()
    .decks[DECK_ID]?.cards.find((card) => card.id === rowId);
}

beforeEach(() => {
  requests.length = 0;
  vi.stubGlobal("fetch", vi.fn(deckApi));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("card notes on a deck row", () => {
  it("saves the note the player writes", async () => {
    const user = userEvent.setup();
    const row = deckRow();
    openSavedDeck(row);
    renderWithIntl(<CardListItem card={row} showNotes />);

    await user.click(
      screen.getByRole("button", { name: "Add a note to Counterspell" })
    );
    await user.type(
      screen.getByRole("textbox", { name: "Note on Counterspell" }),
      "Hold up for the combo turn"
    );
    await user.keyboard("{Control>}{Enter}{/Control}");

    await waitFor(() =>
      expect(requests).toEqual([
        {
          method: "PATCH",
          path: `/api/decks/${DECK_ID}/cards/row-counterspell`,
          body: { notes: "Hold up for the combo turn" },
        },
      ])
    );
    expect(storedRow("row-counterspell")?.notes).toBe(
      "Hold up for the combo turn"
    );
  });

  it("clears a note by saving null rather than an empty string", async () => {
    const user = userEvent.setup();
    const row = deckRow({ notes: "Hold up for the combo turn" });
    openSavedDeck(row);
    renderWithIntl(<CardListItem card={row} showNotes />);

    await user.click(
      screen.getByRole("button", { name: "Edit the note on Counterspell" })
    );
    await user.clear(
      screen.getByRole("textbox", { name: "Note on Counterspell" })
    );
    await user.keyboard("{Control>}{Enter}{/Control}");

    await waitFor(() =>
      expect(requests.map((request) => request.body)).toEqual([{ notes: null }])
    );
    expect(storedRow("row-counterspell")?.notes).toBeNull();
  });

  it("cancels on Escape without saving and gives focus back to the note button", async () => {
    const user = userEvent.setup();
    const row = deckRow();
    openSavedDeck(row);
    renderWithIntl(<CardListItem card={row} showNotes />);

    await user.click(
      screen.getByRole("button", { name: "Add a note to Counterspell" })
    );
    await user.type(
      screen.getByRole("textbox", { name: "Note on Counterspell" }),
      "Draft"
    );
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add a note to Counterspell" })
    ).toHaveFocus();
    expect(requests).toEqual([]);
  });

  it("explains the editor's keys in the player's language", async () => {
    const user = userEvent.setup();
    const row = deckRow();
    openSavedDeck(row);
    renderWithIntl(<CardListItem card={row} showNotes />, { locale: "fr" });

    await user.click(
      screen.getByRole("button", { name: "Ajouter une note à Counterspell" })
    );

    expect(
      screen.getByRole("textbox", { name: "Note sur Counterspell" })
    ).toHaveAccessibleDescription(
      "Ctrl+Entrée pour enregistrer · Échap pour annuler"
    );
  });

  it("offers no note on a row that does not show notes", () => {
    const row = deckRow({ zone: "sideboard" });
    openSavedDeck(row);
    renderWithIntl(<CardListItem card={row} />);

    expect(
      screen.queryByRole("button", { name: /note/i })
    ).not.toBeInTheDocument();
  });
});

describe("quantity stepper on a deck row", () => {
  const forest = (quantity: number): DeckCard =>
    deckRow({
      id: "row-forest",
      scryfallId: "b34bb2dc-c1af-4d77-b0b3-a0fb342a5fc6",
      name: "Forest",
      manaCost: "",
      cmc: 0,
      typeLine: "Basic Land — Forest",
      oracleText: "({T}: Add {G}.)",
      colorIdentity: ["G"],
      category: "land",
      quantity,
    });

  it("adds a copy of a basic land", async () => {
    const user = userEvent.setup();
    openSavedDeck(forest(3));
    renderWithIntl(<CardListItem card={forest(3)} />);

    await user.click(
      screen.getByRole("button", { name: "Add a copy of Forest" })
    );

    await waitFor(() =>
      expect(requests).toEqual([
        {
          method: "PATCH",
          path: `/api/decks/${DECK_ID}/cards/row-forest`,
          body: { quantity: 4 },
        },
      ])
    );
    expect(storedRow("row-forest")?.quantity).toBe(4);
  });

  it("removes a copy of a basic land", async () => {
    const user = userEvent.setup();
    openSavedDeck(forest(2));
    renderWithIntl(<CardListItem card={forest(2)} />);

    await user.click(
      screen.getByRole("button", { name: "Remove a copy of Forest" })
    );

    await waitFor(() =>
      expect(requests.map((request) => request.body)).toEqual([{ quantity: 1 }])
    );
    expect(storedRow("row-forest")?.quantity).toBe(1);
  });

  it("never removes the last copy, which the row's remove button does", () => {
    openSavedDeck(forest(1));
    renderWithIntl(<CardListItem card={forest(1)} />);

    expect(
      screen.getByRole("button", { name: "Remove a copy of Forest" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Add a copy of Forest" })
    ).toBeEnabled();
  });

  it("lets a card that allows any number of copies go past four (CR 101.1)", async () => {
    const user = userEvent.setup();
    const rats = deckRow({
      id: "row-rats",
      name: "Relentless Rats",
      typeLine: "Creature — Rat",
      oracleText:
        "Relentless Rats gets +1/+1 for each other creature you control named Relentless Rats.\nA deck can have any number of cards named Relentless Rats.",
      quantity: 12,
    });
    openSavedDeck(rats);
    renderWithIntl(<CardListItem card={rats} />);

    await user.click(
      screen.getByRole("button", { name: "Add a copy of Relentless Rats" })
    );

    await waitFor(() =>
      expect(requests.map((request) => request.body)).toEqual([
        { quantity: 13 },
      ])
    );
  });

  it("stops at the number of copies a card's own text allows", () => {
    const dwarves = deckRow({
      id: "row-dwarves",
      name: "Seven Dwarves",
      typeLine: "Creature — Dwarf",
      oracleText:
        "Seven Dwarves gets +1/+1 for each other creature named Seven Dwarves you control.\nA deck can have up to seven cards named Seven Dwarves.",
      quantity: 7,
    });
    openSavedDeck(dwarves);
    renderWithIntl(<CardListItem card={dwarves} />);

    expect(
      screen.getByRole("button", { name: "Add a copy of Seven Dwarves" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Remove a copy of Seven Dwarves" })
    ).toBeEnabled();
  });

  it("offers no stepper on a singleton card at one copy (CR 903.5b)", () => {
    const solRing = deckRow({
      id: "row-sol-ring",
      name: "Sol Ring",
      typeLine: "Artifact",
      quantity: 1,
    });
    openSavedDeck(solRing);
    renderWithIntl(<CardListItem card={solRing} />);

    expect(
      screen.queryByRole("button", { name: /a copy of Sol Ring/ })
    ).not.toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("lets a singleton imported with extra copies come back down to one", async () => {
    const user = userEvent.setup();
    const solRing = deckRow({
      id: "row-sol-ring",
      name: "Sol Ring",
      typeLine: "Artifact",
      quantity: 2,
    });
    openSavedDeck(solRing);
    renderWithIntl(<CardListItem card={solRing} />);

    expect(
      screen.getByRole("button", { name: "Add a copy of Sol Ring" })
    ).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Remove a copy of Sol Ring" })
    );

    await waitFor(() =>
      expect(requests.map((request) => request.body)).toEqual([{ quantity: 1 }])
    );
  });

  it("names the stepper in the player's language", () => {
    openSavedDeck(forest(3));
    renderWithIntl(<CardListItem card={forest(3)} />, { locale: "fr" });

    expect(
      screen.getByRole("group", { name: "Exemplaires de Forest" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ajouter un exemplaire de Forest" })
    ).toBeEnabled();
  });
});
