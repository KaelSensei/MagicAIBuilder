/**
 * The Markdown subset a deck primer may use, parsed into a tree of blocks and inline nodes.
 *
 * Community context, pure. A deck's owner writes the primer and every visitor reads it, so the
 * text is never parsed as HTML, and every link in the tree already carries the verdict of
 * {@link classifyUserLink}: a renderer cannot forget to check a destination, because the raw one
 * is not in the tree. A `[[Card Name]]` mention carries no destination at all: the renderer
 * resolves it against the deck's cards (`primer-card-links`). `PublicDeckPrimer` renders the
 * tree; nothing here knows about React.
 * Not responsible for: the link policy (`lib/community/user-link.ts`) or the elements, classes,
 * `target` and `rel` a renderer chooses.
 *
 * @module community/primer-markdown
 */
import { classifyUserLink, type UserLink } from "./user-link";

/**
 * A `[[Card Name]]` or `[[Card Name|SET]]` mention: the name and set code as written, trimmed.
 * It holds no destination: the renderer resolves the name against the deck's cards and builds
 * the link itself, so nothing the author typed inside the brackets can become an `href`.
 */
export interface PrimerCardMention {
  readonly kind: "card";
  readonly name: string;
  /** The set code after the `|`, or `null` when the mention names none. */
  readonly setCode: string | null;
}

/** A run of text, a link whose destination has been classified, or a card mention. */
export type PrimerInline =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "link"; readonly label: string; readonly link: UserLink }
  | PrimerCardMention;

/**
 * A heading of the primer. `text` is the heading exactly as written, link markup included: the
 * contents bar shows it and {@link primerHeadingId} derives `id` from it; `content` is what the
 * heading itself renders.
 */
export interface PrimerHeading {
  readonly kind: "heading";
  /** The depth to render. The page's deck title is the h1, so `#` and `##` both become 2. */
  readonly level: 2 | 3;
  readonly id: string;
  readonly text: string;
  readonly content: readonly PrimerInline[];
}

/** One block of the primer, in document order. */
export type PrimerBlock =
  | PrimerHeading
  | { readonly kind: "paragraph"; readonly content: readonly PrimerInline[] }
  | {
      readonly kind: "list";
      readonly ordered: boolean;
      readonly items: readonly (readonly PrimerInline[])[];
    };

/** `#`, `##` or `###` then a space: deeper headings stay text. */
const HEADING_LINE = /^(#{1,3})\s(.+)$/;
/** `-`, `*` or `1.` then a space. Indentation was trimmed, so a nested item joins the list. */
const LIST_ITEM_LINE = /^(?:([-*])|(\d+)\.)\s(.+)$/;

/**
 * Parses a primer into blocks: headings, paragraphs and lists, each holding inline nodes.
 *
 * Lines are trimmed, then: a heading line ends the open paragraph or list; a list item ends the
 * open paragraph and, when its marker kind changes (bullet to number or back), the open list;
 * a blank line ends both; any other line ends the open list and joins the open paragraph, whose
 * lines are rendered with a space between them. Inline, `[label](destination)` is a link and
 * `[[Card Name]]` a card mention. Nothing else is Markdown: emphasis, raw HTML and code stay
 * literal text.
 *
 * @param description - the primer as its owner wrote it; an empty string gives no blocks
 * @returns the blocks in document order; never throws
 */
export function parsePrimer(description: string): readonly PrimerBlock[] {
  const blocks: PrimerBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let ordered = false;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({
        kind: "paragraph",
        content: parseInline(paragraph.join(" ")),
      });
    }
    paragraph = [];
  };
  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ kind: "list", ordered, items: listItems.map(parseInline) });
    }
    listItems = [];
  };

  for (const rawLine of description.split("\n")) {
    const line = rawLine.trim();
    const heading = HEADING_LINE.exec(line);
    const listItem = LIST_ITEM_LINE.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(parseHeading(heading[1].length, heading[2].trimStart()));
    } else if (listItem) {
      flushParagraph();
      const nextOrdered = listItem[2] !== undefined;
      if (listItems.length > 0 && ordered !== nextOrdered) flushList();
      ordered = nextOrdered;
      listItems.push(listItem[3].trimStart());
    } else if (line === "") {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

function parseHeading(markerLength: number, text: string): PrimerHeading {
  return {
    kind: "heading",
    level: markerLength >= 3 ? 3 : 2,
    id: primerHeadingId(text),
    text,
    content: parseInline(text),
  };
}

/** A node of the tree with a key that no sibling shares. */
export interface KeyedPrimerNode<T> {
  readonly key: string;
  readonly node: T;
}

/**
 * Keys siblings by what they say: the content, `#`, then its occurrence among the siblings that
 * say the same, so two `Ramp` items are `Ramp#1` and `Ramp#2`.
 *
 * A renderer needs one key per sibling. The array index is not one: a node inserted before
 * another shifts every later index, while a content key stays put. The occurrence number is all
 * digits and comes after the last `#`, so two different (content, occurrence) pairs never give
 * the same key, whatever the content holds.
 *
 * @param nodes - the siblings, in document order
 * @param contentOf - what a sibling says; equal strings mean equal content
 * @returns each sibling with its key, in the order given
 */
export function keyPrimerSiblings<T>(
  nodes: readonly T[],
  contentOf: (node: T) => string
): readonly KeyedPrimerNode<T>[] {
  const occurrences = new Map<string, number>();
  return nodes.map((node) => {
    const content = contentOf(node);
    const occurrence = (occurrences.get(content) ?? 0) + 1;
    occurrences.set(content, occurrence);
    return { key: `${content}#${occurrence}`, node };
  });
}

/**
 * What a run of inline nodes reads as: its text runs, link labels and mentioned card names, in
 * order. Sibling keys and the editor preview's block keys read it.
 */
export function primerInlineText(content: readonly PrimerInline[]): string {
  return content.map(inlineNodeText).join("");
}

function inlineNodeText(node: PrimerInline): string {
  switch (node.kind) {
    case "text":
      return node.text;
    case "link":
      return node.label;
    case "card":
      return node.name;
    default: {
      const unhandled: never = node;
      return unhandled;
    }
  }
}

/**
 * Every card mention in `blocks`, in document order: heading, paragraph and list item content.
 *
 * @param blocks - a parsed primer
 * @returns the mentions, repeats included
 */
export function primerCardMentions(
  blocks: readonly PrimerBlock[]
): readonly PrimerCardMention[] {
  return blocks
    .flatMap(blockInlineRuns)
    .flat()
    .filter((node) => node.kind === "card");
}

function blockInlineRuns(
  block: PrimerBlock
): readonly (readonly PrimerInline[])[] {
  switch (block.kind) {
    case "heading":
    case "paragraph":
      return [block.content];
    case "list":
      return block.items;
    default: {
      const unhandled: never = block;
      return unhandled;
    }
  }
}

/** The headings of `blocks`, in document order: what the contents bar lists. */
export function primerHeadings(
  blocks: readonly PrimerBlock[]
): readonly PrimerHeading[] {
  return blocks.filter((block) => block.kind === "heading");
}

/**
 * The element id of a heading, from its text as written: `primer-` then the text folded to
 * lowercase ASCII letters and digits, each other run of characters one hyphen, and `section`
 * when nothing survives (`primer-section`), so a heading in another script still has an id.
 *
 * Unicode NFKD also folds compatibility characters, so `Phase Ⅱ` gives `primer-phase-ii` and
 * `Ramp²` gives `primer-ramp2`; `text/transliterate` (NFD) would drop them. Primer anchors are
 * shared and bookmarked, so the rule stays as it shipped. Two headings with the same text get
 * the same id (B2-22).
 *
 * @param text - the heading as written, link markup included
 */
export function primerHeadingId(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `primer-${slug || "section"}`;
}

/**
 * Splits a line into text runs and `[label](destination)` links, each destination classified.
 *
 * A link needs a non-empty label, `(` right after `]`, and a destination that runs to the first
 * `)` or whitespace and ends at a `)`: `[x](a b)` and `[x]( url)` stay text, and a `(` inside
 * the destination is kept while the first `)` ends it. An unclosed `[` is text, and a `[`
 * inside a label belongs to the label (`[[a](u)` links `[a`).
 *
 * Links are found first; the text between them is then split into card mentions (see
 * {@link CARD_MENTION}), so a `[[` that opens a link label stays part of that label.
 *
 * @returns the runs in order; an empty line gives no nodes
 */
export function parseInline(text: string): readonly PrimerInline[] {
  const nodes: PrimerInline[] = [];
  let cursor = 0;
  for (const link of primerLinks(text)) {
    if (link.index > cursor) {
      nodes.push(...parseCardMentions(text.slice(cursor, link.index)));
    }
    nodes.push({
      kind: "link",
      label: link.label,
      link: classifyUserLink(link.destination),
    });
    cursor = link.end;
  }
  if (cursor < text.length)
    nodes.push(...parseCardMentions(text.slice(cursor)));
  return nodes;
}

/**
 * `[[name]]` or `[[name|set]]`: neither part may hold a bracket or a pipe, so a second `|` or a
 * nested `[` leaves the whole mention as text. The excluded characters also end each part, so
 * a match attempt never scans past the next `[` and a line of openings stays linear.
 */
const CARD_MENTION = /\[\[([^[\]|]+)(?:\|([^[\]|]*))?\]\]/g;

/** Splits a run of text into text runs and card mentions; a blank name stays text. */
function parseCardMentions(text: string): readonly PrimerInline[] {
  const nodes: PrimerInline[] = [];
  let cursor = 0;
  for (const match of text.matchAll(CARD_MENTION)) {
    const name = match[1].trim();
    if (name === "") continue;
    if (match.index > cursor) {
      nodes.push({ kind: "text", text: text.slice(cursor, match.index) });
    }
    const setCode = match[2]?.trim() ?? "";
    nodes.push({
      kind: "card",
      name,
      setCode: setCode === "" ? null : setCode,
    });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length)
    nodes.push({ kind: "text", text: text.slice(cursor) });
  return nodes;
}

interface LinkMatch {
  readonly index: number;
  readonly end: number;
  readonly label: string;
  readonly destination: string;
}

function* primerLinks(text: string): Generator<LinkMatch> {
  const destinationEnds = destinationEndings(text);
  let cursor = 0;
  while (cursor < text.length) {
    const start = text.indexOf("[", cursor);
    if (start < 0) return;
    const labelEnd = text.indexOf("]", start + 1);
    if (labelEnd < 0) return;
    cursor = labelEnd + 1;
    if (labelEnd === start + 1 || text[cursor] !== "(") continue;
    const destinationStart = cursor + 1;
    const destinationEnd = destinationEnds[destinationStart] ?? text.length;
    if (destinationEnd === destinationStart || text[destinationEnd] !== ")")
      continue;
    cursor = destinationEnd + 1;
    yield {
      index: start,
      end: cursor,
      label: text.slice(start + 1, labelEnd),
      destination: text.slice(destinationStart, destinationEnd),
    };
  }
}

/**
 * For each index, where a destination starting there would end: the next `)` or whitespace.
 * Computed once, backwards, so a line full of malformed `[` stays linear instead of rescanning
 * the rest of the text for every opening bracket.
 */
function destinationEndings(text: string): readonly number[] {
  const destinationEnds: number[] = [];
  let end = text.length;
  for (let index = text.length - 1; index >= 0; index -= 1) {
    if (text[index] === ")" || /\s/.test(text[index])) end = index;
    destinationEnds[index] = end;
  }
  return destinationEnds;
}
