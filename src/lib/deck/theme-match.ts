/**
 * Theme matching: whether one deck card is on the theme its owner named, and
 * which handle, field and text say so.
 *
 * Deck analysis, I-102 slice 1 (`docs/product/specs/i102-a-theme-you-can-measure.md`).
 * A theme is one to three handles the owner chooses; the product never infers
 * one (requirement 1.1). Version 1 reads only the fields every deck card
 * already stores: the name, the type line and the Oracle text. Artist, plane
 * or set, watermark and flavour text wait for I-67's card tables (slice 6).
 * Not responsible for: counting a deck (`theme-coverage.ts`), storing the
 * theme (slice 2), the panel (slice 3) or the alternatives query (slice 4).
 * No AI client is reachable from here.
 *
 * @module deck/theme-match
 */

import type { DeckCard } from "./types";

/**
 * One rule a card can meet to be on theme, read from a stored field
 * (requirement 2.1):
 * - `creatureType`: a subtype on the type line, such as Dragon; a changeling
 *   has every creature type.
 * - `nameWord`: a whole word in the card's name, on either face.
 * - `firstLetter`: the first letter of the card's English name, after a
 *   leading "The" when `ignoreLeadingThe` is set.
 * - `textWord`: a whole word in the Oracle text, reminder text and the card's
 *   own name left out.
 * - `cardType`: a card type or supertype, such as Legendary or Artifact.
 */
export type ThemeHandle =
  | { readonly kind: "creatureType"; readonly value: string }
  | { readonly kind: "nameWord"; readonly value: string }
  | {
      readonly kind: "firstLetter";
      readonly value: string;
      readonly ignoreLeadingThe: boolean;
    }
  | { readonly kind: "textWord"; readonly value: string }
  | { readonly kind: "cardType"; readonly value: string };

/**
 * The owner's theme: one to three handles, met by `any` of them (the default)
 * or by `all` of them (requirement 2.1).
 */
export interface DeckTheme {
  readonly handles:
    | readonly [ThemeHandle]
    | readonly [ThemeHandle, ThemeHandle]
    | readonly [ThemeHandle, ThemeHandle, ThemeHandle];
  readonly match: "any" | "all";
  /** Count basic lands in the coverage; off unless the owner switches it on (requirement 2.3) */
  readonly countBasics?: boolean;
}

/** The stored card field a handle read. */
export type ThemeField = "name" | "typeLine" | "oracleText";

/** Why one handle holds for a card: the field and the text that matched. */
export interface ThemeEvidence {
  /** Position of the handle in `DeckTheme.handles` */
  readonly handleIndex: number;
  readonly field: ThemeField;
  /** The matched text as the card prints it, at most 120 characters */
  readonly excerpt: string;
}

/**
 * A card's theme verdict. `evidence` names every handle the card meets, so an
 * on-theme verdict always says why (requirement 1.2). An off-theme card lists
 * only the handles it does meet under the `all` switch, and none otherwise:
 * nothing is invented about it.
 */
export interface ThemeMatch {
  readonly onTheme: boolean;
  readonly evidence: readonly ThemeEvidence[];
}

/** The fields of a deck card the version 1 handles read. */
export type ThemeCard = Pick<
  DeckCard,
  "name" | "typeLine" | "oracleText" | "cardFaces"
>;

/** Separates the faces in a stored two-faced field: "Front // Back". */
const FACE_SEPARATOR = " // ";

/** Separates the supertypes and card types from the subtypes (CR 205.1a). */
const SUBTYPE_SEPARATOR = "—";

/** Reminder text has no game function (CR 207.2a). */
const REMINDER_TEXT = /\([^()]*\)/g;

/** The keyword that makes an object every creature type (CR 702.73a). */
const CHANGELING = "changeling";

/** A leading article some owners skip when they theme on letters. */
const LEADING_THE = /^the\s+/i;

/** What a card's own name reads as in its text, as Scryfall's `o:` reads it. */
const SELF_REFERENCE = "~";

/** Characters with a meaning in a regular expression, escaped to match literally. */
const REGEXP_SYNTAX = /[.*+?^${}()|[\]\\]/g;

/** The longest excerpt a verdict carries (I-102 data model, `ThemeMatch.excerpt`). */
const MAX_EXCERPT_LENGTH = 120;

/** Marks text cut from an excerpt. */
const ELLIPSIS = "…";

/** Characters an excerpt keeps before the matched word, for context. */
const CONTEXT_BEFORE_MATCH = 40;

/**
 * One field of every face, front first, each once. A two-faced card stores
 * "Front // Back" and may also hold each face in `cardFaces`.
 *
 * @param card - the card's stored fields
 * @param field - the face field to read
 */
function faceValues(
  card: ThemeCard,
  field: "name" | "typeLine" | "oracleText"
): readonly string[] {
  const values = [
    ...card[field].split(FACE_SEPARATOR),
    ...(card.cardFaces?.map((face) => face[field]) ?? []),
  ];
  return [...new Set(values.map((value) => value.trim()))];
}

/**
 * The rules lines of every face's Oracle text, reminder text removed.
 *
 * @param card - the card's stored fields
 */
function rulesLines(card: ThemeCard): readonly string[] {
  return faceValues(card, "oracleText")
    .flatMap((text) => text.split("\n"))
    .map((line) => line.replace(REMINDER_TEXT, "").trim())
    .filter((line) => line.length > 0);
}

/**
 * The supertypes and card types of a type line, lower-cased: the words
 * before the em dash (CR 205.1a, CR 205.4a).
 *
 * @param typeLine - an English type line, such as "Legendary Creature — Dragon"
 */
function typesOf(typeLine: string): readonly string[] {
  const [types = ""] = typeLine.split(SUBTYPE_SEPARATOR, 1);
  return types.toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * The subtypes of a type line, lower-cased: the words after the em dash.
 *
 * @param typeLine - an English type line, such as "Creature — Dragon"
 */
function subtypesOf(typeLine: string): readonly string[] {
  const [, subtypes = ""] = typeLine.split(SUBTYPE_SEPARATOR, 2);
  return subtypes.toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * Whether the card has changeling, as a keyword line such as "Changeling" or
 * "Changeling, flying". A line that merely mentions it, such as Maskwood
 * Nexus giving creatures every type, is not the card's own keyword.
 *
 * @param card - the card's stored fields
 */
function hasChangeling(card: ThemeCard): boolean {
  return rulesLines(card).some((line) =>
    line
      .split(",")
      .some((keyword) => keyword.trim().toLowerCase() === CHANGELING)
  );
}

/**
 * A case-insensitive pattern for a whole word or phrase: no letter or digit
 * touches it on either side, so "Dragon" finds "Shivan Dragon" and not
 * "Dragonlord Atarka".
 *
 * @param words - the owner's word, matched literally
 */
function wholeWordPattern(words: string): RegExp {
  const literal = words.trim().replace(REGEXP_SYNTAX, String.raw`\$&`);
  return new RegExp(
    String.raw`(?<![\p{L}\p{N}])${literal}(?![\p{L}\p{N}])`,
    "iu"
  );
}

/**
 * A rules line with each of the card's own names masked by as many `~`, so
 * "Shivan Dragon gets +1/+0" does not put Shivan Dragon on a "Dragon" text
 * theme, and every position still points into the printed line.
 *
 * @param line - one rules line
 * @param ownNames - the names of the card's faces
 */
function maskOwnNames(line: string, ownNames: readonly string[]): string {
  return ownNames.reduce(
    (text, name) => text.replaceAll(name, SELF_REFERENCE.repeat(name.length)),
    line
  );
}

/**
 * At most {@link MAX_EXCERPT_LENGTH} characters of a line, keeping the
 * matched word in view: the window starts a little before the match, slides
 * back to fill the length when the match is near the end, and an ellipsis
 * marks each cut side.
 *
 * @param line - the printed rules line
 * @param matchIndex - where the matched word starts in the line
 */
function excerptAround(line: string, matchIndex: number): string {
  if (line.length <= MAX_EXCERPT_LENGTH) {
    return line;
  }
  const windowLength = MAX_EXCERPT_LENGTH - 2 * ELLIPSIS.length;
  const start = Math.min(
    Math.max(matchIndex - CONTEXT_BEFORE_MATCH, 0),
    line.length - windowLength
  );
  const end = start + windowLength;
  const head = start > 0 ? ELLIPSIS : "";
  const tail = end < line.length ? ELLIPSIS : "";
  return `${head}${line.slice(start, end).trim()}${tail}`;
}

/**
 * The evidence that a card has one creature type: printed on its type line,
 * or every creature type through changeling (CR 702.73a, CR 205.3m).
 *
 * @param card - the card's stored fields
 * @param creatureType - the creature type the owner named
 * @param handleIndex - the handle's position in the theme
 */
function creatureTypeEvidence(
  card: ThemeCard,
  creatureType: string,
  handleIndex: number
): ThemeEvidence | undefined {
  const wanted = creatureType.trim().toLowerCase();
  const typeLine = faceValues(card, "typeLine").find((line) =>
    subtypesOf(line).includes(wanted)
  );
  if (typeLine !== undefined) {
    return { handleIndex, field: "typeLine", excerpt: typeLine };
  }
  return hasChangeling(card)
    ? { handleIndex, field: "oracleText", excerpt: "Changeling" }
    : undefined;
}

/**
 * The evidence that the card's name holds a whole word, on any face.
 *
 * @param card - the card's stored fields
 * @param word - the word the owner named
 * @param handleIndex - the handle's position in the theme
 */
function nameWordEvidence(
  card: ThemeCard,
  word: string,
  handleIndex: number
): ThemeEvidence | undefined {
  const pattern = wholeWordPattern(word);
  const name = faceValues(card, "name").find((faceName) =>
    pattern.test(faceName)
  );
  return name === undefined
    ? undefined
    : { handleIndex, field: "name", excerpt: name };
}

/**
 * The evidence that the card's English name starts with a letter. The name
 * is the front face's: outside the battlefield and the stack a double-faced
 * card has only its front face's characteristics (CR 712.8a).
 *
 * @param card - the card's stored fields
 * @param handle - the first-letter handle the owner named
 * @param handleIndex - the handle's position in the theme
 */
function firstLetterEvidence(
  card: ThemeCard,
  handle: Extract<ThemeHandle, { kind: "firstLetter" }>,
  handleIndex: number
): ThemeEvidence | undefined {
  const [frontName = ""] = faceValues(card, "name");
  const lettered = handle.ignoreLeadingThe
    ? frontName.replace(LEADING_THE, "")
    : frontName;
  const first = lettered.charAt(0).toUpperCase();
  return first === handle.value.trim().toUpperCase()
    ? { handleIndex, field: "name", excerpt: frontName }
    : undefined;
}

/**
 * The evidence that the Oracle text holds a whole word: the first rules line
 * that does, reminder text and the card's own name left out. The excerpt is
 * taken from the line as printed.
 *
 * @param card - the card's stored fields
 * @param word - the word the owner named
 * @param handleIndex - the handle's position in the theme
 */
function textWordEvidence(
  card: ThemeCard,
  word: string,
  handleIndex: number
): ThemeEvidence | undefined {
  const pattern = wholeWordPattern(word);
  const ownNames = faceValues(card, "name");
  for (const line of rulesLines(card)) {
    const found = pattern.exec(maskOwnNames(line, ownNames));
    if (found) {
      const excerpt = excerptAround(line, found.index);
      return { handleIndex, field: "oracleText", excerpt };
    }
  }
  return undefined;
}

/**
 * The evidence that a card has one card type or supertype, on any face.
 *
 * @param card - the card's stored fields
 * @param cardType - the type the owner named, such as Legendary
 * @param handleIndex - the handle's position in the theme
 */
function cardTypeEvidence(
  card: ThemeCard,
  cardType: string,
  handleIndex: number
): ThemeEvidence | undefined {
  const wanted = cardType.trim().toLowerCase();
  const typeLine = faceValues(card, "typeLine").find((line) =>
    typesOf(line).includes(wanted)
  );
  return typeLine === undefined
    ? undefined
    : { handleIndex, field: "typeLine", excerpt: typeLine };
}

/**
 * The evidence that a card meets one handle, if it does. A blank value meets
 * nothing: an empty word would otherwise match every card. Saving a blank
 * handle is refused upstream (slice 2, AC-102-101).
 *
 * @param card - the card's stored fields
 * @param handle - the handle to test
 * @param handleIndex - the handle's position in the theme
 */
function evidenceFor(
  card: ThemeCard,
  handle: ThemeHandle,
  handleIndex: number
): ThemeEvidence | undefined {
  if (handle.value.trim() === "") {
    return undefined;
  }
  switch (handle.kind) {
    case "creatureType":
      return creatureTypeEvidence(card, handle.value, handleIndex);
    case "nameWord":
      return nameWordEvidence(card, handle.value, handleIndex);
    case "firstLetter":
      return firstLetterEvidence(card, handle, handleIndex);
    case "textWord":
      return textWordEvidence(card, handle.value, handleIndex);
    case "cardType":
      return cardTypeEvidence(card, handle.value, handleIndex);
  }
  const _exhaustive: never = handle;
  return _exhaustive;
}

/**
 * Whether a card is on the owner's theme, and why.
 *
 * @example
 * const dragons: DeckTheme = { handles: [{ kind: "creatureType", value: "Dragon" }], match: "any" };
 * matchTheme(shivanDragon, dragons);
 * // → { onTheme: true, evidence: [{ handleIndex: 0, field: "typeLine", excerpt: "Creature — Dragon" }] }
 *
 * @param card - the card's stored fields
 * @param theme - the owner's handles and how many must hold
 * @returns the verdict with the evidence of every handle the card meets
 */
export function matchTheme(card: ThemeCard, theme: DeckTheme): ThemeMatch {
  const evidence = theme.handles.flatMap((handle, index) => {
    const found = evidenceFor(card, handle, index);
    return found ? [found] : [];
  });
  const onTheme =
    theme.match === "all"
      ? evidence.length === theme.handles.length
      : evidence.length > 0;
  return { onTheme, evidence };
}
