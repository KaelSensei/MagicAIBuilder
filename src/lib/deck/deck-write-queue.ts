/**
 * The browser's half of the deck's optimistic lock (#1400): one queue of
 * writes per deck, each sent with the version the store holds when its turn
 * comes, adopting the version it is answered; and what follows a write the
 * server refused as stale.
 *
 * Why a queue rather than parallel writes: `expectedVersion` must be the
 * version the previous write answered. Two writes sent together would both
 * carry the version read before either, and the server would refuse the
 * second for a change this very tab made. Re-reading the version at send time
 * is only right once the previous answer is in, which the queue guarantees.
 * The server already queues the writes to one deck on the deck row's lock
 * (`deck-repository.ts`), so queuing them here costs the overlap of their
 * round trips, not their throughput.
 *
 * Why the writes planned before a refused one are dropped: the recovery that
 * follows a refusal reloads the deck, which takes their optimistic changes off
 * the screen. Sending them anyway would save changes the player no longer
 * sees. They fail with {@link DroppedDeckWriteError}, which their callers
 * treat as "roll back, say nothing": the refused write already reported the
 * conflict.
 *
 * This module knows nothing of the store or the HTTP client: it reads and
 * records versions through {@link DeckVersions}, and hands each write the
 * {@link DeckWriteTarget} the deck client takes.
 *
 * @module deck/deck-write-queue
 */
import type { DeckWriteTarget } from "./deck-repository-port";

/** The deck's new version beside a write's answer; absent for a guest deck, which keeps none. */
interface VersionedAnswer {
  readonly version?: number;
}

/**
 * The failure of a write planned before a stale write of the same deck was
 * refused: it was never sent, since the reload that followed took its change
 * off the screen. The conflict was reported by the refused write.
 */
export class DroppedDeckWriteError extends Error {
  constructor(readonly deckId: string) {
    super(`A write to deck ${deckId} was dropped after a conflict`);
    this.name = "DroppedDeckWriteError";
  }
}

/** How the queue reads and records the version the store holds for a deck. */
export interface DeckVersions {
  /** The version the store can vouch for, or undefined when it cannot. */
  readonly held: (deckId: string) => number | undefined;
  /** Records the version a write was answered. */
  readonly adopt: (deckId: string, version: number) => void;
  /** Records that the held version is stale and must not be sent again. */
  readonly forget: (deckId: string) => void;
}

/** The queue of one deck's writes, and how many of them were refused as stale. */
interface DeckLane {
  /** Settles, never rejects, when the last planned task has run. */
  tail: Promise<void>;
  /** Stepped by each refused write; a write planned under an older count is dropped. */
  conflicts: number;
}

/** A per-deck queue of versioned writes. */
export interface DeckWriteQueue {
  /**
   * Sends a versioned write once the deck's earlier writes have settled.
   *
   * @param deckId - the deck written
   * @param write - sends the request to the target: the deck, and the version
   *   the store holds at that moment, absent when it holds none; answers with
   *   the deck's new version
   * @returns the write's answer
   * @throws whatever `write` throws; {@link DroppedDeckWriteError} when a
   *   write of this deck planned earlier was refused as stale in between
   */
  readonly send: <Answer extends VersionedAnswer>(
    deckId: string,
    write: (target: DeckWriteTarget) => Promise<Answer>
  ) => Promise<Answer>;
  /**
   * Runs the recovery of a refused write once the writes planned before it
   * have been dropped, and before any write planned after it: a write made
   * after the recovery then carries the version the reload brought.
   *
   * @param deckId - the deck whose write was refused
   * @param reload - fetches the deck again and records what it holds
   */
  readonly recover: (
    deckId: string,
    reload: () => Promise<void>
  ) => Promise<void>;
}

const noop = (): void => undefined;

/**
 * The version an answer carries, read defensively: a 2xx body is JSON the
 * server shaped, but it may be `null` or lack the field (a guest deck's answer,
 * a test double), and neither should fail a write the server has saved.
 */
function answeredVersion(answer: unknown): number | undefined {
  if (typeof answer !== "object" || answer === null || !("version" in answer)) {
    return undefined;
  }
  return typeof answer.version === "number" ? answer.version : undefined;
}

/**
 * Creates a queue over the given version ledger.
 *
 * @param versions - how to read and record the version the store holds
 * @param isStale - tells a refusal for a stale write (409) from any other failure
 * @returns the queue; one per store
 */
export function createDeckWriteQueue(
  versions: DeckVersions,
  isStale: (error: unknown) => boolean
): DeckWriteQueue {
  const lanes = new Map<string, DeckLane>();

  const laneOf = (deckId: string): DeckLane => {
    const existing = lanes.get(deckId);
    if (existing) return existing;
    const lane: DeckLane = { tail: Promise.resolve(), conflicts: 0 };
    lanes.set(deckId, lane);
    return lane;
  };

  /** Runs `task` after the deck's planned tasks, whatever their outcome. */
  const enqueue = <Result>(
    deckId: string,
    task: () => Promise<Result>
  ): Promise<Result> => {
    const lane = laneOf(deckId);
    const turn = lane.tail.then(task);
    lane.tail = turn.then(noop, noop);
    return turn;
  };

  return {
    send: (deckId, write) => {
      const lane = laneOf(deckId);
      const plannedUnder = lane.conflicts;
      return enqueue(deckId, async () => {
        if (lane.conflicts !== plannedUnder) {
          throw new DroppedDeckWriteError(deckId);
        }
        try {
          const answer = await write({
            deckId,
            expectedVersion: versions.held(deckId),
          });
          const version = answeredVersion(answer);
          if (version !== undefined) versions.adopt(deckId, version);
          return answer;
        } catch (error) {
          if (isStale(error)) {
            lane.conflicts += 1;
            versions.forget(deckId);
          }
          throw error;
        }
      });
    },
    recover: (deckId, reload) => enqueue(deckId, reload),
  };
}
