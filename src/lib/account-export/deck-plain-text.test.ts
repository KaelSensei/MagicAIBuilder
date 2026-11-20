/**
 * Parity: a stored deck's plain text in the account archive is line for line
 * what the builder's "Plain text" export writes for the same deck (I-38
 * requirement 7.2), so another deckbuilder imports both the same way.
 */
import { describe, expect, it } from "vitest";
import { exportPlainText } from "@/lib/deck/export";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import { deckPlainText, type PlainTextCardRow } from "./deck-plain-text";

/** The stored row of a card, with the flags the deck loader reads its slot from. */
function storedRow(
  card: DeckCard,
  flags: Pick<PlainTextCardRow, "isCommander" | "isPartner">
): PlainTextCardRow {
  return {
    name: card.name,
    quantity: card.quantity,
    zone: card.zone ?? "main",
    category: card.category,
    notes: card.notes ?? null,
    ...flags,
  };
}

/** @returns the rows the database holds for a deck as the builder holds it */
function storedRowsOf(deck: Deck): PlainTextCardRow[] {
  const commandZone = [
    deck.commander &&
      storedRow(deck.commander, { isCommander: true, isPartner: false }),
    deck.partner &&
      storedRow(deck.partner, { isCommander: true, isPartner: true }),
    deck.companion &&
      storedRow(deck.companion, { isCommander: false, isPartner: false }),
  ].filter((row) => row !== null);
  const rest = deck.cards.map((card) =>
    storedRow(card, { isCommander: false, isPartner: false })
  );
  return [...commandZone, ...rest];
}

const thrasios = aDeckCard({
  id: "c-1",
  name: "Thrasios, Triton Hero",
  category: "commander",
});
const tymna = aDeckCard({
  id: "c-2",
  name: "Tymna the Weaver",
  category: "commander",
});
const lurrus = aDeckCard({
  id: "c-3",
  name: "Lurrus of the Dream-Den",
  category: "companion",
});
const solRing = aDeckCard({
  id: "c-4",
  name: "Sol Ring",
  notes: "Keep\nalways",
});
const islands = aDeckCard({ id: "c-5", name: "Island", quantity: 9 });
const sideboard = aDeckCard({
  id: "c-6",
  name: "Pyroblast",
  zone: "sideboard",
});
const maybe = aDeckCard({ id: "c-7", name: "Mana Drain", zone: "maybeboard" });

describe("a stored deck's plain text", () => {
  it.each([
    ["an empty deck", aDeck()],
    [
      "a lone commander and a main deck with a two-line note",
      aDeck({ commander: thrasios, cards: [solRing, islands] }),
    ],
    [
      "partners, a companion, a sideboard and a maybeboard",
      aDeck({
        commander: thrasios,
        partner: tymna,
        companion: lurrus,
        cards: [solRing, islands, sideboard, maybe],
      }),
    ],
    [
      "a maybeboard with no sideboard",
      aDeck({ commander: thrasios, cards: [islands, maybe] }),
    ],
  ])("matches the builder's plain-text export for %s", (_label, deck) => {
    expect(deckPlainText(storedRowsOf(deck))).toBe(exportPlainText(deck));
  });

  it("drops a partner row that repeats the commander's name, as the deck loader does", () => {
    const rows = storedRowsOf(
      aDeck({ commander: thrasios, partner: thrasios, cards: [islands] })
    );

    expect(deckPlainText(rows)).toBe(
      exportPlainText(aDeck({ commander: thrasios, cards: [islands] }))
    );
  });

  it("writes the commander as one copy and leaves its note out, as the builder does", () => {
    const annotated = aDeckCard({
      name: "Thrasios, Triton Hero",
      quantity: 1,
      notes: "Draw engine",
    });

    expect(
      deckPlainText([
        storedRow(annotated, { isCommander: true, isPartner: false }),
      ])
    ).toBe(["Commander", "1 Thrasios, Triton Hero", "", "Deck"].join("\n"));
  });
});
