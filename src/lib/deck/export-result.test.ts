/**
 * The export contract (I-50 requirement 1): every target returns its content,
 * a file name, a MIME type and a notice for each card it drops or moves.
 */
import { describe, expect, it } from "vitest";
import {
  EXPORT_TARGETS,
  exportArchidekt,
  exportArena,
  exportDeck,
  exportEdhrec,
  exportGoldfish,
  exportMoxfield,
  exportMTGO,
  exportPlainText,
  exportTappedOut,
  type ExportNotice,
  type ExportTarget,
} from "@/lib/deck/export";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";

function card(name: string, overrides: Partial<DeckCard> = {}): DeckCard {
  return aDeckCard({ id: name, name, ...overrides });
}

/** A deck with a card in every zone the exporters treat differently. */
const EVERY_ZONE: Deck = aDeck({
  name: "Kenrith Goodstuff",
  commander: card("Sidar Kondo of Jamuraa"),
  partner: card("Vial Smasher the Fierce"),
  companion: card("Lurrus of the Dream-Den"),
  cards: [
    card("Sol Ring"),
    card("Negate", { quantity: 3, zone: "sideboard" }),
    card("Counterspell", { quantity: 2, zone: "maybeboard" }),
  ],
});

const COMPANION_LEFT_OUT: ExportNotice = {
  kind: "cardDropped",
  cardName: "Lurrus of the Dream-Den",
  quantity: 1,
  from: "companion",
};
const SIDEBOARD_LEFT_OUT: ExportNotice = {
  kind: "cardDropped",
  cardName: "Negate",
  quantity: 3,
  from: "sideboard",
};
const CONSIDERING_LEFT_OUT: ExportNotice = {
  kind: "cardDropped",
  cardName: "Counterspell",
  quantity: 2,
  from: "maybeboard",
};

const TEXT_OF: Readonly<Record<ExportTarget, (deck: Deck) => string>> = {
  moxfield: exportMoxfield,
  arena: exportArena,
  mtgo: exportMTGO,
  tappedout: exportTappedOut,
  archidekt: exportArchidekt,
  goldfish: exportGoldfish,
  edhrec: exportEdhrec,
  plaintext: exportPlainText,
};

describe("exportDeck", () => {
  it.each(EXPORT_TARGETS)(
    "returns the %s text export as its content",
    (target) => {
      expect(exportDeck(EVERY_ZONE, target).content).toBe(
        TEXT_OF[target](EVERY_ZONE)
      );
    }
  );

  it("names a text export after the deck and the target, as plain text", () => {
    const result = exportDeck(EVERY_ZONE, "tappedout");

    expect(result.fileName).toBe("kenrith_goodstuff_tappedout.txt");
    expect(result.mimeType).toBe("text/plain");
  });

  it("names the MTGO export a .dek XML file", () => {
    const result = exportDeck(EVERY_ZONE, "mtgo");

    expect(result.fileName).toBe("kenrith_goodstuff.dek");
    expect(result.mimeType).toBe("application/xml");
  });

  it("reports nothing for plain text and Moxfield, which keep every card", () => {
    expect(exportDeck(EVERY_ZONE, "plaintext").notices).toEqual([]);
    expect(exportDeck(EVERY_ZONE, "moxfield").notices).toEqual([]);
  });

  it("reports each companion, Sideboard and Considering card TappedOut leaves out", () => {
    expect(exportDeck(EVERY_ZONE, "tappedout").notices).toEqual([
      COMPANION_LEFT_OUT,
      SIDEBOARD_LEFT_OUT,
      CONSIDERING_LEFT_OUT,
    ]);
  });

  it.each<ExportTarget>(["goldfish", "edhrec"])(
    "reports each companion, Sideboard and Considering card %s leaves out",
    (target) => {
      expect(exportDeck(EVERY_ZONE, target).notices).toEqual([
        COMPANION_LEFT_OUT,
        SIDEBOARD_LEFT_OUT,
        CONSIDERING_LEFT_OUT,
      ]);
    }
  );

  it("reports the Considering cards Arena leaves out", () => {
    expect(exportDeck(EVERY_ZONE, "arena").notices).toEqual([
      CONSIDERING_LEFT_OUT,
    ]);
  });

  it("reports the commanders MTGO writes into its main deck and the Considering cards it leaves out", () => {
    expect(exportDeck(EVERY_ZONE, "mtgo").notices).toEqual([
      {
        kind: "cardMoved",
        cardName: "Sidar Kondo of Jamuraa",
        quantity: 1,
        from: "commandZone",
        to: "mainDeck",
      },
      {
        kind: "cardMoved",
        cardName: "Vial Smasher the Fierce",
        quantity: 1,
        from: "commandZone",
        to: "mainDeck",
      },
      CONSIDERING_LEFT_OUT,
    ]);
  });

  it("reports the companion Archidekt leaves out", () => {
    expect(exportDeck(EVERY_ZONE, "archidekt").notices).toEqual([
      COMPANION_LEFT_OUT,
    ]);
  });

  it("reports nothing for a deck with only main-deck cards", () => {
    const mainOnly = aDeck({ cards: [card("Sol Ring")] });

    expect(
      EXPORT_TARGETS.flatMap((target) => exportDeck(mainOnly, target).notices)
    ).toEqual([]);
  });
});
