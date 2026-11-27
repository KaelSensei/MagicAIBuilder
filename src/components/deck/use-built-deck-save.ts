"use client";

/**
 * The save step of the AI deck wizard: turns a finished build into a stored deck.
 *
 * Deck building context. Kept out of `DeckWizard.tsx` so the wizard holds the questions and the
 * screens, and this hook holds the writes: create the deck, activate it, resolve the commander,
 * import the cards, then show what could not be added, or the build's corrections, or open the
 * deck.
 *
 * When the server cannot create the deck, the built deck is held so the player can save it again:
 * a fresh build would cost another AI build from the player's allowance and another model call.
 * Each built deck gets one idempotency key, and every attempt to create it sends that key: when the
 * server stored the deck but its answer was lost, saving again answers the stored deck instead of
 * creating a second one (#1855). Only the creation is retried. Once the deck exists, a failed card
 * lookup, or a step that throws, stops on that deck instead (`unfinishedDeck`), with the build's
 * corrections: the player opens it to finish it by hand, and nothing offers a save that would store
 * a second deck (I-02). A commander the store could not save and a card the server refused are
 * swallowed by the store, so the deck still opens without them (B2-36).
 *
 * A save belongs to the session it started in, and `reset` starts a new one. A save still running
 * from an earlier session (the player reopened the wizard, or chose "Try again") changes nothing
 * the wizard shows and opens no deck when it ends. Nor does it touch the store's active deck, by
 * then the deck the player works on: its deck is created without being made the active deck, it
 * is opened only while its session is current, and its import stops at its next write. The deck
 * keeps what it already received. When its deck was created, its end is logged at info for
 * support (`logLateEnd`); a create that fails late is logged at error only, as in any session
 * (I-02, follow-up of #1984). In the current session too, the import writes only while its deck is
 * the store's active deck: when another deck opens during the import, the import stops, and the
 * deck ends as unfinished, which the player opens to finish (`DeckClaim`).
 *
 * @module deck/use-built-deck-save
 */
import { useCallback, useRef, useState } from "react";
import { countCopies } from "@/hooks/useAIDeckBuild";
import type { BuildResult } from "@/hooks/useAIDeckBuild";
import { useDeckStore, type DeckStore } from "@/lib/deck/store";
import { logger } from "@/lib/logger";
import {
  collapseEntries,
  importCardsInBatches,
  tryResolveCommander,
  type CardImportReport,
} from "./built-deck-import";

/** A finished build and the name its deck is stored under. */
export interface BuiltDeck {
  readonly name: string;
  readonly result: BuildResult;
}

/** A stored deck the server's card-data check changed: the player reads the changes before it opens. */
export interface CorrectedDeck {
  readonly deckId: string;
  readonly corrections: BuildResult["corrections"];
}

/**
 * A stored deck the save step could not finish: the player opens it and completes it by hand.
 * Offered instead of a new save, which would store a second deck.
 */
export interface UnfinishedDeck {
  readonly deckId: string;
  /** Copies the import could not add, or null when a step threw before they could be counted. */
  readonly cardsNotAdded: number | null;
  /**
   * What the server's card-data check changed in the build, empty when nothing. Kept here because
   * nothing else stores them: every correction is shown (I-02 spec, 2.2 and 5.3).
   */
  readonly corrections: BuildResult["corrections"];
}

/** A built deck and the idempotency key every attempt to create it sends. */
interface DeckToCreate {
  readonly deck: BuiltDeck;
  readonly idempotencyKey: string;
}

/** What the wizard reads from, and asks of, the save step. */
export interface BuiltDeckSave {
  /** Copies written to the deck so far. */
  readonly importedCount: number;
  /** Copies the import will write; 0 until the import starts. */
  readonly importTotal: number;
  /** Set once a corrected deck is stored; the wizard shows its corrections. */
  readonly correctedDeck: CorrectedDeck | null;
  /** Set once a stored deck could not be filled; the wizard offers to open it. */
  readonly unfinishedDeck: UnfinishedDeck | null;
  /** True while a built deck the server could not create waits for `retry`. */
  readonly saveFailed: boolean;
  /**
   * Stores the built deck, then calls `onComplete` with its id, unless it carries corrections or
   * could not be filled. Throws only what `onComplete` throws. When the server cannot create the
   * deck, it holds the deck and sets `saveFailed`; when the deck was created but a card lookup
   * failed or a later step threw, it sets `unfinishedDeck`, with the build's corrections. When a
   * `reset` came while it ran, it does none of this: its import writes nothing more and, when its
   * deck was created, it logs at info the deck's id, the copies the import added and did not add,
   * and why it stopped. A late failed create is logged at error only.
   */
  readonly save: (deck: BuiltDeck) => Promise<void>;
  /**
   * Saves the held deck again: the same name, cards, commander and corrections, with no new build.
   * Does nothing when no deck is held. Throws only what `onComplete` throws, as `save`.
   */
  readonly retry: () => Promise<void>;
  /**
   * Forgets the progress and the corrected, unfinished and held decks, for a fresh build, and ends
   * the save session: a save started before it writes nothing more into any deck, and shows
   * nothing and opens nothing when it ends.
   */
  readonly reset: () => void;
}

/** Copies an import has written, of the copies it will write. */
interface ImportProgress {
  readonly importedCount: number;
  /** 0 until an import starts. */
  readonly importTotal: number;
  /** Counts a new import of `total` copies from zero; `start(0)` clears the count. */
  readonly start: (total: number) => void;
  readonly setImportedCount: (count: number) => void;
}

/**
 * Counts the copies of the import. Importing 99 cards is ~65 serialized round trips; without a
 * counter the dialog looks frozen for the whole minute. `start` keeps one identity, so the save
 * step's `reset` does too: the wizard resets on open, once.
 */
function useImportProgress(): ImportProgress {
  const [importedCount, setImportedCount] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const start = useCallback((total: number) => {
    setImportTotal(total);
    setImportedCount(0);
  }, []);
  return { importedCount, importTotal, start, setImportedCount };
}

/** The save session a save started in. */
interface SaveSession {
  /** False once a `reset` came after the save started. */
  readonly isCurrent: () => boolean;
  /** `change`, made to do nothing once the session is over. */
  readonly guard: <Args extends readonly unknown[]>(
    change: (...args: Args) => void
  ) => (...args: Args) => void;
}

/** Hands each save the session it starts in; `renew` ends the current one. */
interface SaveSessions {
  readonly begin: () => SaveSession;
  readonly renew: () => void;
}

/**
 * Tells a save whether the wizard moved on since it started. The wizard's `reset` (on open, and on
 * "Try again") starts a new session; a save still running from an earlier one is late: its deck
 * stays stored, but what it ends with must not replace the new build's screen or open its own deck
 * in the middle of the new build (I-02).
 *
 * The count lives in a ref, not in state: a save compares the count it began with against the
 * latest one, which its render-time closure would not see. `renew` keeps one identity, so the save
 * step's `reset` does too.
 */
function useSaveSessions(): SaveSessions {
  const latest = useRef(0);
  const renew = useCallback(() => {
    latest.current += 1;
  }, []);
  const begin = (): SaveSession => {
    const started = latest.current;
    const isCurrent = () => latest.current === started;
    return {
      isCurrent,
      guard:
        (change) =>
        (...args) => {
          if (isCurrent()) change(...args);
        },
    };
  };
  return { begin, renew };
}

/**
 * `progress`, counting only while `session` is current: the counter is the wizard's, and a late
 * import would show its own deck's count on the new build's screen.
 */
function countedWithin(
  session: SaveSession,
  progress: ImportProgress
): ImportProgress {
  return {
    ...progress,
    start: session.guard(progress.start),
    setImportedCount: session.guard(progress.setImportedCount),
  };
}

/** The deck store's action that creates a deck, and what keeps the built deck when it fails. */
interface DeckCreation extends Pick<DeckStore, "createDeck"> {
  /** Keeps the built deck for "Try saving again"; does nothing once the save's session is over. */
  readonly hold: (attempt: DeckToCreate) => void;
}

/**
 * The new deck's id, or null when the server refused it and `hold` kept the deck.
 *
 * The deck is created without being made the active deck: the create can answer after a `reset`,
 * when another save's deck is open, so the save opens its deck itself, and only while its session
 * is current (`DeckClaim.open`).
 */
async function createOrHold(
  attempt: DeckToCreate,
  { createDeck, hold }: DeckCreation
): Promise<string | null> {
  try {
    return await createDeck(attempt.deck.name, {
      isAIGenerated: true,
      idempotencyKey: attempt.idempotencyKey,
      activate: false,
    });
  } catch (err) {
    logger.error("Deck create error", "DeckWizard", err);
    hold(attempt);
    return null;
  }
}

/**
 * Why a save stopped writing into the deck it created: the wizard was reset (reopened, or "Try
 * again"), or another deck became the store's active deck.
 */
type ImportStop = "wizardReset" | "activeDeckChanged";

/**
 * A save's claim on the deck it created. The store writes a card or a commander into its active
 * deck (`addDeckCard` and `setCommander` in `store.ts`), so a save writes only while it owns that
 * deck: its session is current, and its deck is still the active one. Otherwise its cards would
 * land in the deck the player works on now: the new build's deck, or a deck they opened (I-02,
 * #1984's QA).
 */
interface DeckClaim {
  /** Makes the deck the store's active deck, unless the save's session is over. */
  readonly open: () => Promise<void>;
  /** True while the save may write into its deck; false for good from the first check that fails. */
  readonly owns: () => boolean;
  /** Why `owns` turned false, or null while it has not. */
  readonly stoppedBy: () => ImportStop | null;
}

/**
 * The claim of the save running in `session` on the deck `deckId` it created. It reads the active
 * deck from the store at each check, not from a render: a write follows the store's state then.
 */
function claimDeck(
  deckId: string,
  session: SaveSession,
  setActiveDeck: DeckStore["setActiveDeck"]
): DeckClaim {
  let stop: ImportStop | null = null;
  const reasonToStop = (): ImportStop | null => {
    if (!session.isCurrent()) return "wizardReset";
    if (useDeckStore.getState().activeDeckId !== deckId) {
      return "activeDeckChanged";
    }
    return null;
  };
  return {
    open: () =>
      session.isCurrent() ? setActiveDeck(deckId) : Promise.resolve(),
    owns: () => {
      stop ??= reasonToStop();
      return stop === null;
    },
    stoppedBy: () => stop,
  };
}

/** The deck store's actions that fill a created deck, the save's claim on it, and its counter. */
interface DeckFill extends Pick<DeckStore, "setCommander" | "addDeckCard"> {
  readonly claim: DeckClaim;
  readonly progress: ImportProgress;
}

/**
 * Fills a created deck: opens it, sets the build's commander, then imports its cards, each write
 * only while the save owns the deck (`DeckClaim`).
 *
 * Never throws. The deck exists, so no failure may reach the wizard's "Try again": a new build
 * would store a second deck. A step that throws is logged, and the player reads the notice.
 *
 * @returns what the import added and did not add, or null when a store action threw before they
 * were counted. A commander that cannot be set and a card batch that fails do not throw:
 * `built-deck-import.ts` catches them. A commander left unseated is not counted.
 */
async function fillCreatedDeck(
  result: BuildResult,
  { claim, setCommander, addDeckCard, progress }: DeckFill
): Promise<CardImportReport | null> {
  try {
    await claim.open();

    // Read the commander off the build result, not off the build hook's
    // state: the caller's closure holds the render-time snapshot.
    if (result.commander) {
      await tryResolveCommander(result.commander, setCommander, claim.owns);
    }

    progress.start(countCopies(result.cards));
    return await importCardsInBatches(collapseEntries(result.cards), {
      addDeckCard,
      onProgress: progress.setImportedCount,
      mayWrite: claim.owns,
    });
  } catch (err) {
    logger.error("Built deck fill error", "DeckWizard", err);
    return null;
  }
}

/**
 * Logs, at info, how a save from an earlier session ended: nothing reaches the player, so this
 * line is support's trail. It holds the deck's id; `cardsAdded`, the copies the import handed to
 * the store for that deck, and `cardsNotAdded`, the copies it did not (both null when a step threw
 * before they were counted, and the store may still have dropped an added copy, B2-36); and
 * `stoppedBy`, why the import stopped writing before its end, or null when it ran to its end.
 */
function logLateEnd(
  deckId: string,
  report: CardImportReport | null,
  stoppedBy: ImportStop | null
): void {
  logger.info(
    "Built deck save ended after the wizard was reset",
    "DeckWizard",
    {
      deckId,
      cardsAdded: report?.copiesAdded ?? null,
      cardsNotAdded: report?.copiesNotAdded ?? null,
      stoppedBy,
    }
  );
}

/**
 * Holds the save step's progress and runs it.
 *
 * @param onComplete - Opens the stored deck
 */
export function useBuiltDeckSave(
  onComplete: (deckId: string) => void
): BuiltDeckSave {
  const { createDeck, setActiveDeck, addDeckCard, setCommander } =
    useDeckStore();
  const progress = useImportProgress();
  const { start: startImport } = progress;
  const sessions = useSaveSessions();
  const { renew: renewSession } = sessions;
  const [correctedDeck, setCorrectedDeck] = useState<CorrectedDeck | null>(
    null
  );
  const [unsavedDeck, setUnsavedDeck] = useState<DeckToCreate | null>(null);
  const [unfinishedDeck, setUnfinishedDeck] = useState<UnfinishedDeck | null>(
    null
  );

  const store = async (attempt: DeckToCreate): Promise<void> => {
    const session = sessions.begin();
    setUnsavedDeck(null);
    const deckId = await createOrHold(attempt, {
      createDeck,
      hold: session.guard(setUnsavedDeck),
    });
    if (deckId === null) return;
    const { result } = attempt.deck;
    const claim = claimDeck(deckId, session, setActiveDeck);
    const report = await fillCreatedDeck(result, {
      claim,
      setCommander,
      addDeckCard,
      progress: countedWithin(session, progress),
    });
    if (!session.isCurrent()) {
      logLateEnd(deckId, report, claim.stoppedBy());
      return;
    }

    // An incomplete deck says so first, its corrections under it: the player
    // has cards to add by hand.
    const cardsNotAdded = report === null ? null : report.copiesNotAdded;
    const { corrections } = result;
    if (cardsNotAdded === null || cardsNotAdded > 0) {
      setUnfinishedDeck({ deckId, cardsNotAdded, corrections });
    } else if (corrections.length > 0) {
      setCorrectedDeck({ deckId, corrections });
    } else {
      onComplete(deckId);
    }
  };

  // A new build is a new deck, so it gets a new key; a retry resends the held one.
  const save = (deck: BuiltDeck): Promise<void> =>
    store({ deck, idempotencyKey: crypto.randomUUID() });

  const retry = (): Promise<void> =>
    unsavedDeck ? store(unsavedDeck) : Promise.resolve();

  const reset = useCallback(() => {
    renewSession();
    startImport(0);
    setCorrectedDeck(null);
    setUnsavedDeck(null);
    setUnfinishedDeck(null);
  }, [renewSession, startImport]);

  return {
    importedCount: progress.importedCount,
    importTotal: progress.importTotal,
    correctedDeck,
    unfinishedDeck,
    saveFailed: unsavedDeck !== null,
    save,
    retry,
    reset,
  };
}
