/**
 * What the import of an AI build's cards reports it could not write into the created deck (I-02).
 *
 * Deck building context. Scryfall answers at the network boundary through MSW, from the wizard's
 * recording (`@/lib/scryfall/fixtures/deck-wizard-v1`). The deck store's `addDeckCard` is a
 * hand-written stand-in, so a save that throws part-way through a batch can be staged; the wizard
 * flow test (`DeckWizard.flow.test.tsx`) covers the import with the real store.
 */
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { DeckCard } from "@/lib/deck/types";
import { logger } from "@/lib/logger";
import { WIZARD_COLLECTION_RECORDED } from "@/lib/scryfall/fixtures/deck-wizard-v1";
import type {
  ScryfallCard,
  ScryfallCollectionResponse,
} from "@/lib/scryfall/types";
import { setupMsw } from "@/test/msw";
import { importCardsInBatches, type ImportEntry } from "./built-deck-import";

const RECORDED_CARD_BY_NAME: ReadonlyMap<string, ScryfallCard> = new Map(
  WIZARD_COLLECTION_RECORDED.data.map((card) => [card.name, card])
);

const CollectionBody = z.object({
  identifiers: z.array(z.object({ name: z.string() })),
});

/** Scryfall's collection answer: the recorded cards it holds, the other names in `not_found`. */
function collectionAnswer(
  names: readonly string[]
): ScryfallCollectionResponse {
  return {
    object: "list",
    not_found: names
      .filter((name) => !RECORDED_CARD_BY_NAME.has(name))
      .map((name) => ({ name })),
    data: names.flatMap((name) => {
      const card = RECORDED_CARD_BY_NAME.get(name);
      return card ? [card] : [];
    }),
  };
}

/**
 * An import target whose `addDeckCard` writes every card but `refused`, whose save throws. It may
 * always write.
 */
function deckRefusing(refused: string) {
  const written: string[] = [];
  const addDeckCard = (card: DeckCard): Promise<void> => {
    if (card.name === refused) {
      return Promise.reject(new Error("addDeckCard threw"));
    }
    written.push(card.name);
    return Promise.resolve();
  };
  return {
    written,
    addDeckCard,
    onProgress: () => undefined,
    mayWrite: () => true,
  };
}

function entry(name: string, quantity = 1): ImportEntry {
  return { name, category: "other", quantity };
}

/** The names of each collection lookup Scryfall received, in order. */
let lookups: string[][] = [];

describe("importCardsInBatches", () => {
  setupMsw(
    http.post(
      "https://api.scryfall.com/cards/collection",
      async ({ request }) => {
        const names = CollectionBody.parse(
          await request.json()
        ).identifiers.map((id) => id.name);
        lookups.push(names);
        return HttpResponse.json(collectionAnswer(names));
      }
    )
  );

  beforeEach(() => {
    lookups = [];
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports no copy missing when every batch went through, a name Scryfall does not know included", async () => {
    const deck = deckRefusing("none");

    const report = await importCardsInBatches(
      [entry("Sol Ring"), entry("Talrand's Grand Archive")],
      deck
    );

    expect(report).toEqual({ copiesAdded: 1, copiesNotAdded: 0 });
    expect(deck.written).toEqual(["Sol Ring"]);
  });

  it("counts the copies of a batch left unwritten when a save throws part-way, not those written before", async () => {
    const deck = deckRefusing("Island");

    const report = await importCardsInBatches(
      [entry("Sol Ring"), entry("Island", 30), entry("Counterspell")],
      deck
    );

    // Sol Ring was written; the 30 Islands and Counterspell were not.
    expect(report).toEqual({ copiesAdded: 1, copiesNotAdded: 31 });
    expect(deck.written).toEqual(["Sol Ring"]);
    expect(logger.error).toHaveBeenCalledWith(
      "Batch import error",
      "DeckWizard",
      expect.any(Error)
    );
  });

  it("does not count a name Scryfall does not know when a save throws later in its batch", async () => {
    const deck = deckRefusing("Island");

    const report = await importCardsInBatches(
      [
        entry("Sol Ring"),
        entry("Talrand's Grand Archive", 2),
        entry("Island", 30),
        entry("Counterspell"),
      ],
      deck
    );

    // Scryfall knows no "Talrand's Grand Archive": it was never a card to add, so only the
    // 30 Islands and Counterspell are missing.
    expect(report).toEqual({ copiesAdded: 1, copiesNotAdded: 31 });
    expect(deck.written).toEqual(["Sol Ring"]);
  });

  it("writes nothing more once it may no longer write, counts every copy left, and looks no later batch up", async () => {
    const deck = deckRefusing("none");
    // The deck stops being the import's to write once Sol Ring is in it.
    const target = { ...deck, mayWrite: () => deck.written.length === 0 };
    const unknownNames = Array.from({ length: 73 }, (_, index) =>
      entry(`Unknown Card ${index + 1}`)
    );

    const report = await importCardsInBatches(
      [
        // The first batch of 75 names.
        entry("Sol Ring"),
        entry("Island", 30),
        ...unknownNames,
        // The second batch.
        entry("Counterspell"),
        entry("Talrand's Grand Archive", 2),
      ],
      target
    );

    // The first batch leaves its 30 Islands; Scryfall answered, so its unknown names are not
    // counted. The second batch is never looked up, so all 3 of its copies are left.
    expect(report).toEqual({ copiesAdded: 1, copiesNotAdded: 33 });
    expect(deck.written).toEqual(["Sol Ring"]);
    expect(lookups).toHaveLength(1);
  });
});
