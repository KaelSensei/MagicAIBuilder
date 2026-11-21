/**
 * The "More" menu of a deck row (I-37): a signed-in player adds the row's card
 * to their collection or to another of their decks. Rendered through the row
 * itself, against the in-memory deck API and a stand-in collection route.
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it } from "vitest";
import { CardListItem } from "@/components/card/CardListItem";
import type { ApiDeck } from "@/lib/db/deck-api";
import { useCollectionStore } from "@/lib/collection/store";
import type { CollectionCard } from "@/lib/collection/types";
import { GUEST_DECK_ID } from "@/lib/deck/guest-deck";
import { apiDeckToStoreDeck } from "@/lib/deck/store-factories";
import { useDeckStore } from "@/lib/deck/store";
import { aDeckCard } from "@/test/builders/card";
import { deckApiHandlers, emptyApiDeck } from "@/test/fake-deck-client";
import { createInMemoryDeckApi } from "@/test/in-memory-deck-api";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { recordToasts } from "@/test/toast-recorder";

const PLAYER: Session = {
  user: { id: "player-1", name: "Kael" },
  expires: "2099-01-01T00:00:00.000Z",
};

const SMOTHERING_TITHE = aDeckCard({
  id: "a-tithe",
  scryfallId: "tithe-print",
  name: "Smothering Tithe",
  typeLine: "Enchantment",
  category: "ramp",
  price: 21.5,
  imageUri: "https://cards.example/tithe.jpg",
});

/** A card of the player's collection, so the row's ownership badge shows. */
const OWNED_SOL_RING: CollectionCard = {
  id: "collection-sol-ring",
  scryfallId: "sol-ring-print",
  name: "Sol Ring",
  quantity: 1,
  foil: false,
  condition: null,
  acquiredAt: null,
  price: 1,
  imageUri: "",
  createdAt: new Date(0),
};

const deckApi = createInMemoryDeckApi();
const collectionBodies: unknown[] = [];
const server = setupMsw(
  ...deckApiHandlers(deckApi),
  http.post("/api/collection", async ({ request }) => {
    const body: unknown = await request.json();
    collectionBodies.push(body);
    return HttpResponse.json(
      {
        id: "collection-tithe",
        scryfallId: "tithe-print",
        name: "Smothering Tithe",
        quantity: 1,
        foil: false,
        condition: null,
        acquiredAt: null,
        price: 21.5,
        imageUri: "https://cards.example/tithe.jpg",
        createdAt: "2026-11-21T00:00:00.000Z",
      },
      { status: 201 }
    );
  })
);
const toasts = recordToasts();

/** A saved deck of the player, updated on `updatedAt`. */
function playerDeck(id: string, name: string, updatedAt: string): ApiDeck {
  return { ...emptyApiDeck(id, name), version: 1, updatedAt };
}

const DECK_A = playerDeck("deck-a", "Deck A", "2026-11-20T00:00:00.000Z");

/** Opens deck A in the editor. */
function openDeck(deckId: string): void {
  useDeckStore.setState({
    activeDeckId: deckId,
    decks: { [DECK_A.id]: apiDeckToStoreDeck(DECK_A) },
  });
}

beforeEach(() => {
  deckApi.reset();
  deckApi.seedDeck(DECK_A);
  collectionBodies.length = 0;
  toasts.mockClear();
  useCollectionStore.setState({
    collectionCards: { [OWNED_SOL_RING.scryfallId]: OWNED_SOL_RING },
    collectionCardsFoil: {},
  });
  openDeck(DECK_A.id);
});

/** Opens the row's "More" menu. */
async function openMoreMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: "More actions for Smothering Tithe" })
  );
  return screen.findByRole("menu");
}

describe("the deck row's More menu", () => {
  it("a guest sees no menu", () => {
    renderWithProviders(<CardListItem card={SMOTHERING_TITHE} />, {
      session: null,
    });

    expect(
      screen.queryByRole("button", {
        name: "More actions for Smothering Tithe",
      })
    ).toBeNull();
  });

  it("a signed-out visitor on the guest deck sees no menu", () => {
    openDeck(GUEST_DECK_ID);
    renderWithProviders(<CardListItem card={SMOTHERING_TITHE} />, {
      session: null,
    });

    expect(screen.queryByRole("button", { name: /More actions/ })).toBeNull();
  });

  it("Add to my collection adds one copy of the row's printing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CardListItem card={SMOTHERING_TITHE} />, {
      session: PLAYER,
    });
    expect(screen.getByText("Buy")).toBeInTheDocument();

    const menu = await openMoreMenu(user);
    await user.click(
      within(menu).getByRole("menuitem", { name: "Add to my collection" })
    );

    await waitFor(() =>
      expect(toasts).toHaveBeenCalledWith(
        "success",
        "Added 1 Smothering Tithe to your collection"
      )
    );
    expect(collectionBodies).toEqual([
      {
        scryfallId: "tithe-print",
        name: "Smothering Tithe",
        quantity: 1,
        foil: false,
        condition: null,
        price: 21.5,
        imageUri: "https://cards.example/tithe.jpg",
      },
    ]);
    expect(screen.getByText("Owned")).toBeInTheDocument();
  });

  it("a failed add to the collection says so and offers a retry", async () => {
    server.use(
      http.post("/api/collection", () =>
        HttpResponse.json({ error: "Failed" }, { status: 500 })
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<CardListItem card={SMOTHERING_TITHE} />, {
      session: PLAYER,
    });

    const menu = await openMoreMenu(user);
    await user.click(
      within(menu).getByRole("menuitem", { name: "Add to my collection" })
    );

    const retry = await screen.findByRole("button", {
      name: "Retry adding Smothering Tithe to your collection",
    });
    expect(toasts).toHaveBeenCalledWith(
      "error",
      "Could not add Smothering Tithe to your collection."
    );
    expect(
      useCollectionStore.getState().collectionCards["tithe-print"]
    ).toBeUndefined();

    server.resetHandlers();
    await user.click(retry);

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Retry adding Smothering Tithe/ })
      ).toBeNull()
    );
    expect(collectionBodies).toHaveLength(1);
  });

  it("Add to another deck… adds the card to the deck and zone the player picks", async () => {
    deckApi.seedDeck(
      playerDeck("kaalia", "Kaalia", "2026-11-19T00:00:00.000Z")
    );
    const user = userEvent.setup();
    renderWithProviders(<CardListItem card={SMOTHERING_TITHE} />, {
      session: PLAYER,
    });

    const menu = await openMoreMenu(user);
    await user.click(
      within(menu).getByRole("menuitem", { name: "Add to another deck…" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Add Smothering Tithe to another deck",
    });
    await user.click(within(dialog).getByRole("radio", { name: "Sideboard" }));
    await user.click(
      await within(dialog).findByRole("button", { name: "Kaalia" })
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(toasts).toHaveBeenCalledWith(
      "success",
      "Added Smothering Tithe to Kaalia (Sideboard)"
    );
    expect(deckApi.savedDeck("kaalia")?.cards).toEqual([
      expect.objectContaining({ name: "Smothering Tithe", zone: "sideboard" }),
    ]);
    expect(deckApi.savedDeck(DECK_A.id)).toEqual(DECK_A);
  });

  it("opens the deck picker by keyboard alone", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CardListItem card={SMOTHERING_TITHE} />, {
      session: PLAYER,
    });

    screen
      .getByRole("button", { name: "More actions for Smothering Tithe" })
      .focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("menu");
    await user.keyboard("{ArrowDown}{Enter}");

    expect(
      await screen.findByRole("dialog", {
        name: "Add Smothering Tithe to another deck",
      })
    ).toBeInTheDocument();
  });
});
