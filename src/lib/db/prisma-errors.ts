/**
 * Recognising the Prisma errors that a caller handles instead of failing on.
 *
 * Shared kernel, next to the Prisma client (`lib/db/prisma.ts`). Today it
 * answers one question: did a write lose a race to a concurrent insert? The
 * idempotent create (`lib/db/create-once.ts`), the collection add route and
 * the Playwright user provisioning (`lib/auth/helpers.ts`) each read the
 * winner's row when it did.
 *
 * Error codes: https://www.prisma.io/docs/v6/orm/reference/error-reference
 * (Prisma 6, read 2026-11-11).
 *
 * @module db/prisma-errors
 */

/** P2002, "Unique constraint failed on the {constraint}". */
const UNIQUE_VIOLATION = "P2002";

/**
 * Whether a rejected Prisma write failed on a unique index, which in this app
 * means another request inserted the same key first.
 *
 * The check reads the `code` property and never uses
 * `instanceof Prisma.PrismaClientKnownRequestError`: the in-memory fakes in
 * `src/test/` and the route tests reject with a plain object or `Error` that
 * carries the code, and the check keeps this module free of the Prisma runtime.
 *
 * @param error - the reason a Prisma promise rejected with; any value
 * @returns false for anything that is not an object with code P2002
 */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === UNIQUE_VIOLATION
  );
}
