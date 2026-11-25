/**
 * The bookkeeping behind the deck details a whole-deck save writes (the name,
 * the description, the target bracket, the manual bracket and the budget):
 * for each deck and detail, its last saved value and the saves still running
 * (I-01 slice 5, #1738).
 *
 * Why the last saved value and not the value on screen when a save starts:
 * two saves of one detail can overlap, and the second starts from the first's
 * value, which the server may never save. A failed save must not put that
 * value back. The card notes, category, quantity and zone follow the same rule
 * in `store.ts`.
 *
 * Why the newest running save decides what a failure shows: these saves are
 * not queued one behind the other, so an older save can still succeed after a
 * newer one failed. While it runs, its value is the one the screen shows.
 *
 * Pure: it holds values and answers what to show; the store applies them.
 */
import type { Deck } from "./types";

/** A deck detail saved through the whole-deck PATCH, which rolls back on its own. */
export type DeckDetailField =
  "name" | "description" | "targetBracket" | "manualBracket" | "budget";

/**
 * What a failed save leaves on screen: nothing to change, when a newer save
 * or another edit already replaced its value, or the value to put back.
 */
export type DetailRollback<Value> =
  | { readonly kind: "keep" }
  | { readonly kind: "restore"; readonly value: Value };

/** One running save of a deck detail, settled once by the store. */
export interface DetailSave<Value> {
  /** The server saved the value: it becomes the detail's last saved value. */
  succeeded(): void;
  /**
   * The server did not save the value.
   *
   * @param shown - the value the deck shows now
   * @returns what to show instead, when this save's value is still on screen
   */
  failed(shown: Value): DetailRollback<Value>;
}

/** The deck detail a save writes, and the values it moves between. */
export interface DetailSaveStart<Field extends DeckDetailField> {
  readonly deckId: string;
  readonly field: Field;
  /** The value the deck shows before this save; the last saved one when no save runs. */
  readonly shown: Deck[Field];
  readonly value: Deck[Field];
}

/** Every deck detail save of the store, and whether any still runs. */
export interface DeckDetailSaves {
  /** Records a save that starts now; the store settles it once its request answers. */
  begin<Field extends DeckDetailField>(
    start: DetailSaveStart<Field>
  ): DetailSave<Deck[Field]>;
  /** Whether a save of any deck detail is still running, for the save indicator. */
  hasPending(): boolean;
}

/** A detail's last saved value and its running saves, oldest first. */
interface DetailLedger<Value> {
  saved: Value;
  readonly running: { readonly value: Value }[];
}

type Ledgers = {
  readonly [Field in DeckDetailField]: Map<string, DetailLedger<Deck[Field]>>;
};

/**
 * What the screen should show once `failed` stopped running: the newest save
 * still running, or the last saved value when none runs.
 */
function rollbackAfter<Value>(
  ledger: DetailLedger<Value>,
  failed: { readonly value: Value },
  shown: Value
): DetailRollback<Value> {
  const wasNewest = ledger.running.at(-1) === failed;
  ledger.running.splice(ledger.running.indexOf(failed), 1);
  if (!wasNewest || shown !== failed.value) return { kind: "keep" };
  const newest = ledger.running.at(-1);
  return { kind: "restore", value: newest ? newest.value : ledger.saved };
}

/**
 * Creates the store's deck detail saves, with no save running.
 *
 * @returns the bookkeeping the store keeps for the life of the page
 */
export function createDeckDetailSaves(): DeckDetailSaves {
  const ledgers: Ledgers = {
    name: new Map(),
    description: new Map(),
    targetBracket: new Map(),
    manualBracket: new Map(),
    budget: new Map(),
  };

  function begin<Field extends DeckDetailField>({
    deckId,
    field,
    shown,
    value,
  }: DetailSaveStart<Field>): DetailSave<Deck[Field]> {
    const byDeck: Map<string, DetailLedger<Deck[Field]>> = ledgers[field];
    const ledger = byDeck.get(deckId) ?? { saved: shown, running: [] };
    byDeck.set(deckId, ledger);
    const save = { value };
    ledger.running.push(save);
    const forgetWhenIdle = () => {
      if (ledger.running.length === 0) byDeck.delete(deckId);
    };
    return {
      succeeded() {
        ledger.saved = value;
        ledger.running.splice(ledger.running.indexOf(save), 1);
        forgetWhenIdle();
      },
      failed(current) {
        const rollback = rollbackAfter(ledger, save, current);
        forgetWhenIdle();
        return rollback;
      },
    };
  }

  return {
    begin,
    hasPending: () => Object.values(ledgers).some((byDeck) => byDeck.size > 0),
  };
}
