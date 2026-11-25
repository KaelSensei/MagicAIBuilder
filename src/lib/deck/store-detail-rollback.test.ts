/**
 * The deck details a whole-deck save writes — the name, the description, the
 * target bracket, the manual bracket and the budget — when saves of one detail
 * overlap (I-01 slice 5, #1738).
 *
 * A failed save puts the detail back to its last saved value, never to the
 * value on screen when that save started, which may itself never have been
 * saved. And the save indicator stays on while any of these saves runs.
 *
 * The fake deck API (`src/test/fake-deck-client.ts`) answers the store's
 * requests; each test holds the saves it overlaps and settles them in turn.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BracketLevel, Deck } from "@/lib/deck/types";
import { useDeckStore } from "@/lib/deck/store";
import { installFakeDeckClient } from "@/test/fake-deck-client";
import { recordToasts } from "@/test/toast-recorder";
import { aDeck } from "@/test/builders/deck";

const deckApi = installFakeDeckClient();
recordToasts();

const DECK_ID = "deck-1";

type HeldSave = PromiseWithResolvers<
  Awaited<ReturnType<typeof deckApi.updateDeck>>
>;

/** Holds the next whole-deck save open until the test settles it. */
function holdNextSave(): HeldSave {
  const pending: HeldSave = Promise.withResolvers();
  deckApi.updateDeck.mockReturnValueOnce(pending.promise);
  return pending;
}

function openDeck(): Deck {
  const deck = useDeckStore.getState().decks[DECK_ID];
  if (!deck) throw new Error("the open deck is gone");
  return deck;
}

/** One deck detail: how to save it, how to read it, and two unsaved values. */
interface DetailCase {
  readonly detail: string;
  readonly read: (deck: Deck) => unknown;
  /** The value `aDeck` holds, which the store treats as saved. */
  readonly saved: unknown;
  readonly saveFirst: () => Promise<void>;
  readonly first: unknown;
  readonly saveSecond: () => Promise<void>;
}

function bracketSave(
  save: (bracket: BracketLevel) => Promise<void>,
  bracket: BracketLevel
): () => Promise<void> {
  return () => save(bracket);
}

const store = () => useDeckStore.getState();

// prettier-ignore
const DETAILS: readonly DetailCase[] = [
  { detail: "name", read: (deck) => deck.name, saved: "Test Deck",
    saveFirst: () => store().renameDeck(DECK_ID, "Goblin Horde"), first: "Goblin Horde",
    saveSecond: () => store().renameDeck(DECK_ID, "Goblin Army") },
  { detail: "description", read: (deck) => deck.description, saved: "",
    saveFirst: () => store().updateDeckDescription(DECK_ID, "Go wide"), first: "Go wide",
    saveSecond: () => store().updateDeckDescription(DECK_ID, "Go tall") },
  { detail: "target bracket", read: (deck) => deck.targetBracket, saved: 3,
    saveFirst: bracketSave((b) => store().setTargetBracket(b), 4), first: 4,
    saveSecond: bracketSave((b) => store().setTargetBracket(b), 2) },
  { detail: "manual bracket", read: (deck) => deck.manualBracket, saved: null,
    saveFirst: bracketSave((b) => store().setManualBracket(b), 4), first: 4,
    saveSecond: bracketSave((b) => store().setManualBracket(b), 2) },
  { detail: "budget", read: (deck) => deck.budget, saved: null,
    saveFirst: () => store().setBudget(150), first: 150,
    saveSecond: () => store().setBudget(300) },
];

const cases = DETAILS.map((detail): [string, DetailCase] => [
  detail.detail,
  detail,
]);

beforeEach(() => {
  vi.clearAllMocks();
  useDeckStore.setState({
    decks: { [DECK_ID]: aDeck({ id: DECK_ID }) },
    activeDeckId: DECK_ID,
    isSyncing: false,
    undoStack: [],
  });
});

describe("overlapping saves of one deck detail", () => {
  it.each(cases)(
    "returns the %s to its last saved value when two overlapping saves both fail",
    async (_detail, { read, saved, saveFirst, saveSecond }) => {
      const firstSave = holdNextSave();
      const secondSave = holdNextSave();
      const first = saveFirst();
      const second = saveSecond();

      firstSave.reject(new Error("offline"));
      await first;
      secondSave.reject(new Error("offline"));
      await second;

      expect(read(openDeck())).toBe(saved);
    }
  );

  it.each(cases)(
    "returns the %s to its last saved value when the newer save fails before the older one",
    async (
      _detail,
      { read, saved, first: firstValue, saveFirst, saveSecond }
    ) => {
      const firstSave = holdNextSave();
      const secondSave = holdNextSave();
      const first = saveFirst();
      const second = saveSecond();

      secondSave.reject(new Error("offline"));
      await second;
      // The older save still runs, so its value is the one shown meanwhile.
      expect(read(openDeck())).toBe(firstValue);

      firstSave.reject(new Error("offline"));
      await first;
      expect(read(openDeck())).toBe(saved);
    }
  );

  it.each(cases)(
    "keeps the %s the older save stored when the newer one fails",
    async (_detail, { read, first: firstValue, saveFirst, saveSecond }) => {
      const firstSave = holdNextSave();
      const secondSave = holdNextSave();
      const first = saveFirst();
      const second = saveSecond();

      firstSave.resolve(await deckApi.createDeck("Test Deck"));
      await first;
      secondSave.reject(new Error("offline"));
      await second;

      expect(read(openDeck())).toBe(firstValue);
    }
  );

  it.each(cases)(
    "keeps the %s the older save stores after the newer one failed first",
    async (_detail, { read, first: firstValue, saveFirst, saveSecond }) => {
      const firstSave = holdNextSave();
      const secondSave = holdNextSave();
      const first = saveFirst();
      const second = saveSecond();

      secondSave.reject(new Error("offline"));
      await second;
      firstSave.resolve(await deckApi.createDeck("Test Deck"));
      await first;

      expect(read(openDeck())).toBe(firstValue);
    }
  );
});

describe("the save indicator while deck detail saves overlap", () => {
  it("stays on until both a description save and a budget save finish", async () => {
    const descriptionSave = holdNextSave();
    const description = store().updateDeckDescription(DECK_ID, "Go wide");
    await store().setBudget(150);

    expect(store().isSyncing).toBe(true);

    descriptionSave.resolve(await deckApi.createDeck("Test Deck"));
    await description;
    expect(store().isSyncing).toBe(false);
  });

  it("stays on until both a target bracket save and a budget save finish", async () => {
    const bracketSave = holdNextSave();
    const bracket = store().setTargetBracket(4);
    await store().setBudget(150);

    expect(store().isSyncing).toBe(true);

    bracketSave.reject(new Error("offline"));
    await bracket;
    expect(store().isSyncing).toBe(false);
  });
});
