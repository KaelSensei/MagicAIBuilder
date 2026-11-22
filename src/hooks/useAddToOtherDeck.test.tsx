/**
 * Adding a deck row's card to another of the player's decks (I-37), through
 * the real deck client against the in-memory deck API: the other deck is read,
 * the copy limit decides the write, and the open deck is never written.
 */
import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { ApiDeck, ApiDeckCard } from "@/lib/db/deck-api";
import { apiDeckToStoreDeck, deckCardCount } from "@/lib/deck/store-factories";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckFormat } from "@/lib/deck/formats";
import type { DeckCard } from "@/lib/deck/types";
import { useAddToOtherDeck } from "@/hooks/useAddToOtherDeck";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import {
  DeckApiRefusal,
  emptyApiDeck,
  installFakeDeckClient,
} from "@/test/fake-deck-client";
import { renderHookWithProviders } from "@/test/render";
import { recordToasts } from "@/test/toast-recorder";

const deckApi = installFakeDeckClient();
const toasts = recordToasts();

const SMOTHERING_TITHE = aDeckCard({
  id: "a-tithe",
  scryfallId: "tithe-print",
  name: "Smothering Tithe",
  manaCost: "{3}{W}",
  cmc: 4,
  typeLine: "Enchantment",
  colorIdentity: ["W"],
  category: "ramp",
  price: 21.5,
  imageUri: "https://cards.example/tithe.jpg",
});
const SOL_RING = aDeckCard({
  id: "a-sol-ring",
  scryfallId: "sol-ring-print",
  name: "Sol Ring",
  typeLine: "Artifact",
  category: "ramp",
});
const LIGHTNING_BOLT = aDeckCard({
  id: "a-bolt",
  scryfallId: "bolt-print",
  name: "Lightning Bolt",
  typeLine: "Instant",
});

/** The row a deck holds for `card`, as the deck routes return it. */
function apiRow(deckId: string, card: DeckCard): ApiDeckCard {
  return {
    ...card,
    deckId,
    scryfallId: card.scryfallId ?? card.id,
    notes: card.notes ?? null,
    isCommander: false,
    isPartner: false,
  };
}

/** A saved deck holding `cards`, at version 3. */
function savedDeck(
  id: string,
  name: string,
  cards: readonly DeckCard[],
  format: DeckFormat = "commander"
): ApiDeck {
  return {
    ...emptyApiDeck(id, name),
    format,
    version: 3,
    cards: cards.map((card) => apiRow(id, card)),
  };
}

const DECK_A = savedDeck("deck-a", "Deck A", [SMOTHERING_TITHE, SOL_RING]);
const KAALIA = { id: "kaalia", name: "Kaalia" };

/** Opens deck A in the editor, as the builder holds it once loaded. */
function openDeckA(): void {
  useDeckStore.setState({
    activeDeckId: DECK_A.id,
    decks: { [DECK_A.id]: apiDeckToStoreDeck(DECK_A) },
  });
}

beforeEach(() => {
  toasts.mockClear();
  deckApi.seedDeck(DECK_A);
  openDeckA();
});

describe("useAddToOtherDeck", () => {
  it("adding Smothering Tithe to Kaalia writes one Main row in Kaalia and leaves deck A unchanged", async () => {
    deckApi.seedDeck(savedDeck(KAALIA.id, KAALIA.name, [SOL_RING]));
    const { result } = renderHookWithProviders(() =>
      useAddToOtherDeck(SMOTHERING_TITHE)
    );

    await act(() => result.current.addTo(KAALIA, "main"));

    const tithes = deckApi
      .savedDeck(KAALIA.id)
      ?.cards.filter((row) => row.name === "Smothering Tithe");
    expect(tithes).toEqual([
      expect.objectContaining({
        scryfallId: "tithe-print",
        quantity: 1,
        zone: "main",
        category: "ramp",
        price: 21.5,
      }),
    ]);
    expect(deckApi.savedDeck(DECK_A.id)).toEqual(DECK_A);
    expect(toasts).toHaveBeenCalledWith(
      "success",
      "Added Smothering Tithe to Kaalia (Main)"
    );
  });

  it("a Modern deck holding three of a four-of card gets one more copy on that row", async () => {
    // CR 100.2a: four copies of a card in a constructed deck.
    const burn = savedDeck(
      "burn",
      "Burn",
      [{ ...LIGHTNING_BOLT, id: "burn-bolt", quantity: 3 }],
      "modern"
    );
    deckApi.seedDeck(burn);
    const { result } = renderHookWithProviders(() =>
      useAddToOtherDeck(LIGHTNING_BOLT)
    );

    await act(() => result.current.addTo({ id: "burn", name: "Burn" }, "main"));

    expect(deckApi.savedDeck("burn")?.cards).toEqual([
      expect.objectContaining({ id: "burn-bolt", quantity: 4 }),
    ]);
    expect(deckApi.updateCardQuantity).toHaveBeenCalledWith(
      { deckId: "burn", expectedVersion: 3 },
      "burn-bolt",
      4
    );
  });

  it("a Commander deck already holding Sol Ring is at its limit and nothing is written", async () => {
    // CR 903.5b: one copy of each card in a Commander deck.
    deckApi.seedDeck(
      savedDeck(KAALIA.id, KAALIA.name, [
        { ...SOL_RING, id: "kaalia-sol-ring" },
      ])
    );
    const { result } = renderHookWithProviders(() =>
      useAddToOtherDeck(SOL_RING)
    );

    let added = true;
    await act(async () => {
      added = await result.current.addTo(KAALIA, "main");
    });

    expect(added).toBe(false);
    expect(result.current.status).toEqual({
      kind: "atLimit",
      deckName: "Kaalia",
    });
    expect(deckApi.addCard).not.toHaveBeenCalled();
    expect(deckApi.updateCardQuantity).not.toHaveBeenCalled();
    expect(deckApi.savedDeck(KAALIA.id)?.version).toBe(3);
    expect(toasts).not.toHaveBeenCalled();
  });

  it("a Modern deck with 3 Lightning Bolt in the main deck and 1 in the sideboard refuses a fifth copy into the sideboard", async () => {
    // CR 100.2a, CR 100.4a: a constructed deck and its sideboard together
    // hold at most four copies of a card.
    deckApi.seedDeck(
      savedDeck(
        "burn",
        "Burn",
        [
          { ...LIGHTNING_BOLT, id: "burn-bolt", quantity: 3 },
          { ...LIGHTNING_BOLT, id: "burn-bolt-side", zone: "sideboard" },
        ],
        "modern"
      )
    );
    const { result } = renderHookWithProviders(() =>
      useAddToOtherDeck(LIGHTNING_BOLT)
    );

    await act(() =>
      result.current.addTo({ id: "burn", name: "Burn" }, "sideboard")
    );

    expect(result.current.status).toEqual({
      kind: "atLimit",
      deckName: "Burn",
    });
    expect(deckApi.updateCardQuantity).not.toHaveBeenCalled();
    expect(deckApi.addCard).not.toHaveBeenCalled();
    expect(toasts).not.toHaveBeenCalled();
  });

  it("a Commander deck whose commander is Atraxa refuses Atraxa into its main deck", async () => {
    // CR 903.5b: one copy of each card across the deck, the command zone
    // included.
    const atraxa = aDeckCard({
      id: "a-atraxa",
      scryfallId: "atraxa-print",
      name: "Atraxa, Praetors' Voice",
      typeLine: "Legendary Creature — Phyrexian Angel Horror",
    });
    deckApi.seedDeck({
      ...savedDeck("superfriends", "Superfriends", []),
      cards: [
        {
          ...apiRow("superfriends", { ...atraxa, id: "superfriends-atraxa" }),
          isCommander: true,
        },
      ],
    });
    const { result } = renderHookWithProviders(() => useAddToOtherDeck(atraxa));

    await act(() =>
      result.current.addTo({ id: "superfriends", name: "Superfriends" }, "main")
    );

    expect(result.current.status).toEqual({
      kind: "atLimit",
      deckName: "Superfriends",
    });
    expect(deckApi.addCard).not.toHaveBeenCalled();
  });

  it("a Modern deck holding 20 basic Mountains still accepts another", async () => {
    // CR 100.2a: basic lands are exempt from the four-copy limit.
    const mountain = aDeckCard({
      id: "a-mountain",
      scryfallId: "mountain-print",
      name: "Mountain",
      typeLine: "Basic Land — Mountain",
    });
    deckApi.seedDeck(
      savedDeck(
        "burn",
        "Burn",
        [{ ...mountain, id: "burn-mountain", quantity: 20 }],
        "modern"
      )
    );
    const { result } = renderHookWithProviders(() =>
      useAddToOtherDeck(mountain)
    );

    await act(() => result.current.addTo({ id: "burn", name: "Burn" }, "main"));

    expect(deckApi.savedDeck("burn")?.cards).toEqual([
      expect.objectContaining({ id: "burn-mountain", quantity: 21 }),
    ]);
  });

  it("a Lightning Bolt in Considering does not count against the four in the deck", async () => {
    // Considering is not part of the deck, so CR 100.2a does not weigh it.
    deckApi.seedDeck(
      savedDeck(
        "burn",
        "Burn",
        [
          { ...LIGHTNING_BOLT, id: "burn-bolt", quantity: 3 },
          { ...LIGHTNING_BOLT, id: "burn-bolt-maybe", zone: "maybeboard" },
        ],
        "modern"
      )
    );
    const { result } = renderHookWithProviders(() =>
      useAddToOtherDeck(LIGHTNING_BOLT)
    );

    await act(() => result.current.addTo({ id: "burn", name: "Burn" }, "main"));

    expect(deckApi.savedDeck("burn")?.cards).toEqual([
      expect.objectContaining({ id: "burn-bolt", quantity: 4 }),
      expect.objectContaining({ id: "burn-bolt-maybe", quantity: 1 }),
    ]);
  });

  it("never claims a copy the route did not store", async () => {
    deckApi.seedDeck(
      savedDeck(
        "burn",
        "Burn",
        [{ ...LIGHTNING_BOLT, id: "burn-bolt", quantity: 3 }],
        "modern"
      )
    );
    deckApi.updateCardQuantity.mockResolvedValueOnce({
      ...apiRow("burn", { ...LIGHTNING_BOLT, id: "burn-bolt", quantity: 3 }),
      version: 4,
    });
    const { result } = renderHookWithProviders(() =>
      useAddToOtherDeck(LIGHTNING_BOLT)
    );

    await act(() => result.current.addTo({ id: "burn", name: "Burn" }, "main"));

    expect(result.current.status).toEqual({
      kind: "atLimit",
      deckName: "Burn",
    });
    expect(toasts).not.toHaveBeenCalled();
  });

  it("a 409 is retried once from a fresh read of the other deck", async () => {
    deckApi.seedDeck(savedDeck(KAALIA.id, KAALIA.name, [SOL_RING]));
    deckApi.addCard.mockRejectedValueOnce(new DeckApiRefusal(409, "stale"));
    const { result } = renderHookWithProviders(() =>
      useAddToOtherDeck(SMOTHERING_TITHE)
    );

    await act(() => result.current.addTo(KAALIA, "sideboard"));

    expect(deckApi.fetchDeck).toHaveBeenCalledTimes(2);
    expect(deckApi.addCard).toHaveBeenCalledTimes(2);
    expect(
      deckApi
        .savedDeck(KAALIA.id)
        ?.cards.filter((row) => row.name === "Smothering Tithe")
    ).toEqual([expect.objectContaining({ zone: "sideboard", quantity: 1 })]);
    expect(toasts).toHaveBeenCalledWith(
      "success",
      "Added Smothering Tithe to Kaalia (Sideboard)"
    );
  });

  it("a second 409 is reported and nothing is written", async () => {
    deckApi.seedDeck(savedDeck(KAALIA.id, KAALIA.name, [SOL_RING]));
    deckApi.addCard
      .mockRejectedValueOnce(new DeckApiRefusal(409, "stale"))
      .mockRejectedValueOnce(new DeckApiRefusal(409, "stale"));
    const { result } = renderHookWithProviders(() =>
      useAddToOtherDeck(SMOTHERING_TITHE)
    );

    await act(() => result.current.addTo(KAALIA, "main"));

    expect(deckApi.addCard).toHaveBeenCalledTimes(2);
    expect(result.current.status).toEqual({
      kind: "failed",
      deck: KAALIA,
      zone: "main",
    });
    expect(deckApi.savedDeck(KAALIA.id)?.cards).toHaveLength(1);
  });

  it("a failed read of the other deck is reported, and both decks stay as they were", async () => {
    deckApi.seedDeck(savedDeck(KAALIA.id, KAALIA.name, [SOL_RING]));
    deckApi.fetchDeck.mockRejectedValueOnce(new DeckApiRefusal(500));
    const { result } = renderHookWithProviders(() =>
      useAddToOtherDeck(SMOTHERING_TITHE)
    );

    await act(() => result.current.addTo(KAALIA, "main"));

    expect(result.current.status).toEqual({
      kind: "failed",
      deck: KAALIA,
      zone: "main",
    });
    expect(deckApi.addCard).not.toHaveBeenCalled();
    expect(deckApi.savedDeck(DECK_A.id)).toEqual(DECK_A);
    expect(toasts).not.toHaveBeenCalled();
  });

  it("after the add, the deck list shows Kaalia's new card count", async () => {
    deckApi.seedDeck(savedDeck(KAALIA.id, KAALIA.name, [SOL_RING]));
    await act(() => useDeckStore.getState().loadDecks());
    const listedCount = () =>
      deckCardCount(useDeckStore.getState().decks[KAALIA.id] ?? aDeck());
    expect(listedCount()).toBe(1);
    const { result } = renderHookWithProviders(() =>
      useAddToOtherDeck(SMOTHERING_TITHE)
    );

    await act(() => result.current.addTo(KAALIA, "main"));

    await waitFor(() => expect(listedCount()).toBe(2));
  });

  it("after the add, the deck list shows the new count of a deck opened earlier", async () => {
    const kaalia = savedDeck(KAALIA.id, KAALIA.name, [SOL_RING]);
    deckApi.seedDeck(kaalia);
    useDeckStore.setState((state) => ({
      decks: { ...state.decks, [KAALIA.id]: apiDeckToStoreDeck(kaalia) },
    }));
    const { result } = renderHookWithProviders(() =>
      useAddToOtherDeck(SMOTHERING_TITHE)
    );

    await act(() => result.current.addTo(KAALIA, "main"));

    await waitFor(() =>
      expect(
        deckCardCount(useDeckStore.getState().decks[KAALIA.id] ?? aDeck())
      ).toBe(2)
    );
  });

  it("after the add, opening Kaalia shows the card", async () => {
    const kaalia = savedDeck(KAALIA.id, KAALIA.name, [SOL_RING]);
    deckApi.seedDeck(kaalia);
    useDeckStore.setState((state) => ({
      decks: { ...state.decks, [KAALIA.id]: apiDeckToStoreDeck(kaalia) },
    }));
    const { result } = renderHookWithProviders(() =>
      useAddToOtherDeck(SMOTHERING_TITHE)
    );

    await act(() => result.current.addTo(KAALIA, "main"));
    await act(() => useDeckStore.getState().setActiveDeck(KAALIA.id));

    expect(
      useDeckStore.getState().decks[KAALIA.id]?.cards.map((card) => card.name)
    ).toEqual(["Sol Ring", "Smothering Tithe"]);
  });
});
