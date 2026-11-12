/**
 * Idempotent creates: a row written at most once per idempotency key, so a
 * client may retry a create without making a duplicate.
 *
 * Shared kernel beside the Prisma client. `POST /api/decks` uses it with the
 * `Idempotency-Key` header. The race between two requests carrying the same
 * key is settled by a unique index, recognised with `isUniqueViolation`.
 *
 * @module db/create-once
 */
import { isUniqueViolation } from "./prisma-errors";

/** The row, and whether this call wrote it or found an earlier one. */
export interface CreateOnceResult<T> {
  readonly row: T;
  readonly created: boolean;
}

interface CreateOnceOperations<T> {
  /** Looks up the row an earlier request with the same key wrote. */
  readonly findExisting: () => Promise<T | null>;
  /** Writes the row; a unique index on the key must back it. */
  readonly create: () => Promise<T>;
}

/**
 * Writes a row at most once per idempotency key.
 *
 * An earlier row is returned as it is. Two requests racing past the lookup
 * both try to insert; the unique index lets one win, and the loser returns
 * the winner's row instead of failing.
 *
 * @param operations - the lookup by key and the create that stores the key
 * @returns the row and whether this call created it
 */
export async function createOnce<T>(
  operations: CreateOnceOperations<T>
): Promise<CreateOnceResult<T>> {
  const existing = await operations.findExisting();
  if (existing) return { row: existing, created: false };

  try {
    return { row: await operations.create(), created: true };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const winner = await operations.findExisting();
    if (!winner) throw error;
    return { row: winner, created: false };
  }
}
