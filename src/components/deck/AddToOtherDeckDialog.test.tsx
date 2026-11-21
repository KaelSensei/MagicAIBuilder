/**
 * The "Add to another deck…" picker of a deck row (I-37): which decks it
 * offers, and what it says when the listing or the add does not go through.
 * Runs against the in-memory deck API through the real deck client.
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddToOtherDeckDialog } from "@/components/deck/AddToOtherDeckDialog";
import type { ApiDeck } from "@/lib/db/deck-api";
import { aDeckCard } from "@/test/builders/card";
import {
  DeckApiRefusal,
  emptyApiDeck,
  installFakeDeckClient,
} from "@/test/fake-deck-client";
import { renderWithProviders, type TestLocale } from "@/test/render";
import { recordToasts } from "@/test/toast-recorder";

const deckApi = installFakeDeckClient();
const toasts = recordToasts();

const SOL_RING = aDeckCard({
  id: "a-sol-ring",
  scryfallId: "sol-ring-print",
  name: "Sol Ring",
  typeLine: "Artifact",
});

/** A saved deck of the player, updated on the given day of November 2026. */
function playerDeck(id: string, name: string, day: number): ApiDeck {
  const updatedAt = `2026-11-${String(day).padStart(2, "0")}T00:00:00.000Z`;
  return { ...emptyApiDeck(id, name), version: 1, updatedAt };
}

const DECK_A = playerDeck("deck-a", "Deck A", 20);

/** Opens the picker for Sol Ring from deck A; returns the close spy. */
function renderPicker(locale: TestLocale = "en") {
  const onClose = vi.fn();
  renderWithProviders(
    <AddToOtherDeckDialog
      card={SOL_RING}
      openDeckId={DECK_A.id}
      onClose={onClose}
    />,
    { locale }
  );
  return onClose;
}

/** The deck buttons, in the order the picker lists them. */
async function listedDecks(): Promise<string[]> {
  const list = await screen.findByRole("list");
  return within(list)
    .getAllByRole("button")
    .map((button) => button.textContent ?? "");
}

beforeEach(() => {
  toasts.mockClear();
  deckApi.seedDeck(DECK_A);
});

describe("AddToOtherDeckDialog", () => {
  it("lists the other decks, the open one left out, most recently updated first", async () => {
    deckApi.seedDeck(playerDeck("kaalia", "Kaalia", 3));
    deckApi.seedDeck(playerDeck("atraxa", "Atraxa", 18));
    renderPicker();

    expect(await listedDecks()).toEqual(["Atraxa", "Kaalia"]);
    expect(screen.getByRole("radio", { name: "Main" })).toBeChecked();
    expect(deckApi.fetchDecks).toHaveBeenCalledWith(0, 50);
  });

  it("filters the decks by name", async () => {
    deckApi.seedDeck(playerDeck("kaalia", "Kaalia", 3));
    deckApi.seedDeck(playerDeck("atraxa", "Atraxa", 18));
    const user = userEvent.setup();
    renderPicker();

    await user.type(
      await screen.findByRole("searchbox", {
        name: "Filter your decks by name",
      }),
      "kaa"
    );

    expect(await listedDecks()).toEqual(["Kaalia"]);
    await user.type(screen.getByRole("searchbox"), "zz");
    expect(screen.getByText("No deck matches this name.")).toBeInTheDocument();
  });

  it("says the player has no other deck", async () => {
    renderPicker();

    expect(
      await screen.findByText("You have no other deck.")
    ).toBeInTheDocument();
  });

  it("says only the 50 latest decks are shown when the player has more", async () => {
    deckApi.fetchDecks.mockResolvedValueOnce({
      decks: [DECK_A, playerDeck("kaalia", "Kaalia", 3)],
      total: 51,
      page: 0,
      limit: 50,
    });
    renderPicker();

    expect(
      await screen.findByText(
        "Only your 50 most recently updated decks are shown."
      )
    ).toBeInTheDocument();
  });

  it("offers a retry when the decks cannot be read", async () => {
    deckApi.seedDeck(playerDeck("kaalia", "Kaalia", 3));
    deckApi.fetchDecks.mockRejectedValueOnce(new DeckApiRefusal(500));
    const user = userEvent.setup();
    renderPicker();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not load your decks.");
    await user.click(within(alert).getByRole("button", { name: "Retry" }));

    expect(await listedDecks()).toEqual(["Kaalia"]);
  });

  it("says the deck already holds the most copies allowed, writes nothing and stays open", async () => {
    // CR 903.5b: one copy of each card in a Commander deck.
    deckApi.seedDeck({
      ...playerDeck("kaalia", "Kaalia", 3),
      cards: [
        {
          ...SOL_RING,
          id: "kaalia-sol-ring",
          deckId: "kaalia",
          scryfallId: "sol-ring-print",
          notes: null,
          isCommander: false,
          isPartner: false,
        },
      ],
    });
    const user = userEvent.setup();
    const onClose = renderPicker();

    await user.click(await screen.findByRole("button", { name: "Kaalia" }));

    expect(
      await screen.findByText("Kaalia already holds the most copies allowed")
    ).toBeInTheDocument();
    expect(deckApi.addCard).not.toHaveBeenCalled();
    expect(deckApi.updateCardQuantity).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("offers a retry when the add fails, and closes once the retry is stored", async () => {
    deckApi.seedDeck(playerDeck("kaalia", "Kaalia", 3));
    deckApi.addCard.mockRejectedValueOnce(new DeckApiRefusal(500));
    const user = userEvent.setup();
    const onClose = renderPicker();

    await user.click(await screen.findByRole("radio", { name: "Considering" }));
    await user.click(await screen.findByRole("button", { name: "Kaalia" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not add Sol Ring to Kaalia.");
    expect(deckApi.savedDeck("kaalia")?.cards).toEqual([]);

    await user.click(within(alert).getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(deckApi.savedDeck("kaalia")?.cards).toEqual([
      expect.objectContaining({ name: "Sol Ring", zone: "maybeboard" }),
    ]);
    expect(toasts).toHaveBeenCalledWith(
      "success",
      "Added Sol Ring to Kaalia (Considering)"
    );
  });

  it("speaks French", async () => {
    deckApi.seedDeck(playerDeck("kaalia", "Kaalia", 3));
    renderPicker("fr");

    expect(
      await screen.findByRole("dialog", {
        name: "Ajouter Sol Ring à un autre deck",
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Réserve" })).not.toBeChecked();
  });
});
