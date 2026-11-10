/** Prisma's error code for a unique-constraint violation. */
const UNIQUE_VIOLATION = "P2002";

/**
 * @param error - a rejected Prisma write's reason
 * @returns whether the write lost a race to a concurrent insert
 */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === UNIQUE_VIOLATION
  );
}

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
