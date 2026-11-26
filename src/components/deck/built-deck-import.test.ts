/**
 * What the import of an AI build's cards reports it could not write into the created deck (I-02).
 *
 * Deck building context. Scryfall answers at the network boundary through MSW, from the wizard's
 * recording (`@/lib/scryfall/fixtures/deck-wizard-v1`). The deck store's `addDeckCard` is a
 * hand-written stand-in, so a save that throws part-way through a batch can be staged; the wizard
 * flow test (`DeckWizard.flow.test.tsx`) covers the import with the real store.
 */
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

/** The store's `addDeckCard`, writing every card but `refused`, whose save throws. */
function deckRefusing(refused: string) {
  const written: string[] = [];
  const addDeckCard = (card: DeckCard): Promise<void> => {
    if (card.name === refused) {
      return Promise.reject(new Error("addDeckCard threw"));
    }
    written.push(card.name);
    return Promise.resolve();
  };
  return { written, addDeckCard };
}

function entry(name: string, quantity = 1): ImportEntry {
  return { name, category: "other", quantity };
}

describe("importCardsInBatches", () => {
  setupMsw(
    http.post(
      "https://api.scryfall.com/cards/collection",
      async ({ request }) => {
        const names = CollectionBody.parse(
          await request.json()
        ).identifiers.map((id) => id.name);
        return HttpResponse.json(collectionAnswer(names));
      }
    )
  );

  beforeEach(() => {
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });

  it("reports no copy missing when every batch went through, a name Scryfall does not know included", async () => {
    const deck = deckRefusing("none");

    const report = await importCardsInBatches(
      [entry("Sol Ring"), entry("Talrand's Grand Archive")],
      deck.addDeckCard,
      () => undefined
    );

    expect(report).toEqual({ copiesNotAdded: 0 });
    expect(deck.written).toEqual(["Sol Ring"]);
  });

  it("counts the copies of a batch left unwritten when a save throws part-way, not those written before", async () => {
    const deck = deckRefusing("Island");

    const report = await importCardsInBatches(
      [entry("Sol Ring"), entry("Island", 30), entry("Counterspell")],
      deck.addDeckCard,
      () => undefined
    );

    // Sol Ring was written; the 30 Islands and Counterspell were not.
    expect(report).toEqual({ copiesNotAdded: 31 });
    expect(deck.written).toEqual(["Sol Ring"]);
    expect(logger.error).toHaveBeenCalledWith(
      "Batch import error",
      "DeckWizard",
      expect.any(Error)
    );
  });
});
