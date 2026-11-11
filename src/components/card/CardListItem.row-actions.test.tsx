/**
 * The editing controls on a deck card row: the player reaches each one by its
 * role and name, and using it saves through the deck store.
 *
 * Sociable: the row, its controls and the deck store are the real ones. Only
 * the network is replaced, by a `fetch` stub that records each request to the
 * deck API and answers it as the server would.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderWithIntl } from "@/test/render-with-intl";
import { createGuestDeck } from "@/lib/deck/guest-deck";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
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

  // Sonar S6819: a native fieldset carries the group role, named as before.
  it("groups the stepper in a native fieldset named after the card", () => {
    openSavedDeck(forest(3));
    renderWithIntl(<CardListItem card={forest(3)} />);

    const stepper = screen.getByRole("group", { name: "Copies of Forest" });
    expect(stepper).toBeInstanceOf(HTMLFieldSetElement);
    expect(stepper).not.toHaveAttribute("role");
    expect(within(stepper).getAllByRole("button")).toHaveLength(2);
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

describe("set as commander on a deck row", () => {
  const atraxa = deckRow({
    id: "row-atraxa",
    scryfallId: "d0d33d52-3d28-4635-b985-51e126289259",
    name: "Atraxa, Praetors' Voice",
    manaCost: "{G}{W}{U}{B}",
    cmc: 4,
    typeLine: "Legendary Creature — Phyrexian Angel Horror",
    oracleText:
      "Flying, vigilance, deathtouch, lifelink\nAt the beginning of your end step, proliferate.",
    colorIdentity: ["W", "U", "B", "G"],
    category: "creature",
  });

  it("makes a legendary creature the commander and takes it out of the deck list", async () => {
    const user = userEvent.setup();
    openSavedDeck(atraxa);
    renderWithIntl(<CardListItem card={atraxa} />);

    await user.click(
      screen.getByRole("button", {
        name: "Set Atraxa, Praetors' Voice as commander",
      })
    );

    await waitFor(() =>
      expect(requests.map(({ method, path }) => `${method} ${path}`)).toEqual([
        `DELETE /api/decks/${DECK_ID}/cards/row-atraxa`,
        `PATCH /api/decks/${DECK_ID}`,
        `POST /api/decks/${DECK_ID}/cards`,
      ])
    );
    expect(requests[1]?.body).toMatchObject({
      commanderId: atraxa.scryfallId,
      commanderName: "Atraxa, Praetors' Voice",
    });
    expect(useDeckStore.getState().decks[DECK_ID]?.commander?.name).toBe(
      "Atraxa, Praetors' Voice"
    );
    expect(storedRow("row-atraxa")).toBeUndefined();
  });

  it("offers it on a card whose text says it can be your commander (CR 903.3a)", () => {
    const grist = deckRow({
      id: "row-grist",
      name: "Grist, the Hunger Tide",
      typeLine: "Legendary Planeswalker — Grist",
      oracleText:
        "Grist, the Hunger Tide can be your commander.\nAs long as Grist isn't on the battlefield, it's a 1/1 Insect creature in addition to its other types.",
      category: "planeswalker",
    });
    openSavedDeck(grist);
    renderWithIntl(<CardListItem card={grist} />, { locale: "fr" });

    expect(
      screen.getByRole("button", {
        name: "Définir Grist, the Hunger Tide comme commandant",
      })
    ).toBeInTheDocument();
  });

  it("offers it only on a card that can be a commander (CR 903.3)", () => {
    const solRing = deckRow({
      id: "row-sol-ring",
      name: "Sol Ring",
      typeLine: "Artifact",
    });
    openSavedDeck(solRing);
    renderWithIntl(<CardListItem card={solRing} />);

    expect(
      screen.queryByRole("button", { name: /as commander/ })
    ).not.toBeInTheDocument();
  });
});

describe("change printing on a deck row", () => {
  const C21_ID = "c21a6e4f-6f1d-4c3d-9a3e-1f2b3c4d5e6f";
  const CMM_ID = "cmm0b2a1-7d3e-4f5a-8b6c-9d0e1f2a3b4c";
  const solRing = deckRow({
    id: "row-sol-ring",
    scryfallId: C21_ID,
    name: "Sol Ring",
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Artifact",
    oracleText: "{T}: Add {C}{C}.",
    colorIdentity: [],
    category: "ramp",
    imageUri: `https://cards.scryfall.io/grid/front/c/2/${C21_ID}.webp`,
  });

  function printing(id: string, set: string, setName: string): ScryfallCard {
    return {
      id,
      name: "Sol Ring",
      mana_cost: "{1}",
      cmc: 1,
      type_line: "Artifact",
      oracle_text: "{T}: Add {C}{C}.",
      color_identity: [],
      set,
      set_name: setName,
      lang: "en",
      image_uris: {
        grid: `https://cards.scryfall.io/grid/front/c/x/${id}.webp`,
        art: `https://cards.scryfall.io/art/front/c/x/${id}.webp`,
      },
    };
  }

  /** Answers Scryfall's printing search with two printings; the deck API as usual. */
  async function scryfallAndDeckApi(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = requestUrl(input);
    if (url.hostname !== "api.scryfall.com") return deckApi(input, init);
    const data = [
      printing(CMM_ID, "cmm", "Commander Masters"),
      printing(C21_ID, "c21", "Commander 2021"),
    ];
    return Response.json({
      object: "list",
      total_cards: data.length,
      has_more: false,
      data,
    });
  }

  function renderRow(locale: "en" | "fr" = "en") {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return renderWithIntl(
      <QueryClientProvider client={queryClient}>
        <CardListItem card={solRing} />
      </QueryClientProvider>,
      { locale }
    );
  }

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(scryfallAndDeckApi));
  });

  it("swaps the row to the printing the player picks", async () => {
    const user = userEvent.setup();
    openSavedDeck(solRing);
    renderRow();

    await user.click(
      screen.getByRole("button", { name: "Change the printing of Sol Ring" })
    );
    expect(
      screen.getByRole("dialog", { name: "Sol Ring" })
    ).toBeInTheDocument();
    await user.click(
      await screen.findByRole("button", {
        name: "Sol Ring — Commander Masters",
      })
    );

    await waitFor(() =>
      expect(requests).toEqual([
        expect.objectContaining({
          method: "PATCH",
          path: `/api/decks/${DECK_ID}/cards/row-sol-ring`,
          body: expect.objectContaining({ scryfallId: CMM_ID }),
        }),
      ])
    );
    expect(storedRow("row-sol-ring")?.scryfallId).toBe(CMM_ID);
    expect(storedRow("row-sol-ring")?.quantity).toBe(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("hides the row's hover preview so it does not cover the selector", async () => {
    openSavedDeck(solRing);
    renderRow();
    vi.useFakeTimers();
    try {
      fireEvent.mouseEnter(screen.getByText("Sol Ring"), {
        clientX: 10,
        clientY: 10,
      });
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
      expect(screen.getByRole("img", { name: "Sol Ring" })).toBeInTheDocument();

      const button = screen.getByRole("button", {
        name: "Change the printing of Sol Ring",
      });
      fireEvent.pointerDown(button);
      fireEvent.click(button);
    } finally {
      vi.useRealTimers();
    }

    expect(
      screen.getByRole("dialog", { name: "Sol Ring" })
    ).toBeInTheDocument();
    // The open dialog hides the rest of the page from assistive technology,
    // so look past aria-hidden: the preview must be gone from the screen.
    expect(
      screen.queryByRole("img", { name: "Sol Ring", hidden: true })
    ).not.toBeInTheDocument();
  });

  it("names the button in the player's language", () => {
    openSavedDeck(solRing);
    renderRow("fr");

    expect(
      screen.getByRole("button", { name: "Changer l'édition de Sol Ring" })
    ).toBeInTheDocument();
  });
});
