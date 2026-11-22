/**
 * Sociable tests of the builder's drop and paste target for cards from other sites (I-37):
 * the mounted component, the real deck store and Scryfall client, with the in-memory deck API
 * and the Scryfall stand-in answering over MSW. No test reaches scryfall.com or edhrec.com.
 */
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExternalCardDropTarget } from "@/components/builder/ExternalCardDropTarget";
import { Modal } from "@/components/ui/Modal";
import { GUEST_DECK_ID } from "@/lib/deck/guest-deck";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckZone } from "@/lib/deck/types";
import { LIGHTNING_BOLT_NAMED_RECORDED } from "@/lib/scryfall/fixtures/e2e-stand-in-v1";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { aScryfallCard } from "@/test/builders/scryfall";
import { deckApiHandlers } from "@/test/fake-deck-client";
import { createInMemoryDeckApi, emptyApiDeck } from "@/test/in-memory-deck-api";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { scryfallStandInHandlers } from "@/test/scryfall-stand-in";
import { recordToasts } from "@/test/toast-recorder";

const BOLT = LIGHTNING_BOLT_NAMED_RECORDED;
const BOLT_IMAGE = `https://cards.scryfall.io/normal/front/7/6/${BOLT.id}.jpg?1783903008`;
const BOLT_PAGE = "https://scryfall.com/card/msc/170/lightning-bolt";
const BOLT_EDHREC = "https://edhrec.com/cards/lightning-bolt";
const SOL_RING = aScryfallCard({
  id: "00000000-0000-4000-8000-00000000501a",
  name: "Sol Ring",
  type_line: "Artifact",
  oracle_text: "{T}: Add {C}{C}.",
  set: "c21",
});
const SOL_RING_PAGE = "https://scryfall.com/card/c21/263/sol-ring";
const SOL_RING_AT_LIMIT =
  "Sol Ring is already at its copy limit for Commander. Nothing was added.";

const deckApi = createInMemoryDeckApi();
const server = setupMsw(
  ...deckApiHandlers(deckApi),
  // The shared cache cannot answer here, so the client asks the Scryfall stand-in itself.
  http.get("/api/cache/cards", () =>
    HttpResponse.json({ error: "miss" }, { status: 404 })
  ),
  ...scryfallStandInHandlers()
);
const toasts = recordToasts();

/** A drag payload as a browser hands it over: its entries by type, and its files. */
interface DragData {
  readonly entries?: Readonly<Record<string, string>>;
  readonly files?: readonly File[];
}

function dataTransfer({ entries = {}, files = [] }: DragData) {
  const types = [
    ...Object.keys(entries),
    ...(files.length > 0 ? ["Files"] : []),
  ];
  return {
    types,
    files,
    getData: (type: string) => entries[type] ?? "",
    dropEffect: "none",
  };
}

function dropOnBuilder(data: DragData): void {
  const transfer = dataTransfer(data);
  fireEvent.dragEnter(document.body, { dataTransfer: transfer });
  fireEvent.dragOver(document.body, { dataTransfer: transfer });
  fireEvent.drop(document.body, { dataTransfer: transfer });
}

function pasteOn(target: Element, text: string): void {
  fireEvent.paste(target, {
    clipboardData: dataTransfer({ entries: { "text/plain": text } }),
  });
}

function zoneCards(zone: DeckZone) {
  return (
    useDeckStore
      .getState()
      .getActiveDeck()
      ?.cards.filter((card) => card.zone === zone) ?? []
  );
}

/** Lets the lookup and the save settle, so "nothing was added" is not read too early. */
async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

function openDeck(id = "deck-1"): void {
  useDeckStore.setState({
    decks: { [id]: aDeck({ id }) },
    activeDeckId: id,
    undoStack: [],
    gameChangerNames: new Set(),
    bannedNames: new Set(),
  });
}

/**
 * Opens a Commander deck that already holds Sol Ring, its one allowed copy (CR 903.5b), and
 * lets Scryfall's collection lookup answer Sol Ring for its set and number.
 */
function openCommanderDeckHoldingSolRing(): void {
  useDeckStore.setState({
    decks: {
      "deck-1": aDeck({
        id: "deck-1",
        format: "commander",
        cards: [
          aDeckCard({
            id: "sol-ring",
            name: "Sol Ring",
            typeLine: "Artifact",
            quantity: 1,
            zone: "main",
          }),
        ],
      }),
    },
    activeDeckId: "deck-1",
  });
  server.use(
    http.post("*/cards/collection", () =>
      HttpResponse.json({ object: "list", not_found: [], data: [SOL_RING] })
    )
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  deckApi.reset();
  deckApi.seedDeck(emptyApiDeck("deck-1"));
  openDeck();
});

describe("a card dropped from another site", () => {
  it("dropping a Scryfall card link adds that printing to the Main zone, says so, and one undo removes it", async () => {
    server.use(
      http.post("*/cards/collection", async ({ request }) => {
        const body: unknown = await request.json();
        expect(body).toEqual({
          identifiers: [{ set: "msc", collector_number: "170" }],
        });
        return HttpResponse.json({
          object: "list",
          not_found: [],
          data: [BOLT],
        });
      })
    );
    renderWithProviders(<ExternalCardDropTarget zone="main" />);

    dropOnBuilder({ entries: { "text/uri-list": BOLT_PAGE } });

    await waitFor(() => expect(zoneCards("main")).toHaveLength(1));
    expect(deckApi.savedDeck("deck-1")?.cards).toEqual([
      expect.objectContaining({
        name: "Lightning Bolt",
        scryfallId: BOLT.id,
        zone: "main",
      }),
    ]);
    expect(toasts).toHaveBeenCalledWith(
      "success",
      "Added Lightning Bolt to Main"
    );
    expect(useDeckStore.getState().undoStack).toHaveLength(1);

    await act(() => useDeckStore.getState().undo());
    expect(zoneCards("main")).toHaveLength(0);
    expect(deckApi.savedDeck("deck-1")?.cards).toEqual([]);
  });

  it("a dragged Scryfall image lands in the zone the editor shows", async () => {
    renderWithProviders(<ExternalCardDropTarget zone="sideboard" />);

    dropOnBuilder({
      entries: {
        "text/uri-list": BOLT_IMAGE,
        "text/html": `<img src="${BOLT_IMAGE}">`,
      },
    });

    await waitFor(() => expect(zoneCards("sideboard")).toHaveLength(1));
    expect(zoneCards("main")).toHaveLength(0);
    expect(toasts).toHaveBeenCalledWith(
      "success",
      "Added Lightning Bolt to Sideboard"
    );
  });

  it("an EDHREC link adds the named card", async () => {
    renderWithProviders(<ExternalCardDropTarget zone="main" />);

    dropOnBuilder({ entries: { "text/uri-list": BOLT_EDHREC } });

    await waitFor(() => expect(zoneCards("main")).toHaveLength(1));
    expect(zoneCards("main")[0]?.name).toBe("Lightning Bolt");
    expect(toasts).toHaveBeenCalledWith(
      "success",
      "Added Lightning Bolt to Main"
    );
  });

  it("a link from another host adds nothing and says why", async () => {
    renderWithProviders(<ExternalCardDropTarget zone="main" />);

    dropOnBuilder({
      entries: { "text/uri-list": "https://www.moxfield.com/decks/abc" },
    });
    await settle();

    expect(zoneCards("main")).toHaveLength(0);
    expect(toasts).toHaveBeenCalledWith(
      "error",
      "This link isn't a card we can read. Drop or paste a card from Scryfall or EDHREC, or a card name."
    );
  });

  it("a card name no lookup finds adds nothing and says the lookup failed", async () => {
    renderWithProviders(<ExternalCardDropTarget zone="main" />);

    dropOnBuilder({ entries: { "text/plain": "No Such Card Anywhere" } });

    await waitFor(() =>
      expect(toasts).toHaveBeenCalledWith(
        "error",
        "The card lookup did not answer or found no card. Nothing was added."
      )
    );
    expect(zoneCards("main")).toHaveLength(0);
  });

  it("a card already at its copy limit adds nothing and says it is at the limit for the format", async () => {
    openCommanderDeckHoldingSolRing();
    renderWithProviders(<ExternalCardDropTarget zone="main" />);

    dropOnBuilder({ entries: { "text/uri-list": SOL_RING_PAGE } });

    await waitFor(() =>
      expect(toasts).toHaveBeenCalledWith("info", SOL_RING_AT_LIMIT)
    );
    expect(zoneCards("main")).toEqual([
      expect.objectContaining({ name: "Sol Ring", quantity: 1 }),
    ]);
    expect(deckApi.addCard).not.toHaveBeenCalled();
    expect(useDeckStore.getState().undoStack).toEqual([]);
  });

  it("a card one copy below its limit is still added", async () => {
    const threeBolts = aDeckCard({
      id: "bolts",
      scryfallId: BOLT.id,
      name: "Lightning Bolt",
      typeLine: "Instant",
      quantity: 3,
      zone: "main",
    });
    deckApi.seedDeck({
      ...emptyApiDeck("deck-1"),
      format: "modern",
      cards: [
        {
          ...threeBolts,
          deckId: "deck-1",
          scryfallId: BOLT.id,
          notes: null,
          isCommander: false,
          isPartner: false,
        },
      ],
    });
    useDeckStore.setState({
      decks: {
        "deck-1": aDeck({
          id: "deck-1",
          format: "modern",
          cards: [threeBolts],
        }),
      },
      activeDeckId: "deck-1",
    });
    renderWithProviders(<ExternalCardDropTarget zone="main" />);

    dropOnBuilder({ entries: { "text/uri-list": BOLT_EDHREC } });

    await waitFor(() =>
      expect(toasts).toHaveBeenCalledWith(
        "success",
        "Added Lightning Bolt to Main"
      )
    );
    expect(zoneCards("main")).toEqual([
      expect.objectContaining({ name: "Lightning Bolt", quantity: 4 }),
    ]);
  });

  it("a dropped file adds nothing and points to Import", async () => {
    renderWithProviders(<ExternalCardDropTarget zone="main" />);

    dropOnBuilder({
      files: [new File(["1 Sol Ring"], "deck.txt", { type: "text/plain" })],
    });
    await settle();

    expect(zoneCards("main")).toHaveLength(0);
    expect(toasts).toHaveBeenCalledWith(
      "info",
      "Files can't be dropped here. To add cards from a file, use Import."
    );
  });

  it("dropping a link never lets the browser open it, even one it cannot read", () => {
    renderWithProviders(<ExternalCardDropTarget zone="main" />);
    const transfer = dataTransfer({
      entries: { "text/uri-list": "https://www.moxfield.com/decks/abc" },
    });

    const overAllowed = fireEvent.dragOver(document.body, {
      dataTransfer: transfer,
    });
    const dropAllowed = fireEvent.drop(document.body, {
      dataTransfer: transfer,
    });

    expect(overAllowed).toBe(false);
    expect(dropAllowed).toBe(false);
  });

  it("a drag that starts in the search results is not added a second time", async () => {
    renderWithProviders(
      <>
        <a href={BOLT_IMAGE}>Lightning Bolt search result</a>
        <ExternalCardDropTarget zone="main" />
      </>
    );
    const result = screen.getByRole("link", {
      name: "Lightning Bolt search result",
    });

    fireEvent.dragStart(result);
    dropOnBuilder({ entries: { "text/uri-list": BOLT_IMAGE } });
    fireEvent.dragEnd(result);
    await settle();

    expect(zoneCards("main")).toHaveLength(0);
    expect(toasts).not.toHaveBeenCalled();
  });

  it("nothing happens while a dialog is open", async () => {
    renderWithProviders(
      <>
        <Modal open onClose={() => undefined} title="Export">
          <p>Export the deck</p>
        </Modal>
        <ExternalCardDropTarget zone="main" />
      </>
    );
    expect(screen.getByRole("dialog", { name: "Export" })).toBeInTheDocument();

    dropOnBuilder({ entries: { "text/uri-list": BOLT_IMAGE } });
    pasteOn(document.body, BOLT_IMAGE);
    await settle();

    expect(zoneCards("main")).toHaveLength(0);
    expect(toasts).not.toHaveBeenCalled();
  });

  it("shows where the card will go while an outside drag is over the window", () => {
    renderWithProviders(<ExternalCardDropTarget zone="main" />);
    const transfer = dataTransfer({ entries: { "text/uri-list": BOLT_IMAGE } });

    fireEvent.dragEnter(document.body, { dataTransfer: transfer });
    expect(screen.getByRole("status")).toHaveTextContent("Drop to add to Main");

    fireEvent.dragLeave(document.body, { dataTransfer: transfer });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("adds through the guest deck's own path", async () => {
    openDeck(GUEST_DECK_ID);
    renderWithProviders(<ExternalCardDropTarget zone="main" />);

    dropOnBuilder({ entries: { "text/uri-list": BOLT_IMAGE } });

    await waitFor(() => expect(zoneCards("main")).toHaveLength(1));
    expect(deckApi.addCard).not.toHaveBeenCalled();
  });
});

describe("a card pasted with Ctrl+V or Cmd+V", () => {
  it("pasting a card name outside a text field adds that card", async () => {
    renderWithProviders(<ExternalCardDropTarget zone="main" />);

    pasteOn(document.body, "Lightning Bolt");

    await waitFor(() => expect(zoneCards("main")).toHaveLength(1));
    expect(toasts).toHaveBeenCalledWith(
      "success",
      "Added Lightning Bolt to Main"
    );
  });

  it("pasting a card already at its copy limit adds nothing and says it is at the limit for the format", async () => {
    openCommanderDeckHoldingSolRing();
    renderWithProviders(<ExternalCardDropTarget zone="main" />);

    pasteOn(document.body, SOL_RING_PAGE);

    await waitFor(() =>
      expect(toasts).toHaveBeenCalledWith("info", SOL_RING_AT_LIMIT)
    );
    expect(zoneCards("main")).toEqual([
      expect.objectContaining({ name: "Sol Ring", quantity: 1 }),
    ]);
    expect(deckApi.addCard).not.toHaveBeenCalled();
  });

  it("Ctrl+V in the search field does not add", async () => {
    renderWithProviders(
      <>
        <input aria-label="Search cards" />
        <ExternalCardDropTarget zone="main" />
      </>
    );
    const search = screen.getByRole("textbox", { name: "Search cards" });
    search.focus();

    pasteOn(search, "Lightning Bolt");
    await settle();

    expect(zoneCards("main")).toHaveLength(0);
    expect(toasts).not.toHaveBeenCalled();
  });
});
