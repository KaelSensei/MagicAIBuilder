/**
 * The per-deck write queue behind the browser's half of the deck's optimistic
 * lock: the version each write carries, the one it leaves behind, and what
 * happens to the writes planned before a refused one.
 */
import { describe, expect, it, vi } from "vitest";

import type { DeckWriteTarget } from "./deck-repository-port";
import {
  createDeckWriteQueue,
  DroppedDeckWriteError,
  type DeckVersions,
} from "./deck-write-queue";

class StaleError extends Error {}
const isStale = (error: unknown): boolean => error instanceof StaleError;

/** A version ledger the queue reads and writes, one entry per deck. */
function ledger(initial: Record<string, number | undefined>) {
  const held = new Map(Object.entries(initial));
  const versions: DeckVersions = {
    held: (deckId) => held.get(deckId),
    adopt: (deckId, version) => {
      held.set(deckId, version);
    },
    forget: (deckId) => {
      held.delete(deckId);
    },
  };
  return { versions, held };
}

/** A promise settled by hand, to hold a write in flight. */
function gate<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("deck write queue — the version a write carries", () => {
  it("sends the version held when the write's turn comes and adopts the answered one", async () => {
    const { versions, held } = ledger({ "deck-1": 7 });
    const queue = createDeckWriteQueue(versions, isStale);
    const write = vi.fn(async ({ expectedVersion }: DeckWriteTarget) => ({
      expectedVersion,
      version: 8,
    }));

    const answer = await queue.send("deck-1", write);

    expect(write).toHaveBeenCalledWith({
      deckId: "deck-1",
      expectedVersion: 7,
    });
    expect(answer.version).toBe(8);
    expect(held.get("deck-1")).toBe(8);
  });

  it("gives two writes planned together consecutive versions, the second waiting for the first's answer", async () => {
    const { versions } = ledger({ "deck-1": 7 });
    const queue = createDeckWriteQueue(versions, isStale);
    const first = gate<{ version: number }>();
    const sent: (number | undefined)[] = [];
    const record = ({ expectedVersion }: DeckWriteTarget) => {
      sent.push(expectedVersion);
    };

    const a = queue.send("deck-1", (target) => {
      record(target);
      return first.promise;
    });
    const b = queue.send("deck-1", async (target) => {
      record(target);
      return { version: 9 };
    });
    await Promise.resolve();
    expect(sent).toEqual([7]);

    first.resolve({ version: 8 });
    await Promise.all([a, b]);

    expect(sent).toEqual([7, 8]);
  });

  it("keeps the writes of two decks apart", async () => {
    const { versions } = ledger({ "deck-1": 1, "deck-2": 5 });
    const queue = createDeckWriteQueue(versions, isStale);
    const slow = gate<{ version: number }>();

    const a = queue.send("deck-1", () => slow.promise);
    const b = await queue.send("deck-2", async ({ expectedVersion }) => ({
      expectedVersion,
      version: 6,
    }));

    expect(b.expectedVersion).toBe(5);
    slow.resolve({ version: 2 });
    await a;
  });

  it("sends no version for a deck whose version it does not hold, and adopts none from an answer that carries none", async () => {
    const { versions, held } = ledger({});
    const queue = createDeckWriteQueue(versions, isStale);
    const write = vi.fn(async (_target: DeckWriteTarget) => ({}));

    await queue.send("guest", write);

    expect(write).toHaveBeenCalledWith({
      deckId: "guest",
      expectedVersion: undefined,
    });
    expect(held.has("guest")).toBe(false);
  });

  it("lets a failed write through to its caller and keeps the held version", async () => {
    const { versions, held } = ledger({ "deck-1": 7 });
    const queue = createDeckWriteQueue(versions, isStale);

    await expect(
      queue.send("deck-1", () => Promise.reject(new Error("offline")))
    ).rejects.toThrow("offline");

    expect(held.get("deck-1")).toBe(7);
  });
});

describe("deck write queue — a refused write", () => {
  it("forgets the held version, so nothing stale is sent again", async () => {
    const { versions, held } = ledger({ "deck-1": 7 });
    const queue = createDeckWriteQueue(versions, isStale);

    await expect(
      queue.send("deck-1", () => Promise.reject(new StaleError("stale")))
    ).rejects.toBeInstanceOf(StaleError);

    expect(held.has("deck-1")).toBe(false);
  });

  it("drops the writes planned before it, unsent", async () => {
    const { versions } = ledger({ "deck-1": 7 });
    const queue = createDeckWriteQueue(versions, isStale);
    const later = vi.fn(async () => ({ version: 9 }));

    const refused = queue.send("deck-1", () =>
      Promise.reject(new StaleError("stale"))
    );
    const dropped = queue.send("deck-1", later);

    await expect(refused).rejects.toBeInstanceOf(StaleError);
    await expect(dropped).rejects.toBeInstanceOf(DroppedDeckWriteError);
    expect(later).not.toHaveBeenCalled();
  });

  it("runs the recovery after the dropped writes and before the writes planned after it", async () => {
    const { versions } = ledger({ "deck-1": 7 });
    const queue = createDeckWriteQueue(versions, isStale);
    const order: string[] = [];

    const refused = queue.send("deck-1", () =>
      Promise.reject(new StaleError("stale"))
    );
    const dropped = queue.send("deck-1", async () => {
      order.push("dropped");
      return {};
    });
    await refused.catch(() => undefined);
    const recovered = queue.recover("deck-1", async () => {
      order.push("reload");
      versions.adopt("deck-1", 12);
    });
    const next = queue.send("deck-1", async ({ expectedVersion }) => {
      order.push(`next:${expectedVersion}`);
      return { version: 13 };
    });

    await dropped.catch(() => undefined);
    await Promise.all([recovered, next]);

    expect(order).toEqual(["reload", "next:12"]);
  });
});
