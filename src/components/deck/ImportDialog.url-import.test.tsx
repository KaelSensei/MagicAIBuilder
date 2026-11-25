/**
 * What a URL import does to the import dialog it ran in (I-62).
 *
 * A URL import that adds every card closes the dialog, and that close resets
 * the form like any other: the next opening shows the Plain Text tab and empty
 * fields. A URL import that fails keeps the dialog open with the URL.
 *
 * Sociable: the real `ImportDialog` and URL tab, the real deck store, lookup
 * helper and Scryfall client. MSW answers at the HTTP boundary: the app's URL
 * import route, the in-memory deck API and the Scryfall stand-in. Nothing
 * internal is mocked.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { useDeckStore } from "@/lib/deck/store";
import type { UrlImportResult } from "@/lib/import/url-import";
import { aDeck } from "@/test/builders/deck";
import { deckApiHandlers } from "@/test/fake-deck-client";
import { createInMemoryDeckApi, emptyApiDeck } from "@/test/in-memory-deck-api";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { scryfallStandInHandlers } from "@/test/scryfall-stand-in";
import { ImportDialog } from "./ImportDialog";

const DECK_URL = "https://moxfield.com/decks/abc123";

/** The route's answer for a one-card Moxfield deck whose card Scryfall knows. */
const FETCHED_DECK: UrlImportResult = {
  name: "Sol Ring and friends",
  source: "moxfield",
  cards: [
    {
      name: "Sol Ring",
      quantity: 1,
      isCommander: false,
      isPartner: false,
      zone: "main",
    },
  ],
  ignored: [],
};

const deckApi = createInMemoryDeckApi();
const server = setupMsw(
  http.post("/api/import/url", () => HttpResponse.json(FETCHED_DECK)),
  ...deckApiHandlers(deckApi),
  ...scryfallStandInHandlers()
);

/** Hosts the dialog the way the header and the builder do: controlled, with a button that reopens it. */
function DialogHost() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open import
      </button>
      <ImportDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function decklistBox() {
  return screen.getByPlaceholderText(/Atraxa, Praetors' Voice/);
}

function urlBox() {
  return screen.getByRole("textbox", { name: /moxfield publicId/ });
}

async function importFromUrl(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "From URL" }));
  await user.type(urlBox(), DECK_URL);
  await user.click(screen.getByRole("button", { name: "Import" }));
}

async function confirmPreview(user: UserEvent) {
  await user.click(
    await screen.findByRole("button", { name: "Import this preview" })
  );
}

beforeEach(() => {
  deckApi.reset();
  deckApi.seedDeck(emptyApiDeck("deck-1"));
  useDeckStore.setState(useDeckStore.getInitialState(), true);
  useDeckStore.setState({
    decks: { "deck-1": aDeck({ id: "deck-1" }) },
    activeDeckId: "deck-1",
  });
});

describe("Importing a deck from a URL in the import dialog", () => {
  it("opens the dialog afresh after a successful import: the Plain Text tab and empty fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DialogHost />);
    await user.type(decklistBox(), "1 Arcane Signet");

    await importFromUrl(user);
    await confirmPreview(user);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: "Open import" }));

    expect(decklistBox()).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "From URL" }));
    expect(urlBox()).toHaveValue("");
  });

  it("keeps the dialog open with the URL when the import fails", async () => {
    server.use(
      http.post("/api/import/url", () =>
        HttpResponse.json({ error: "Deck not found." }, { status: 404 })
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<DialogHost />);

    await importFromUrl(user);

    expect(await screen.findByText("Deck not found.")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(urlBox()).toHaveValue(DECK_URL);
  });
});
