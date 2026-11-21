/**
 * `registration-sheet/v1`: the printable decklist registration sheet of a
 * Commander deck with two partnered commanders (I-50, thirteenth-pass scope
 * line, export contract requirement 1.4).
 *
 * Deck interchange, test data. The sheet is not an {@link ExportTarget}: its
 * headings are locale text, so its fixture freezes the labels too. Like every
 * `v1` fixture it is never edited once verified; a change of output is a new
 * version. "Verified" here means a person printed it on A4 and Letter.
 *
 * @module deck/exports/fixtures/registration-sheet-v1
 */
import type { ExportResult, RegistrationSheetLabels } from "@/lib/deck/export";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";

/** The registration sheet's frozen contract for one deck and one set of labels. */
export interface RegistrationSheetFixture {
  readonly version: "registration-sheet/v1";
  readonly labels: RegistrationSheetLabels;
  readonly input: Deck;
  readonly expected: ExportResult;
}

function card(
  name: string,
  overrides: Partial<DeckCard> & Pick<DeckCard, "category">
): DeckCard {
  return aDeckCard({ id: name, name, ...overrides });
}

/** The English labels, as the `deck.export.registrationSheet` catalogue gives them. */
export const ENGLISH_REGISTRATION_LABELS: RegistrationSheetLabels = {
  lang: "en",
  title: "Decklist registration sheet",
  playerName: "Player name",
  event: "Event",
  date: "Date",
  signature: "Signature",
  deckName: "Deck name",
  format: "Format",
  commander: "Commander",
  companion: "Companion",
  mainDeck: "Main deck",
  sideboard: "Sideboard",
  total: (count) => `Total: ${count}`,
};

/**
 * The `v1` input: two partnered commanders, a companion, a main deck out of
 * alphabetical order with two rows of the same card, a split card, names with
 * `&` and quotes, a deck name with `&`, `'` and `<`, a sideboard card the
 * Commander format does not allow and a Considering card.
 */
export const REGISTRATION_DECK_V1: Deck = aDeck({
  name: "Sidar & Vial's <cEDH> List",
  format: "commander",
  commander: card("Sidar Kondo of Jamuraa", { category: "commander" }),
  partner: card("Vial Smasher the Fierce", { category: "commander" }),
  pairingType: "partner",
  companion: card("Kaheera, the Orphanguard", { category: "companion" }),
  cards: [
    card("Sol Ring", { category: "ramp" }),
    card("Plains", { category: "land", quantity: 10 }),
    card("Mountain", { category: "land", quantity: 5 }),
    card("Arcane Signet", { category: "ramp" }),
    card('Kongming, "Sleeping Dragon"', { category: "creature" }),
    card("Minsc & Boo, Timeless Heroes", { category: "creature" }),
    card("Fire // Ice", { category: "instant" }),
    aDeckCard({
      id: "Mountain-2",
      name: "Mountain",
      category: "land",
      quantity: 2,
    }),
    card("Negate", { category: "instant", quantity: 2, zone: "sideboard" }),
    card("Counterspell", { category: "instant", zone: "maybeboard" }),
  ],
});

/** The registration sheet contract, version 1. */
export const REGISTRATION_SHEET_V1: RegistrationSheetFixture = {
  version: "registration-sheet/v1",
  labels: ENGLISH_REGISTRATION_LABELS,
  input: REGISTRATION_DECK_V1,
  expected: {
    content: [
      "<!DOCTYPE html>",
      '<html lang="en">',
      "<head>",
      '<meta charset="utf-8">',
      "<title>Sidar &amp; Vial&#39;s &lt;cEDH&gt; List — Decklist registration sheet</title>",
      "<style>",
      "@page { margin: 12mm; }",
      "body { margin: 0; color: #000; background: #fff; font: 9pt/1.3 Arial, Helvetica, sans-serif; }",
      "h1 { font-size: 14pt; margin: 0 0 4mm; }",
      "h2 { font-size: 10pt; margin: 4mm 0 1mm; border-bottom: 0.3mm solid #000; }",
      "ul { list-style: none; margin: 0; padding: 0; }",
      "li { break-inside: avoid; }",
      ".field { display: flex; align-items: flex-end; gap: 2mm; margin: 0 0 3mm; }",
      ".label { min-width: 28mm; font-weight: bold; }",
      ".blank { flex: 1; min-height: 5mm; border-bottom: 0.3mm solid #000; }",
      ".cards { column-count: 3; column-gap: 6mm; }",
      ".total { font-weight: bold; margin: 1mm 0 0; }",
      ".signature { margin-top: 8mm; }",
      "@media screen { body { max-width: 186mm; margin: 12mm auto; } }",
      "</style>",
      "</head>",
      "<body>",
      "<h1>Decklist registration sheet</h1>",
      '<p class="field"><span class="label">Player name</span><span class="blank"></span></p>',
      '<p class="field"><span class="label">Event</span><span class="blank"></span></p>',
      '<p class="field"><span class="label">Date</span><span class="blank"></span></p>',
      '<p class="field"><span class="label">Deck name</span><span class="value">Sidar &amp; Vial&#39;s &lt;cEDH&gt; List</span></p>',
      '<p class="field"><span class="label">Format</span><span class="value">Commander</span></p>',
      "<section>",
      "<h2>Commander</h2>",
      "<ul>",
      "<li>1 Sidar Kondo of Jamuraa</li>",
      "<li>1 Vial Smasher the Fierce</li>",
      "</ul>",
      "</section>",
      "<section>",
      "<h2>Companion</h2>",
      "<ul>",
      "<li>1 Kaheera, the Orphanguard</li>",
      "</ul>",
      "</section>",
      "<section>",
      "<h2>Main deck</h2>",
      '<ul class="cards">',
      "<li>1 Arcane Signet</li>",
      "<li>1 Fire // Ice</li>",
      "<li>1 Kongming, &quot;Sleeping Dragon&quot;</li>",
      "<li>1 Minsc &amp; Boo, Timeless Heroes</li>",
      "<li>7 Mountain</li>",
      "<li>10 Plains</li>",
      "<li>1 Sol Ring</li>",
      "</ul>",
      '<p class="total">Total: 22</p>',
      "</section>",
      '<p class="field signature"><span class="label">Signature</span><span class="blank"></span></p>',
      "</body>",
      "</html>",
    ].join("\n"),
    fileName: "sidar___vial_s__cedh__list_registration.html",
    mimeType: "text/html",
    notices: [
      {
        kind: "cardDropped",
        cardName: "Negate",
        quantity: 2,
        from: "sideboard",
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
