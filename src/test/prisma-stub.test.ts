// @vitest-environment node
/**
 * Pins `stubPrisma`, the typed stand-in that `vi.mock(import("@/lib/db/prisma"))`
 * factories return. The client below is the real one from `@/lib/db/prisma`;
 * it is never connected, because every member a test reads comes from the stub.
 */
import { describe, expect, it, vi } from "vitest";
import * as prismaModule from "@/lib/db/prisma";
import { stubPrisma } from "./prisma-stub";

describe("stubPrisma", () => {
  it("answers each listed model and client method with the stub the test passed", () => {
    const deck = { findMany: vi.fn() };
    const transaction = vi.fn();

    const { prisma } = stubPrisma(prismaModule, {
      deck,
      $transaction: transaction,
    });

    expect(prisma.deck).toBe(deck);
    expect(prisma.$transaction).toBe(transaction);
  });

  it("leaves every member the test did not list undefined, so a stray query fails instead of reaching a database", () => {
    const { prisma } = stubPrisma(prismaModule, {
      deck: { findMany: vi.fn() },
    });

    expect(prisma.user).toBeUndefined();
    expect(prisma.$connect).toBeUndefined();
    expect(prisma.$queryRaw).toBeUndefined();
  });

  it("rejects, at compile time, a model or an operation the generated client does not have", () => {
    // Each call compiles only because of its `@ts-expect-error`; `tsc` fails
    // if the stub ever stops checking the names against the generated client.
    const unknownModel = () =>
      stubPrisma(prismaModule, {
        // @ts-expect-error `decks` is not a model of the generated client
        decks: { findMany: vi.fn() },
      });
    const unknownOperation = () =>
      stubPrisma(prismaModule, {
        // @ts-expect-error `findEverything` is not an operation of the Deck delegate
        deck: { findEverything: vi.fn() },
      });

    expect(unknownModel().prisma.deck).toBeUndefined();
    expect(unknownOperation().prisma.user).toBeUndefined();
  });
});
