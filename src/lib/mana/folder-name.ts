/**
 * Splits a deck-folder name into text and the five colour mana symbols, for display only.
 *
 * Deck library (I-01, `docs/product/specs/i01-deck-editor-workflow.md`): a player may write
 * `{W}`, `{U}`, `{B}`, `{R}` or `{G}` in a folder name ("{W}{U} Control"), and the library shows
 * each as its mana symbol. Only those five upper-case tokens are read; every other brace
 * sequence (`{X}`, `{C}`, `{W/U}`, `{w}`, an unclosed `{W`) stays as the characters typed.
 * Not responsible for: storing, validating or renaming a folder (the name is stored as typed and
 * the folder's identity is its id), or mana-cost parsing (`lib/mana/parse.ts`).
 *
 * @module mana/folder-name
 */
import { FIVE_COLORS } from "./colors";

/** One of the five colours, as its mana-symbol letter. */
type FolderNameColor = (typeof FIVE_COLORS)[number];

/**
 * A piece of a folder name: text kept exactly as typed, or one colour mana symbol.
 *
 * `start` is the piece's character offset in the name: unique within one name, so a renderer can
 * key on it.
 */
export type FolderNamePart =
  | { readonly kind: "text"; readonly text: string; readonly start: number }
  | {
      readonly kind: "mana";
      readonly color: FolderNameColor;
      readonly start: number;
    };

/**
 * The token for each colour, e.g. `{W}` → `W`. CR 105.1: the five colours; colourless `{C}` is
 * not a colour (CR 105.2) and stays text here.
 */
const COLOR_BY_TOKEN: ReadonlyMap<string, FolderNameColor> = new Map(
  FIVE_COLORS.map((color) => [`{${color}}`, color])
);

/** Matches one colour token; the capture group keeps it in `split`'s output. Linear, no nesting. */
const COLOR_TOKEN = new RegExp(String.raw`(\{[${FIVE_COLORS.join("")}]\})`);

function toPart(segment: string, start: number): FolderNamePart {
  const color = COLOR_BY_TOKEN.get(segment);
  return color === undefined
    ? { kind: "text", text: segment, start }
    : { kind: "mana", color, start };
}

/**
 * Splits `name` into text and colour-symbol parts, in order.
 *
 * Joining the parts back (a symbol as its `{C}` token) gives `name` unchanged. A name without a
 * colour token is one text part; an empty name gives no part.
 */
export function tokenizeFolderName(name: string): readonly FolderNamePart[] {
  const parts: FolderNamePart[] = [];
  let start = 0;
  for (const segment of name.split(COLOR_TOKEN)) {
    if (segment !== "") parts.push(toPart(segment, start));
    start += segment.length;
  }
  return parts;
}

/**
 * The name read aloud: each symbol as its letter, separated by spaces, e.g. "W U Control".
 *
 * Used as the accessible name where the symbols are drawn, so a screen reader never reads a raw
 * brace sequence. Whitespace is collapsed and trimmed.
 */
export function readableFolderName(parts: readonly FolderNamePart[]): string {
  return parts
    .map((part) => (part.kind === "mana" ? part.color : part.text))
    .join(" ")
    .replaceAll(/\s+/g, " ")
    .trim();
}
