/**
 * The printable decklist registration sheet: a one-page, black-and-white HTML
 * document a player prints and hands to the organiser of a Duel Commander or
 * cEDH event (I-50, thirteenth-pass scope line).
 *
 * Deck interchange. Blank lines for the player, the event, the date and a
 * signature; the deck name and format filled in; the command zone apart; the
 * main deck alphabetical as "count name" with its total; a sideboard only when
 * the format allows one. No image, no price. It follows the export contract
 * (requirement 1): pure, deterministic, one notice per card left out. Unlike
 * an {@link Exporter} it also takes the sheet's labels, which are locale text,
 * so it is not one of `EXPORT_TARGETS`. Not responsible for printing or saving
 * the file (the export dialog) or for per-target name rules (I-50 slice 2):
 * names print as stored.
 *
 * @module deck/exports/registration-sheet
 */
import type { Deck, DeckCard } from "@/lib/deck/types";
import { getFormatConfig } from "@/lib/deck/formats";
import { compareCodeUnits } from "@/lib/text/code-unit-order";
import { escapeHtml } from "@/lib/text/escape-html";
import { underscoreFileStem } from "@/lib/text/slug";
import type { ExportResult } from "./contract";
import { droppedZone } from "./notices";

/** The sheet's visible text, in the player's locale. Card names are not translated. */
export interface RegistrationSheetLabels {
  /** The document language, a BCP 47 tag such as "en" or "fr". */
  readonly lang: string;
  readonly title: string;
  readonly playerName: string;
  readonly event: string;
  readonly date: string;
  readonly signature: string;
  readonly deckName: string;
  readonly format: string;
  readonly commander: string;
  readonly companion: string;
  readonly mainDeck: string;
  readonly sideboard: string;
  /** The total line under a card list, e.g. "Total: 98". */
  readonly total: (count: number) => string;
}

/** One printed card line: a card name and its copies across every row of that name. */
interface SheetLine {
  readonly name: string;
  readonly quantity: number;
}

/** One card list of the sheet, under its heading. */
interface CardSection {
  readonly heading: string;
  readonly lines: readonly SheetLine[];
  /** Multi-column with a total line: the main deck and the sideboard. */
  readonly counted: boolean;
}

// Black on white with no background, so any printer gives the same sheet.
// Three columns keep a 100-card main deck on one A4 or Letter page.
const SHEET_STYLE: readonly string[] = [
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
];

/** Alphabetical for the reader, then by code unit so the order never ties. */
function byName(left: SheetLine, right: SheetLine): number {
  return (
    left.name.localeCompare(right.name, "en") ||
    compareCodeUnits(left.name, right.name)
  );
}

/** The cards of one zone, one line per name (printings merged), alphabetical. */
function zoneLines(deck: Deck, zone: DeckCard["zone"]): SheetLine[] {
  const counts = new Map<string, number>();
  for (const card of deck.cards) {
    if (card.zone !== zone) continue;
    counts.set(card.name, (counts.get(card.name) ?? 0) + card.quantity);
  }
  return [...counts]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort(byName);
}

/** The commander and partner, in the deck's order: one copy each (CR 903.3). */
function commandZoneLines(deck: Deck): SheetLine[] {
  return [deck.commander, deck.partner].flatMap((card) =>
    card ? [{ name: card.name, quantity: 1 }] : []
  );
}

function companionLines(deck: Deck): SheetLine[] {
  return deck.companion ? [{ name: deck.companion.name, quantity: 1 }] : [];
}

/** Whether the deck's format has a sideboard (`sideboardSize > 0`). */
function allowsSideboard(deck: Deck): boolean {
  return getFormatConfig(deck.format).sideboardSize > 0;
}

function totalQuantity(lines: readonly SheetLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** A labelled line: the value filled in, or a blank to write on when `null`. */
function fieldHtml(
  label: string,
  value: string | null,
  className = "field"
): string {
  const content =
    value === null
      ? '<span class="blank"></span>'
      : `<span class="value">${escapeHtml(value)}</span>`;
  return `<p class="${className}"><span class="label">${escapeHtml(label)}</span>${content}</p>`;
}

function sectionHtml(
  section: CardSection,
  labels: RegistrationSheetLabels
): string[] {
  const items = section.lines.map(
    (line) => `<li>${line.quantity} ${escapeHtml(line.name)}</li>`
  );
  const totalText = labels.total(totalQuantity(section.lines));
  const total = section.counted
    ? [`<p class="total">${escapeHtml(totalText)}</p>`]
    : [];
  return [
    "<section>",
    `<h2>${escapeHtml(section.heading)}</h2>`,
    section.counted ? '<ul class="cards">' : "<ul>",
    ...items,
    "</ul>",
    ...total,
    "</section>",
  ];
}

/** The card lists the sheet prints, in order; a list with no card is left out. */
function cardSections(
  deck: Deck,
  labels: RegistrationSheetLabels
): CardSection[] {
  const sideboard = allowsSideboard(deck) ? zoneLines(deck, "sideboard") : [];
  const sections: CardSection[] = [
    {
      heading: labels.commander,
      lines: commandZoneLines(deck),
      counted: false,
    },
    { heading: labels.companion, lines: companionLines(deck), counted: false },
    { heading: labels.mainDeck, lines: zoneLines(deck, "main"), counted: true },
    { heading: labels.sideboard, lines: sideboard, counted: true },
  ];
  return sections.filter((section) => section.lines.length > 0);
}

/**
 * The registration sheet's HTML document, every line joined by "\n".
 *
 * @param deck - the deck to print; it is not changed
 * @param labels - the sheet's text in the player's locale
 */
export function registrationSheetHtml(
  deck: Deck,
  labels: RegistrationSheetLabels
): string {
  return [
    "<!DOCTYPE html>",
    `<html lang="${escapeHtml(labels.lang)}">`,
    "<head>",
    '<meta charset="utf-8">',
    `<title>${escapeHtml(deck.name)} — ${escapeHtml(labels.title)}</title>`,
    "<style>",
    ...SHEET_STYLE,
    "</style>",
    "</head>",
    "<body>",
    `<h1>${escapeHtml(labels.title)}</h1>`,
    fieldHtml(labels.playerName, null),
    fieldHtml(labels.event, null),
    fieldHtml(labels.date, null),
    fieldHtml(labels.deckName, deck.name),
    fieldHtml(labels.format, getFormatConfig(deck.format).label),
    ...cardSections(deck, labels).flatMap((section) =>
      sectionHtml(section, labels)
    ),
    fieldHtml(labels.signature, null, "field signature"),
    "</body>",
    "</html>",
  ].join("\n");
}

/**
 * The registration sheet as an {@link ExportResult}: an `.html` file named
 * `<deck_stem>_registration.html`. Considering cards never print, and
 * sideboard cards print only when the format has a sideboard; each card left
 * out gets a `cardDropped` notice (requirement 1.2). Pure: the same deck and
 * labels give the same result, byte for byte (1.5).
 *
 * @param deck - the deck to print; it is not changed
 * @param labels - the sheet's text in the player's locale
 */
export function registrationSheetExport(
  deck: Deck,
  labels: RegistrationSheetLabels
): ExportResult {
  return {
    content: registrationSheetHtml(deck, labels),
    fileName: `${underscoreFileStem(deck.name)}_registration.html`,
    mimeType: "text/html",
    notices: [
      ...(allowsSideboard(deck) ? [] : droppedZone(deck, "sideboard")),
      ...droppedZone(deck, "maybeboard"),
    ],
  };
}
