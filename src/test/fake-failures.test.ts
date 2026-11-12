// @vitest-environment node
/**
 * Pins how the shared test doubles fail: the returned promise rejects, and
 * the call itself never throws.
 *
 * Why: the doubles stand in for async APIs. A Prisma client call and
 * next-intl's `getTranslations` report a failure by rejecting. A route that
 * chains `.catch(…)` on a query, or builds several queries before awaiting
 * them, sees a different flow when a double throws at the call. These tests
 * keep that contract while the doubles drop their `async` keyword
 * (SonarCloud S7503).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { collectionDb, collectionRow } from "./collection-db-fake";
import { CARDS_DECK, deckCardsDb } from "./deck-cards-db-fake";
import { deckCard } from "./playtest-db-fake";
import { getTranslations } from "./server-intl";

/** A double's call, and the error its promise must reject with. */
interface FailingCall {
  readonly name: string;
  readonly call: () => Promise<unknown>;
  readonly message: string;
}

const STORED_CARD = deckCard("Sol Ring");
const MISSING_CARD = { id: "card-missing" };
const DECK = { id: CARDS_DECK.id };
const MISSING_ROW = { id: "row-missing" };
const STORED_ROW = collectionRow();

/**
 * @param call - The double's call.
 * @returns The promise the call returned. The test fails if the call threw
 *   instead.
 */
function returnedPromise(call: () => Promise<unknown>): Promise<unknown> {
  let promise: Promise<unknown> = Promise.resolve();
  expect(() => {
    promise = call();
  }).not.toThrow();
  return promise;
}

beforeEach(() => {
  deckCardsDb.reset([STORED_CARD]);
  collectionDb.reset([STORED_ROW]);
});

describe("deckCardsDb", () => {
  const failures: readonly FailingCall[] = [
    {
      name: "deck.update after a planned deck failure",
      call: () => {
        deckCardsDb.failNextDeckTouch();
        return deckCardsDb.prisma.deck.update({ where: DECK, data: {} });
      },
      message: "deck update failed",
    },
    {
      name: "deck.update of a deck that is not stored",
      call: () =>
        deckCardsDb.prisma.deck.update({
          where: { id: "deck-missing" },
          data: {},
        }),
      message: "Record to update not found.",
    },
    {
      name: "deck.updateMany after a planned deck failure",
      call: () => {
        deckCardsDb.failNextDeckTouch();
        return deckCardsDb.prisma.deck.updateMany({
          where: DECK,
          data: { version: { increment: 1 }, updatedAt: new Date(0) },
        });
      },
      message: "deck update failed",
    },
    {
      name: "deckCard.create after a planned card failure",
      call: () => {
        deckCardsDb.failNextCardWrite();
        return deckCardsDb.prisma.deckCard.create({ data: {} });
      },
      message: "card write failed",
    },
    {
      name: "deckCard.update after a planned card failure",
      call: () => {
        deckCardsDb.failNextCardWrite();
        return deckCardsDb.prisma.deckCard.update({
          where: { id: STORED_CARD.id },
          data: {},
        });
      },
      message: "card write failed",
    },
    {
      name: "deckCard.update of a card that is not stored",
      call: () =>
        deckCardsDb.prisma.deckCard.update({ where: MISSING_CARD, data: {} }),
      message: "Record to update not found.",
    },
    {
      name: "deckCard.delete after a planned card failure",
      call: () => {
        deckCardsDb.failNextCardWrite();
        return deckCardsDb.prisma.deckCard.delete({
          where: { id: STORED_CARD.id },
        });
      },
      message: "card write failed",
    },
    {
      name: "deckCard.delete of a card that is not stored",
      call: () => deckCardsDb.prisma.deckCard.delete({ where: MISSING_CARD }),
      message: "Record to delete does not exist.",
    },
    {
      name: "deckCard.deleteMany after a planned card failure",
      call: () => {
        deckCardsDb.failNextCardWrite();
        return deckCardsDb.prisma.deckCard.deleteMany({ where: {} });
      },
      message: "card write failed",
    },
  ];

  it.each(failures)(
    "characterization: $name rejects, and the call does not throw",
    async ({ call, message }) => {
      await expect(returnedPromise(call)).rejects.toThrow(message);
    }
  );
});

describe("collectionDb", () => {
  const failures: readonly FailingCall[] = [
    {
      name: "update of a row that is not stored",
      call: () =>
        collectionDb.prisma.collectionCard.update({
          where: MISSING_ROW,
          data: {},
        }),
      message: "Record to update not found.",
    },
    {
      name: "delete after a planned failure",
      call: () => {
        collectionDb.failNextDelete();
        return collectionDb.prisma.collectionCard.delete({
          where: { id: STORED_ROW.id },
        });
      },
      message: "delete failed",
    },
    {
      name: "delete of a row that is not stored",
      call: () =>
        collectionDb.prisma.collectionCard.delete({ where: MISSING_ROW }),
      message: "Record to delete does not exist.",
    },
  ];

  it.each(failures)(
    "characterization: $name rejects, and the call does not throw",
    async ({ call, message }) => {
      await expect(returnedPromise(call)).rejects.toThrow(message);
    }
  );
});

describe("getTranslations (server-intl)", () => {
  it("characterization: a locale with no test catalog rejects, and the call does not throw", async () => {
    await expect(
      returnedPromise(() => getTranslations({ locale: "xx" }))
    ).rejects.toThrow('No test catalog for locale "xx"');
  });
});
