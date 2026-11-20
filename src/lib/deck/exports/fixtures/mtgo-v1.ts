/**
 * `mtgo/v1`: the Magic Online `.dek` export of {@link EXPORT_DECK_V1}.
 *
 * Unverified: no person has yet recorded the Magic Online client version and
 * the date of a successful import of this content (I-50 requirement 1.4).
 * Where MTGO wants the commanders is I-50 open question 1.
 *
 * @module deck/exports/fixtures/mtgo-v1
 */
import { EXPORT_DECK_V1, type ExportFixture } from "./export-fixture";

/** The Magic Online export contract, version 1. */
export const MTGO_EXPORT_V1: ExportFixture = {
  version: "mtgo/v1",
  target: "mtgo",
  verifiedImport: null,
  input: EXPORT_DECK_V1,
  expected: {
    content: [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<Deck xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
      "  <NetDeckID>0</NetDeckID>",
      "  <PreconstructedDeckID>0</PreconstructedDeckID>",
      '  <Cards CatID="0" Quantity="1" Sideboard="false" Name="Sidar Kondo of Jamuraa" />',
      '  <Cards CatID="0" Quantity="1" Sideboard="false" Name="Vial Smasher the Fierce" />',
      '  <Cards CatID="0" Quantity="1" Sideboard="true" Name="Lurrus of the Dream-Den" />',
      '  <Cards CatID="0" Quantity="1" Sideboard="false" Name="Sol Ring" />',
      '  <Cards CatID="0" Quantity="1" Sideboard="false" Name="Fire // Ice" />',
      '  <Cards CatID="0" Quantity="1" Sideboard="false" Name="Kongming, &quot;Sleeping Dragon&quot;" />',
      '  <Cards CatID="0" Quantity="10" Sideboard="false" Name="Plains" />',
      '  <Cards CatID="0" Quantity="2" Sideboard="true" Name="Negate" />',
      "</Deck>",
    ].join("\n"),
    fileName: "lim_dul_s_vault.dek",
    mimeType: "application/xml",
    notices: [
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
      {
        kind: "cardDropped",
        cardName: "Counterspell",
        quantity: 1,
        from: "maybeboard",
      },
    ],
  },
};
