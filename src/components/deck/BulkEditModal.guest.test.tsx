/**
 * Bulk Edit on the guest deck, which lives only in this browser.
 *
 * The real deck API client and store run here; no request may leave the page.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import deckMessages from "@/messages/en/deck.json";
import type { ScryfallCard } from "@/lib/scryfall/types";
import type { DeckCard } from "@/lib/deck/types";

const fetchInBatches = vi.hoisted(() => vi.fn());
vi.mock("@/lib/deck/batch-fetch", () => ({ fetchInBatches }));

import { BulkEditModal } from "./BulkEditModal";
import { useDeckStore } from "@/lib/deck/store";
import {
  createGuestDeck,
  GUEST_DECK_ID,
  loadGuestDeck,
} from "@/lib/deck/guest-deck";

/** A card the guest already chose, with a note. */
function guestCard(
  id: string,
  name: string,
  extra: Partial<DeckCard> = {}
): DeckCard {
  return {
    id,
    scryfallId: `${id}-printing`,
    name,
    manaCost: "",
    cmc: 0,
    typeLine: "Artifact",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "ramp",
    quantity: 1,
    notes: null,
    zone: "main",
    ...extra,
  };
}

function scryfallCard(name: string): ScryfallCard {
  return {
    id: `${name.toLowerCase().replaceAll(/\W+/g, "-")}-default-printing`,
    name,
    mana_cost: "",
    cmc: 0,
    type_line: "Artifact",
    oracle_text: "",
    color_identity: [],
    colors: [],
    set: "cmm",
    set_name: "Commander Masters",
    rarity: "common",
    prices: { usd: null, usd_foil: null, eur: null },
    keywords: [],
    legalities: { commander: "legal" },
  };
}

const network = vi.fn(async () => {
  throw new Error("the guest deck must not reach the server");
});

beforeEach(() => {
  vi.stubGlobal("fetch", network);
  fetchInBatches.mockImplementation(
    async (names: readonly { name: string }[]) =>
      names.map(({ name }) => scryfallCard(name))
  );
  const deck = {
    ...createGuestDeck(),
    cards: [
      guestCard("sol-ring", "Sol Ring", { notes: "always first" }),
      guestCard("signet", "Arcane Signet"),
    ],
    cardCount: 2,
  };
  useDeckStore.setState({
    decks: { [GUEST_DECK_ID]: deck },
    activeDeckId: GUEST_DECK_ID,
    undoStack: [],
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

it("applies a bulk edit to the guest deck in this browser", async () => {
  const deck = useDeckStore.getState().decks[GUEST_DECK_ID];
  if (!deck) throw new Error("guest deck missing");
  render(
    <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
      <BulkEditModal deck={deck}>
        <button type="button">Open bulk edit</button>
      </BulkEditModal>
    </NextIntlClientProvider>
  );
  fireEvent.click(screen.getByRole("button", { name: "Open bulk edit" }));
  const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
  const text = textarea.value;

  fireEvent.change(textarea, {
    target: {
      value: `${text.replace("1 Arcane Signet", "2 Arcane Signet")}\n\nSideboard\n1 Sol Ring`,
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(
    await screen.findByText(/Saved \d+ cards successfully/)
  ).toBeInTheDocument();
  expect(network).not.toHaveBeenCalled();
  const saved = loadGuestDeck();
  expect(saved?.cards).toEqual([
    expect.objectContaining({
      id: "sol-ring",
      scryfallId: "sol-ring-printing",
      notes: "always first",
      zone: "main",
    }),
    expect.objectContaining({ id: "signet", quantity: 2 }),
    expect.objectContaining({
      name: "Sol Ring",
      zone: "sideboard",
      scryfallId: "sol-ring-default-printing",
    }),
  ]);
});

it("swaps the guest deck's commander without touching its other cards", async () => {
  const start = useDeckStore.getState().decks[GUEST_DECK_ID];
  if (!start) throw new Error("guest deck missing");
  const deck = {
    ...start,
    commander: guestCard("atraxa", "Atraxa, Praetors' Voice", {
      category: "commander",
    }),
  };
  useDeckStore.setState({ decks: { [GUEST_DECK_ID]: deck } });
  render(
    <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
      <BulkEditModal deck={deck}>
        <button type="button">Open bulk edit</button>
      </BulkEditModal>
    </NextIntlClientProvider>
  );
  fireEvent.click(screen.getByRole("button", { name: "Open bulk edit" }));
  const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");

  fireEvent.change(textarea, {
    target: {
      value: textarea.value.replace(
        "Atraxa, Praetors' Voice",
        "Breya, Etherium Shaper"
      ),
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(
    await screen.findByText(/Saved \d+ cards successfully/)
  ).toBeInTheDocument();
  const saved = loadGuestDeck();
  expect(saved?.commander).toMatchObject({
    name: "Breya, Etherium Shaper",
    category: "commander",
  });
  expect(saved?.cards.map((card) => card.id)).toEqual(["sol-ring", "signet"]);
});
