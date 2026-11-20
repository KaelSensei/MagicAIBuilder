/**
 * The Magic Online `.dek` deck export (XML).
 *
 * Deck interchange. `CatID` from `mtgo_id`, single-slash split names and the
 * command-zone placement are I-50 slice 6; every card here has `CatID="0"`.
 *
 * @module deck/exports/mtgo
 */
import type { Deck } from "@/lib/deck/types";
import { underscoreFileStem } from "@/lib/text/slug";
import type { ExportResult } from "./contract";
import { commandersMovedToMainDeck, droppedZone } from "./notices";

/** Escape card names used in double-quoted XML attributes. */
function escapeXmlAttribute(value: string): string {
  return value.replaceAll(/[&<>"]/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return character;
    }
  });
}

/** MTGO .dek format (XML) */
export function exportMTGO(deck: Deck): string {
  const allCards: { name: string; qty: number; isSideboard?: boolean }[] = [];
  if (deck.commander) allCards.push({ name: deck.commander.name, qty: 1 });
  if (deck.partner) allCards.push({ name: deck.partner.name, qty: 1 });
  const companion = deck.companion;
  const companionIsInSideboard = deck.cards.some(
    (card) => card.zone === "sideboard" && card.name === companion?.name
  );
  if (companion && !companionIsInSideboard) {
    allCards.push({ name: companion.name, qty: 1, isSideboard: true });
  }
  for (const card of deck.cards) {
    if (card.zone === "maybeboard") continue;
    allCards.push({
      name: card.name,
      qty: card.quantity,
      isSideboard: card.zone === "sideboard",
    });
  }

  const cardXml = allCards
    .map(
      (c) =>
        `  <Cards CatID="0" Quantity="${c.qty}" Sideboard="${c.isSideboard === true}" Name="${escapeXmlAttribute(c.name)}" />`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<Deck xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NetDeckID>0</NetDeckID>
  <PreconstructedDeckID>0</PreconstructedDeckID>
${cardXml}
</Deck>`;
}

/**
 * The MTGO export as an {@link ExportResult}, a `.dek` XML file. The
 * commanders are written into the main deck (`Sideboard="false"`) until open
 * question 1 of I-50 settles where MTGO wants them, so each gets a
 * `cardMoved` notice; the Considering cards it leaves out each get a
 * `cardDropped` notice. The companion goes to the sideboard, as MTGO expects.
 */
export function mtgoExport(deck: Deck): ExportResult {
  return {
    content: exportMTGO(deck),
    fileName: `${underscoreFileStem(deck.name)}.dek`,
    mimeType: "application/xml",
    notices: [
      ...commandersMovedToMainDeck(deck),
      ...droppedZone(deck, "maybeboard"),
    ],
  };
}
