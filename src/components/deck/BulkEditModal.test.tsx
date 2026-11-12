/**
 * Bulk Edit saves the edited decklist against the deck the player already has.
 *
 * The deck API is replaced by an in-memory server so the test can observe the
 * rows that end up persisted; the deck store and the modal are the real ones.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { aScryfallCard } from "@/test/builders/scryfall";
import { renderWithIntl } from "@/test/render-with-intl";
import type {
  AddCardPayload,
  ApiDeck,
  ApiDeckCard,
  DeckCardChanges,
} from "@/lib/db/deck-api";
import { CARD_CATEGORIES, type Deck, type DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

interface FakeServer {
  rows: ApiDeckCard[];
  deck: Omit<ApiDeck, "cards">;
  nextRowId: number;
}

const server = vi.hoisted<FakeServer>(() => ({
  rows: [],
  deck: emptyServerDeck(),
  nextRowId: 1,
}));
const fetchInBatches = vi.hoisted(() => vi.fn());

/** The deck record, without cards, as a freshly created deck has it. */
function emptyServerDeck(): FakeServer["deck"] {
  return {
    id: "deck-1",
    name: "Atraxa Superfriends",
    format: "commander",
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    commanderId: null,
    commanderName: null,
    partnerId: null,
    companionId: null,
    pairingType: "none",
    companion: null,
    maybeboard: [],
  };
}

/** Builds the full deck response the API would return. */
function serverDeck(): ApiDeck {
  return { ...server.deck, cards: server.rows.map((row) => ({ ...row })) };
}

/** The command-zone slot a stored row fills, read from its flags like the deck loader does. */
function commandSlotOf(stored: ApiDeckCard): string {
  if (stored.isPartner) return "partner";
  if (stored.isCommander) return "commander";
  return stored.category === "companion" ? "companion" : "none";
}

/** Inserts a row the way the database would, notes empty and a fresh id. */
function insertRow(deckId: string, payload: AddCardPayload): ApiDeckCard {
  const inserted: ApiDeckCard = {
    id: `new-row-${server.nextRowId++}`,
    deckId,
    scryfallId: payload.scryfallId,
    name: payload.name,
    manaCost: payload.manaCost ?? "",
    cmc: payload.cmc ?? 0,
    typeLine: payload.typeLine ?? "",
    oracleText: payload.oracleText ?? "",
    colorIdentity: payload.colorIdentity ?? [],
    isGameChanger: payload.isGameChanger ?? false,
    isBanned: payload.isBanned ?? false,
    price: payload.price ?? null,
    imageUri: payload.imageUri ?? "",
    artCropUri: payload.artCropUri ?? "",
    category:
      CARD_CATEGORIES.find((category) => category === payload.category) ??
      "other",
    quantity: payload.quantity ?? 1,
    notes: null,
    isCommander: payload.isCommander ?? false,
    isPartner: payload.isPartner ?? false,
    zone: payload.zone ?? "main",
  };
  server.rows.push(inserted);
  return inserted;
}

// The whole client is faked, including the per-card calls the old
// remove-everything-and-re-add save made, so a return to it shows up here.
vi.mock(import("@/lib/deck/batch-fetch"), () => ({ fetchInBatches }));
vi.mock("@/lib/db/deck-api", () => ({
  fetchDeck: vi.fn(async () => serverDeck()),
  updateDeck: vi.fn(
    async (_deckId: string, patch: Partial<FakeServer["deck"]>) => {
      server.deck = { ...server.deck, ...patch };
      return serverDeck();
    }
  ),
  addCard: vi.fn(async (deckId: string, payload: AddCardPayload) =>
    insertRow(deckId, payload)
  ),
  removeCard: vi.fn(async (_deckId: string, cardId: string) => {
    server.rows = server.rows.filter((row) => row.id !== cardId);
  }),
  applyCardChanges: vi.fn(async (deckId: string, changes: DeckCardChanges) => {
    if (
      changes.removeCardIds.some(
        (id) => !server.rows.some((row) => row.id === id)
      )
    ) {
      throw new Error(
        "[applyCardChanges] HTTP 409: The deck changed since it was opened"
      );
    }
    const cleared = new Set<string>(changes.clearCommandSlots);
    server.rows = server.rows.filter((row) => !cleared.has(commandSlotOf(row)));
    const removed = new Set(changes.removeCardIds);
    const quantities = new Map(
      changes.quantityChanges.map((c) => [c.cardId, c.quantity])
    );
    server.rows = server.rows
      .filter((row) => !removed.has(row.id))
      .map((row) => ({
        ...row,
        quantity: quantities.get(row.id) ?? row.quantity,
      }));
    for (const payload of changes.addCards) insertRow(deckId, payload);
    server.deck = { ...server.deck, ...changes.commandZone };
    return serverDeck();
  }),
}));

import { BulkEditModal } from "./BulkEditModal";
import { useDeckStore } from "@/lib/deck/store";
import { apiDeckToStoreDeck } from "@/lib/deck/store-factories";

/** A persisted deck row with the printing and annotations the player chose. */
function row(
  overrides: Partial<ApiDeckCard> & Pick<ApiDeckCard, "id" | "name">
): ApiDeckCard {
  return {
    deckId: "deck-1",
    scryfallId: `${overrides.id}-printing`,
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
    category: "other",
    quantity: 1,
    notes: null,
    isCommander: false,
    isPartner: false,
    zone: "main",
    ...overrides,
  };
}

/** The default printing a Scryfall name lookup returns. */
function scryfallCard(name: string, typeLine = "Artifact"): ScryfallCard {
  return aScryfallCard({
    id: `${name.toLowerCase().replaceAll(/\W+/g, "-")}-default-printing`,
    name,
    type_line: typeLine,
    legalities: { commander: "legal" },
  });
}

function seedServer(rows: ApiDeckCard[]): void {
  server.nextRowId = 1;
  server.rows = rows;
  server.deck = {
    ...emptyServerDeck(),
    commanderId: "atraxa-printing",
    commanderName: "Atraxa, Praetors' Voice",
  };
}

function openStoreDeck(): Deck {
  const deck = apiDeckToStoreDeck(serverDeck());
  useDeckStore.setState({
    decks: { "deck-1": deck },
    activeDeckId: "deck-1",
    undoStack: [],
  });
  return deck;
}

function renderModal(deck: Deck): void {
  renderWithIntl(
    <BulkEditModal deck={deck}>
      <button type="button">Open bulk edit</button>
    </BulkEditModal>
  );
  fireEvent.click(screen.getByRole("button", { name: "Open bulk edit" }));
}

function persistedRow(name: string): ApiDeckCard | undefined {
  return server.rows.find((candidate) => candidate.name === name);
}

function storeCard(name: string): DeckCard | undefined {
  return useDeckStore
    .getState()
    .decks["deck-1"]?.cards.find((card) => card.name === name);
}

describe("BulkEditModal — saving an edited decklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchInBatches.mockImplementation(
      async (names: readonly { name: string }[]) =>
        names.map(({ name }) =>
          scryfallCard(
            name,
            name === "Forest" ? "Basic Land — Forest" : "Artifact"
          )
        )
    );
    seedServer([
      row({
        id: "atraxa-row",
        name: "Atraxa, Praetors' Voice",
        scryfallId: "atraxa-printing",
        typeLine: "Legendary Creature — Phyrexian Angel Horror",
        category: "commander",
        isCommander: true,
      }),
      row({
        id: "sol-ring-row",
        name: "Sol Ring",
        category: "ramp",
        notes: "always first",
      }),
      row({
        id: "signet-row",
        name: "Arcane Signet",
        category: "ramp",
        notes: "fixes all four",
      }),
      row({
        id: "forest-row",
        name: "Forest",
        typeLine: "Basic Land — Forest",
        category: "land",
        quantity: 10,
      }),
    ]);
  });

  it("keeps the printing, category and notes of every line the player did not touch", async () => {
    renderModal(openStoreDeck());
    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
    const text = textarea.value;

    fireEvent.change(textarea, {
      target: { value: text.replace("10 Forest", "9 Forest") },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(/Saved \d+ cards successfully/)
    ).toBeInTheDocument();
    expect(persistedRow("Sol Ring")).toMatchObject({
      id: "sol-ring-row",
      scryfallId: "sol-ring-row-printing",
      category: "ramp",
      notes: "always first",
    });
    expect(persistedRow("Arcane Signet")).toMatchObject({
      id: "signet-row",
      scryfallId: "signet-row-printing",
      notes: "fixes all four",
    });
    expect(persistedRow("Atraxa, Praetors' Voice")).toMatchObject({
      id: "atraxa-row",
      scryfallId: "atraxa-printing",
    });
    expect(persistedRow("Forest")).toMatchObject({
      id: "forest-row",
      quantity: 9,
    });
    await waitFor(() => expect(storeCard("Forest")?.quantity).toBe(9));
    expect(storeCard("Sol Ring")).toMatchObject({
      id: "sol-ring-row",
      notes: "always first",
    });
  });

  it("removes the rows of a line the player deleted", async () => {
    renderModal(openStoreDeck());
    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
    const text = textarea.value;

    fireEvent.change(textarea, {
      target: { value: text.replace("1 Arcane Signet\n", "") },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(/Saved \d+ cards successfully/)
    ).toBeInTheDocument();
    expect(persistedRow("Arcane Signet")).toBeUndefined();
    expect(persistedRow("Sol Ring")).toMatchObject({
      id: "sol-ring-row",
      notes: "always first",
    });
    expect(storeCard("Arcane Signet")).toBeUndefined();
  });

  it("adds a new line with the printing Scryfall returns, looking up only the new name", async () => {
    renderModal(openStoreDeck());
    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
    const text = textarea.value;

    fireEvent.change(textarea, {
      target: { value: `${text}\n\nSideboard\n2 Swiftfoot Boots` },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(/Saved \d+ cards successfully/)
    ).toBeInTheDocument();
    expect(fetchInBatches).toHaveBeenCalledExactlyOnceWith([
      { name: "Swiftfoot Boots" },
    ]);
    expect(persistedRow("Swiftfoot Boots")).toMatchObject({
      scryfallId: "swiftfoot-boots-default-printing",
      quantity: 2,
      zone: "sideboard",
    });
    expect(persistedRow("Sol Ring")).toMatchObject({
      id: "sol-ring-row",
      notes: "always first",
    });
    expect(storeCard("Swiftfoot Boots")).toMatchObject({
      zone: "sideboard",
      quantity: 2,
    });
  });

  it("saves nothing and names the lines Scryfall cannot find", async () => {
    fetchInBatches.mockImplementation(
      async (names: readonly { name: string }[]) =>
        names
          .filter(({ name }) => name !== "Sol Rnig")
          .map(({ name }) => scryfallCard(name))
    );
    renderModal(openStoreDeck());
    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
    const text = textarea.value;
    const before = structuredClone(server.rows);

    fireEvent.change(textarea, {
      target: {
        value: `${text.replace("1 Arcane Signet\n", "")}\n1 Sol Rnig\n1 Swiftfoot Boots`,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Sol Rnig");
    expect(alert).not.toHaveTextContent("Swiftfoot Boots");
    expect(server.rows).toEqual(before);
    expect(storeCard("Arcane Signet")).toMatchObject({ id: "signet-row" });
  });

  // Sonar S6819: the native <output> carries the status role, and the polite,
  // atomic announcement that role="status" implied stays explicit.
  it("reports the saved list in a polite, native status output", async () => {
    renderModal(openStoreDeck());
    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");

    fireEvent.change(textarea, {
      target: { value: textarea.value.replace("10 Forest", "9 Forest") },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        /Saved \d+ cards successfully/
      )
    );
    const status = screen.getByRole("status");
    expect(status).toBeInstanceOf(HTMLOutputElement);
    expect(status).not.toHaveAttribute("role");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
  });

  it("replaces a commander picked by hand, which the editor knows only by its printing", async () => {
    const deck = openStoreDeck();
    const commander = deck.commander;
    if (!commander) throw new Error("seeded deck has a commander");
    // setCommander keeps the printing id in the store, not the new row's id.
    const handPicked = {
      ...deck,
      commander: { ...commander, id: "atraxa-printing" },
    };
    useDeckStore.setState({ decks: { "deck-1": handPicked } });
    renderModal(handPicked);
    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");

    fireEvent.change(textarea, {
      target: {
        value: textarea.value.replace(
          "1 Atraxa, Praetors' Voice",
          "1 Breya, Etherium Shaper"
        ),
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(/Saved \d+ cards successfully/)
    ).toBeInTheDocument();
    expect(persistedRow("Atraxa, Praetors' Voice")).toBeUndefined();
    expect(persistedRow("Breya, Etherium Shaper")).toMatchObject({
      isCommander: true,
    });
  });

  it("replaces the commander in the same save, leaving the rest of the deck alone", async () => {
    renderModal(openStoreDeck());
    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
    const text = textarea.value;

    fireEvent.change(textarea, {
      target: {
        value: text.replace(
          "1 Atraxa, Praetors' Voice",
          "1 Breya, Etherium Shaper"
        ),
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(/Saved \d+ cards successfully/)
    ).toBeInTheDocument();
    expect(persistedRow("Atraxa, Praetors' Voice")).toBeUndefined();
    expect(persistedRow("Breya, Etherium Shaper")).toMatchObject({
      scryfallId: "breya-etherium-shaper-default-printing",
      category: "commander",
      isCommander: true,
      isPartner: false,
    });
    expect(server.deck).toMatchObject({
      commanderId: "breya-etherium-shaper-default-printing",
      commanderName: "Breya, Etherium Shaper",
      pairingType: "none",
    });
    expect(persistedRow("Sol Ring")).toMatchObject({
      id: "sol-ring-row",
      notes: "always first",
    });
    expect(useDeckStore.getState().decks["deck-1"]?.commander?.name).toBe(
      "Breya, Etherium Shaper"
    );
  });
});
