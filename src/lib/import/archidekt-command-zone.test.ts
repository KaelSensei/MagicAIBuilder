/**
 * Archidekt command zone: which cards of Archidekt's "Commander" category import with a command
 * flag. The rule is the one Moxfield, AetherHub and MTGTop8 share: the first card is the
 * commander, the second the partner, and any later card joins the main deck unflagged.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import * as http from "@/lib/http";
import { importFromUrl, type UrlImportCard } from "./url-import";

interface ArchidektCardAnswer {
  readonly name: string;
  readonly categories: readonly string[];
  readonly quantity?: number;
}

interface ArchidektCategoryAnswer {
  readonly name: string;
  readonly includedInDeck: boolean;
}

/**
 * Answers the next HTTP request with an Archidekt deck API payload, shaped like the
 * `ArchidektDeck` interface the importer reads.
 */
function answerWithArchidektDeck(
  cards: readonly ArchidektCardAnswer[],
  categories: readonly ArchidektCategoryAnswer[] = []
): void {
  vi.spyOn(http, "httpGet").mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        name: "Command zone",
        deckFormat: 3,
        categories,
        cards: cards.map((card) => ({
          quantity: card.quantity ?? 1,
          categories: card.categories,
          card: { oracleCard: { name: card.name } },
        })),
      }),
      { status: 200 }
    )
  );
}

const commander = (name: string): UrlImportCard => ({
  name,
  quantity: 1,
  isCommander: true,
  isPartner: false,
  zone: "main",
});

const partner = (name: string): UrlImportCard => ({
  name,
  quantity: 1,
  isCommander: false,
  isPartner: true,
  zone: "main",
});

const mainDeckCard = (name: string): UrlImportCard => ({
  name,
  quantity: 1,
  isCommander: false,
  isPartner: false,
  zone: "main",
});

describe("Archidekt command zone import", () => {
  afterEach(() => vi.restoreAllMocks());

  it("imports one commander, one partner and one main-deck card from three cards in Commander", async () => {
    answerWithArchidektDeck([
      { name: "Thrasios, Triton Hero", categories: ["Commander"] },
      { name: "Tymna the Weaver", categories: ["Commander"] },
      { name: "Lurrus of the Dream-Den", categories: ["Commander"] },
    ]);

    const imported = await importFromUrl("https://archidekt.com/decks/901");

    // CR 903.3: a deck has one commander, or two with partner (CR 702.124a); a third card
    // filed under Commander fills no command slot, as Moxfield's third `commanders` entry.
    expect(imported.cards).toEqual([
      commander("Thrasios, Triton Hero"),
      partner("Tymna the Weaver"),
      mainDeckCard("Lurrus of the Dream-Den"),
    ]);
  });

  it("files a third Commander card exactly as Moxfield files its third commanders entry", async () => {
    const thirdName = "Lurrus of the Dream-Den";
    vi.spyOn(http, "httpGet").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          name: "Three commanders",
          format: "commander",
          boards: {
            commanders: {
              cards: {
                a: { quantity: 1, card: { name: "Thrasios, Triton Hero" } },
                b: { quantity: 1, card: { name: "Tymna the Weaver" } },
                c: { quantity: 1, card: { name: thirdName } },
              },
            },
          },
        }),
        { status: 200 }
      )
    );
    const fromMoxfield = await importFromUrl(
      "https://moxfield.com/decks/three-commanders"
    );
    answerWithArchidektDeck([
      { name: "Thrasios, Triton Hero", categories: ["Commander"] },
      { name: "Tymna the Weaver", categories: ["Commander"] },
      { name: thirdName, categories: ["Commander"] },
    ]);

    const fromArchidekt = await importFromUrl(
      "https://archidekt.com/decks/906"
    );

    expect(fromArchidekt.cards).toEqual(fromMoxfield.cards);
  });

  it("counts only Commander cards when ranking the command zone", async () => {
    answerWithArchidektDeck([
      { name: "Sol Ring", categories: ["Ramp"] },
      { name: "Kraum, Ludevic's Opus", categories: ["Commander"] },
      { name: "Island", categories: [] },
      { name: "Tymna the Weaver", categories: ["Commander"] },
      { name: "Faceless One", categories: ["Commander"] },
      { name: "Wilson, Refined Grizzly", categories: ["Commander"] },
    ]);

    const imported = await importFromUrl("https://archidekt.com/decks/902");

    expect(imported.cards).toEqual([
      mainDeckCard("Sol Ring"),
      commander("Kraum, Ludevic's Opus"),
      mainDeckCard("Island"),
      partner("Tymna the Weaver"),
      mainDeckCard("Faceless One"),
      mainDeckCard("Wilson, Refined Grizzly"),
    ]);
  });

  it("imports a single card in Commander as the commander", async () => {
    answerWithArchidektDeck([
      { name: "Atraxa, Praetors' Voice", categories: ["Commander"] },
      { name: "Sol Ring", categories: ["Ramp"] },
    ]);

    const imported = await importFromUrl("https://archidekt.com/decks/903");

    expect(imported.cards).toEqual([
      commander("Atraxa, Praetors' Voice"),
      mainDeckCard("Sol Ring"),
    ]);
  });

  it("imports two cards in Commander as the commander then the partner, in Archidekt's order", async () => {
    answerWithArchidektDeck([
      { name: "Tymna the Weaver", categories: ["Commander"] },
      { name: "Thrasios, Triton Hero", categories: ["Commander"] },
    ]);

    const imported = await importFromUrl("https://archidekt.com/decks/904");

    expect(imported.cards).toEqual([
      commander("Tymna the Weaver"),
      partner("Thrasios, Triton Hero"),
    ]);
  });

  it("keeps a Commander card in the main deck even when it also sits in a category the deck does not run", async () => {
    answerWithArchidektDeck(
      [
        {
          name: "Kenrith, the Returned King",
          categories: ["Considering", "Commander"],
        },
        { name: "Ponder", categories: ["Considering"] },
      ],
      [
        { name: "Commander", includedInDeck: true },
        { name: "Considering", includedInDeck: false },
      ]
    );

    const imported = await importFromUrl("https://archidekt.com/decks/905");

    // Unchanged by this fix: the Commander category wins over a not-included one.
    expect(imported.cards).toEqual([
      commander("Kenrith, the Returned King"),
      { ...mainDeckCard("Ponder"), zone: "maybeboard" },
    ]);
  });
});
