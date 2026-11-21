/**
 * Reads an MTGO `.dek` deck file into decklist lines.
 *
 * A `.dek` file is XML: a `Deck` root holding one
 * `<Cards CatID="…" Quantity="4" Sideboard="false" Name="Lightning Bolt" />`
 * element per card. Each element becomes the line `4 Lightning Bolt`; the
 * elements marked `Sideboard="true"` go under a `Sideboard` heading.
 *
 * Nothing is guessed to be the commander: MTGO files a Commander deck's
 * commander in the sideboard, and I-62 3.2 says the import guesses nothing
 * silently, so the player sets the commander after the import as after a paste.
 *
 * The file comes from the player's disk and may be hostile, so it is read with
 * bounded patterns over the `Cards` elements, the way `parseTextDecklist`
 * bounds its own, rather than with an XML parser that would need the DOM.
 *
 * @module import/decklist-file-dek
 */
import {
  cardNameForLine,
  sectionLines,
  unreadableLine,
  type DecklistLines,
  type UnreadableLine,
} from "./decklist-file-lines";

/** One `<Cards …>` element; its attributes are capped at 2,000 characters. */
const CARDS_ELEMENT = /<Cards\b([^<>]{0,2000})>/g;
/** One `name="value"` attribute, both capped. */
const ATTRIBUTE = /([A-Za-z]{1,30})\s{0,10}=\s{0,10}"([^"]{0,500})"/g;
/** A character or entity reference, the forms XML allows in an attribute. */
const ENTITY = /&(?:#\d{1,7}|#x[\da-f]{1,6}|amp|lt|gt|quot|apos);/gi;
const NAMED_ENTITIES: ReadonlyMap<string, string> = new Map([
  ["amp", "&"],
  ["lt", "<"],
  ["gt", ">"],
  ["quot", '"'],
  ["apos", "'"],
]);
const QUANTITY = /^\d{1,4}$/;
const LAST_CODE_POINT = 0x10ffff;

/**
 * The decklist of an MTGO `.dek` file, or `null` when the file holds no
 * `Cards` element and so is not a `.dek` deck.
 *
 * @param text - the file's text, line endings already `\n`
 * @returns a `Deck` section, then a `Sideboard` section, each only when it has
 *   cards; an element without a name or a positive quantity is unreadable
 */
export function readMtgoDek(text: string): DecklistLines | null {
  const main: string[] = [];
  const sideboard: string[] = [];
  const unreadable: UnreadableLine[] = [];
  const lineAt = lineCounter(text);
  let elements = 0;
  for (const element of text.matchAll(CARDS_ELEMENT)) {
    elements++;
    const attributes = readAttributes(element[1] ?? "");
    const cardLine = cardLineOf(attributes);
    if (cardLine === null) {
      unreadable.push(unreadableLine(lineAt(element.index), element[0]));
    } else {
      (isSideboard(attributes) ? sideboard : main).push(cardLine);
    }
  }
  if (elements === 0) return null;
  return { lines: [...sectionLines("Deck", main), ...sectionLines("Sideboard", sideboard)], unreadable };
}

function readAttributes(source: string): ReadonlyMap<string, string> {
  const attributes = new Map<string, string>();
  for (const [, name, value] of source.matchAll(ATTRIBUTE)) {
    if (name !== undefined && value !== undefined) attributes.set(name.toLowerCase(), decodeEntities(value));
  }
  return attributes;
}

function cardLineOf(attributes: ReadonlyMap<string, string>): string | null {
  const quantity = attributes.get("quantity")?.trim() ?? "";
  const name = cardNameForLine(attributes.get("name") ?? "");
  if (!QUANTITY.test(quantity) || Number(quantity) === 0 || name === "") return null;
  return `${Number(quantity)} ${name}`;
}

function isSideboard(attributes: ReadonlyMap<string, string>): boolean {
  return attributes.get("sideboard")?.trim().toLowerCase() === "true";
}

/** One pass, so `&amp;#65;` stays `&#65;` instead of being decoded twice. */
function decodeEntities(value: string): string {
  return value.replaceAll(ENTITY, decodeReference);
}

/** @param reference - one {@link ENTITY} match, `&` and `;` included */
function decodeReference(reference: string): string {
  const body = reference.slice(1, -1).toLowerCase();
  if (!body.startsWith("#")) return NAMED_ENTITIES.get(body) ?? reference;
  const codePoint = body.startsWith("#x") ? Number.parseInt(body.slice(2), 16) : Number(body.slice(1));
  return codePoint > 0 && codePoint <= LAST_CODE_POINT ? String.fromCodePoint(codePoint) : reference;
}

/**
 * The 1-based line of a character offset. Offsets must come in increasing
 * order, as `matchAll` yields them, so the whole file is scanned once.
 */
function lineCounter(text: string): (offset: number) => number {
  let line = 1;
  let scanned = 0;
  return (offset) => {
    for (; scanned < offset; scanned++) {
      if (text[scanned] === "\n") line++;
    }
    return line;
  };
}
