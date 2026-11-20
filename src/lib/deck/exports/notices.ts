/**
 * The notices an exporter builds for the cards its target cannot hold.
 *
 * Deck interchange. Each helper reads the deck and returns the notices in
 * deck order, so an exporter lists exactly the zones its format leaves out
 * and the result stays deterministic (I-50 requirements 1.2 and 1.5).
 *
 * @module deck/exports/notices
 */
import type { Deck, DeckZone } from "@/lib/deck/types";
import type { ExportNotice } from "./contract";

/**
 * One `cardDropped` notice per card of `zone`, with its quantity.
 *
 * @param deck - the deck exported
 * @param zone - a zone outside the main deck that the target leaves out
 */
export function droppedZone(
  deck: Pick<Deck, "cards">,
  zone: Exclude<DeckZone, "main">
): ExportNotice[] {
  return deck.cards
    .filter((card) => card.zone === zone)
    .map((card): ExportNotice => ({
      kind: "cardDropped",
      cardName: card.name,
      quantity: card.quantity,
      from: zone,
    }));
}

/**
 * A `cardDropped` notice for the deck's companion, or none without one.
 * A companion starts the game outside it (CR 702.139a), so a target with no
 * companion or sideboard section has nowhere to put it.
 */
export function droppedCompanion(
  deck: Pick<Deck, "companion">
): ExportNotice[] {
  if (!deck.companion) return [];
  return [
    {
      kind: "cardDropped",
      cardName: deck.companion.name,
      quantity: 1,
      from: "companion",
    },
  ];
}

/**
 * A `cardMoved` notice for each commander a target writes into its main deck
 * because its file has no command zone (CR 903.6: commanders start the game
 * in the command zone).
 */
export function commandersMovedToMainDeck(
  deck: Pick<Deck, "commander" | "partner">
): ExportNotice[] {
  return [deck.commander, deck.partner].flatMap((commander): ExportNotice[] =>
    commander
      ? [
          {
            kind: "cardMoved",
            cardName: commander.name,
            quantity: 1,
            from: "commandZone",
            to: "mainDeck",
          },
        ]
      : []
  );
}
