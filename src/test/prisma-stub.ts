/**
 * A typed stand-in for `@/lib/db/prisma`, for the factories of
 * `vi.mock(import("@/lib/db/prisma"), …)` in route and server tests.
 *
 * Why: the typed mock form checks a factory against the real module
 * (ADR 0005, rule 5), so its `prisma` export must be a whole `PrismaClient`.
 * A test answers only the few calls its subject makes. `stubPrisma` wraps the
 * real client, which is never connected, in a `Proxy`: the members the test
 * lists answer, and every other member is `undefined`, as with the plain
 * object these factories returned before. A stray query therefore throws
 * instead of reaching a database. A `Proxy` has the type of its target, so no
 * cast is needed.
 *
 * ```ts
 * vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
 *   const { stubPrisma } = await import("@/test/prisma-stub");
 *   return stubPrisma(await importOriginal(), { deck: { findMany } });
 * });
 * ```
 *
 * The helper is imported inside the factory because Vitest hoists `vi.mock`
 * above the file's imports. New tests should prefer an in-memory fake behind
 * a port (ADR 0005, rule 3); this stub keeps the existing mocks typed until
 * their context migrates.
 */
import type { PrismaClient } from "@prisma/client";

/**
 * The members a test answers, by name: model delegates (`deck`, `user`) with
 * the operations it stubs, and client methods (`$transaction`, `$queryRaw`).
 * Names are checked against the generated client, so a renamed model or
 * operation fails `tsc`; the values are the test's own doubles.
 */
export type PrismaStubMembers = {
  readonly [Member in keyof PrismaClient]?: PrismaClient[Member] extends (
    ...args: never[]
  ) => unknown
    ? unknown
    : { readonly [Operation in keyof PrismaClient[Member]]?: unknown };
};

/**
 * Builds the `@/lib/db/prisma` module a mock factory returns.
 *
 * @param original The real module, from the factory's `importOriginal()`.
 *   Its client only serves as the `Proxy` target; it is never called.
 * @param members What the test answers. Any other member reads as
 *   `undefined`.
 * @returns The module, whose `prisma` answers only `members`.
 */
export function stubPrisma(
  original: { readonly prisma: PrismaClient },
  members: PrismaStubMembers
): { prisma: PrismaClient } {
  const answers = new Map<PropertyKey, unknown>(Object.entries(members));
  return {
    prisma: new Proxy(original.prisma, {
      get: (_client, property) => answers.get(property),
    }),
  };
}
