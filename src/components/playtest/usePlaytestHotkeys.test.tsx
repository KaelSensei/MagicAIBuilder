/**
 * The playtest's keys, pressed with a real keyboard inside the real playtest: each key sends the
 * command its button sends, so it writes one log line and is one undo step; no key fires while
 * the player types; the single-key switch turns the letters off; and nothing reaches the
 * builder's own shortcuts behind the playtest.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlaytestModal } from "./PlaytestModal";
import { usePlaytestStore } from "@/lib/playtest/store";
import type { PlaytestEngine } from "@/lib/playtest/engine";
import { useDeckStore } from "@/lib/deck/store";
import { useUIStore } from "@/lib/ui/store";
import { useShortcutPreferencesStore } from "@/lib/ui/shortcut-preferences";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { QuickAddPaletteHost } from "@/components/search/QuickAddPaletteHost";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { renderWithProviders } from "@/test/render";

// ─── Fixtures ─────────────────────────────────────────────────────────────
function makeCard(id: string): DeckCard {
  return aDeckCard({
    id,
    scryfallId: id,
    name: `Card ${id}`,
    category: "creature",
    cmc: 1,
    typeLine: "Creature",
  });
}

function makeDeck(size = 40): Deck {
  return aDeck({
    name: "Kenrith Goodstuff",
    format: "commander",
    commander: makeCard("cmd"),
    cards: Array.from({ length: size }, (_, index) => makeCard(`c${index}`)),
    cardRowCount: size + 1,
  });
}

const NO_RESULTS: readonly never[] = [];
const ignoreCard = (): void => undefined;

/** No commander, so quick add searches the whole Commander card pool. */
const COMMANDER_POOL = { legality: "commander", identityClause: "" };

/**
 * The builder page around the playtest: its global shortcuts are listening, and so is its
 * quick-add palette, which Ctrl/⌘+K opens.
 */
function BuilderWithPlaytest({ deck }: { readonly deck: Deck }) {
  useKeyboardShortcuts({ searchResults: NO_RESULTS, onAddCard: ignoreCard });
  return (
    <>
      <QuickAddPaletteHost scope={COMMANDER_POOL} onAdd={ignoreCard} />
      <PlaytestModal deck={deck} onClose={ignoreCard} />
    </>
  );
}

/** Opens the playtest over the builder and deals the opening hand. */
async function startGame(deck = makeDeck()) {
  const user = userEvent.setup();
  renderWithProviders(<BuilderWithPlaytest deck={deck} />);
  await user.click(screen.getByRole("button", { name: /draw opening hand/i }));
  return user;
}

function game(): PlaytestEngine {
  const { engine } = usePlaytestStore.getState();
  if (engine === null) throw new Error("the test expected a game in progress");
  return engine;
}

function firstHandCard(): HTMLElement {
  const [card] = screen.getAllByRole("button", { name: "Card back" });
  if (card === undefined) throw new Error("the test expected a hand card");
  return card;
}

beforeEach(() => {
  usePlaytestStore.setState({ engine: null, isActive: false, setup: null });
  useShortcutPreferencesStore.setState({ singleKeyShortcutsEnabled: true });
  useUIStore.setState({ showKeyboardModal: false, searchFocusSignal: 0 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── The keys ─────────────────────────────────────────────────────────────
describe("the playtest's keys", () => {
  it("D draws one card and writes one log line", async () => {
    const user = await startGame();
    const before = game();

    await user.keyboard("d");

    expect(game().hand).toHaveLength(before.hand.length + 1);
    expect(game().actionLog).toHaveLength(before.actionLog.length + 1);
    expect(game().actionLog.at(-1)?.description).toBe("Drew a card");
    expect(game().history).toHaveLength(before.history.length + 1);
  });

  it("N goes to the next turn", async () => {
    const user = await startGame();

    await user.keyboard("n");

    expect(game().turn).toBe(2);
  });

  it("S shuffles the library and writes Library shuffled", async () => {
    const user = await startGame();
    const before = game();

    await user.keyboard("s");

    expect(game().library).toHaveLength(before.library.length);
    expect(game().hand).toEqual(before.hand);
    expect(game().actionLog.at(-1)?.description).toBe("Library shuffled");
  });

  it("U untaps every permanent", async () => {
    const user = await startGame();
    await user.click(firstHandCard());
    await user.click(screen.getByRole("button", { name: /to battlefield/i }));
    await user.click(screen.getByRole("button", { name: "Tap" }));
    expect(game().battlefield.every((card) => card.tapped)).toBe(true);

    await user.keyboard("u");

    expect(game().battlefield.some((card) => card.tapped)).toBe(false);
  });

  it("G moves the focused hand card to the graveyard", async () => {
    const user = await startGame();
    const card = firstHandCard();
    const before = game();
    const [focusedId] = before.hand.map((handCard) => handCard.id);
    card.focus();

    await user.keyboard("g");

    expect(game().graveyard.map((dead) => dead.id)).toEqual([focusedId]);
    expect(game().hand).toHaveLength(before.hand.length - 1);
    expect(game().actionLog).toHaveLength(before.actionLog.length + 1);
  });

  it("E exiles the focused hand card, B puts it onto the battlefield", async () => {
    const user = await startGame();
    const [exiledId, playedId] = game().hand.map((card) => card.id);

    firstHandCard().focus();
    await user.keyboard("e");
    firstHandCard().focus();
    await user.keyboard("b");

    expect(game().exile.map((card) => card.id)).toEqual([exiledId]);
    expect(game().battlefield.map((card) => card.id)).toEqual([playedId]);
  });

  it("H returns a focused permanent to the hand, G puts one into the graveyard", async () => {
    const user = await startGame();
    const [bouncedId, killedId] = game().hand.map((card) => card.id);
    firstHandCard().focus();
    await user.keyboard("b");
    firstHandCard().focus();
    await user.keyboard("b");

    const permanents = screen.getAllByRole("button", { name: "Tap" });
    permanents[0]?.focus();
    await user.keyboard("h");
    screen.getByRole("button", { name: "Tap" }).focus();
    await user.keyboard("g");

    expect(game().battlefield).toEqual([]);
    expect(game().hand.at(-1)?.id).toBe(bouncedId);
    expect(game().graveyard.map((card) => card.id)).toEqual([killedId]);
  });

  it("a move key with no focused card does nothing", async () => {
    const user = await startGame();
    const before = game();

    await user.keyboard("g");

    expect(game()).toBe(before);
  });

  it("D on an empty library logs nothing new and the hand still says the deck is empty", async () => {
    const user = await startGame(makeDeck(6));
    const before = game();
    expect(before.library).toEqual([]);

    await user.keyboard("d");

    expect(game()).toBe(before);
    expect(screen.getByText("Deck empty")).toBeInTheDocument();
  });

  it("Ctrl+Z undoes the playtest's last step, as its Undo button does", async () => {
    const user = await startGame();
    const before = game();
    await user.keyboard("d");

    await user.keyboard("{Control>}z{/Control}");

    expect(game()).toBe(before);
  });
});

// ─── Not while typing, and the player's switch ───────────────────────────
describe("when the keys stay quiet", () => {
  it("no key fires while the action-log field has focus", async () => {
    const user = await startGame();
    const before = game();
    const field = screen.getByRole("textbox", {
      name: "Record a manual action, such as mana produced",
    });

    await user.type(field, "dngs");

    expect(field).toHaveValue("dngs");
    expect(game()).toBe(before);
  });

  it("no key fires while the life total field has focus", async () => {
    const user = await startGame();
    const before = game();
    const [lifeField] = within(screen.getByRole("dialog")).getAllByRole(
      "spinbutton"
    );
    if (lifeField === undefined) throw new Error("a life field expected");

    await user.type(lifeField, "3");
    await user.keyboard("d");

    expect(game().hand).toHaveLength(before.hand.length);
  });

  it("keys are off when the single-key switch is off; Ctrl+Z still works", async () => {
    const user = await startGame();
    useShortcutPreferencesStore.setState({ singleKeyShortcutsEnabled: false });
    const before = game();

    await user.keyboard("dns");
    expect(game()).toBe(before);

    await user.click(screen.getByRole("button", { name: "Draw card" }));
    await user.keyboard("{Control>}z{/Control}");
    expect(game()).toBe(before);
  });
});

// ─── The builder behind the playtest ──────────────────────────────────────
describe("the builder's shortcuts behind the playtest", () => {
  it("Ctrl+Z never undoes the deck while the playtest is open", async () => {
    const deckUndo = vi.fn(async () => undefined);
    useDeckStore.setState({ undo: deckUndo });
    const user = await startGame();
    await user.keyboard("d");

    await user.keyboard("{Control>}z{/Control}");

    expect(deckUndo).not.toHaveBeenCalled();
  });

  it("/ and ? do not act on the builder behind the playtest", async () => {
    const user = await startGame();

    await user.keyboard("/?");

    expect(useUIStore.getState().searchFocusSignal).toBe(0);
    expect(useUIStore.getState().showKeyboardModal).toBe(false);
  });

  it("Ctrl+S does not save the deck behind the playtest", async () => {
    const forceSave = vi.fn(async () => undefined);
    useDeckStore.setState({ forceSave });
    const user = await startGame();

    await user.keyboard("{Control>}s{/Control}");

    expect(forceSave).not.toHaveBeenCalled();
  });

  it("Ctrl+K does not open quick add behind the playtest", async () => {
    const user = await startGame();

    await user.keyboard("{Control>}k{/Control}");

    expect(
      screen.queryByRole("dialog", { name: "Quick add" })
    ).not.toBeInTheDocument();
  });
});
