/**
 * Decklist text parsing, lifted out of the URL importers.
 *
 * Everything here turns a string into cards: no network, and no knowledge of
 * any particular site beyond the shapes decklists are pasted in. TappedOut,
 * MTGTop8 and MTGDecks all download plain text and share
 * `parsePlainTextDecklist`; the HTML fallback exists because MTGTop8 sometimes
 * serves a page where a file was expected.
 *
 * The hand-rolled whitespace check is deliberate: the obvious `\s*.*$` patterns
 * are ReDoS-prone, and this parser eats whatever a third-party site returns.
 *
 * @module import/decklist-parse
 */

// Type-only, so this creates no runtime edge back to the module importing us.
import type { UrlImportCard } from "./url-import";

/** ECMA-262 whitespace (`\s`), single code unit — used instead of ReDoS-prone `\s*….*$` patterns */
function isEcmaWhitespaceChar(c: string): boolean {
  return /\s/.test(c);
}

function isSetCodeChar(c: string): boolean {
  return /^[a-z0-9]$/i.test(c);
}

function isCollectorSuffixChar(c: string): boolean {
  return isEcmaWhitespaceChar(c) || /^\d$/.test(c);
}

/**
 * Drop a suffix starting at the leftmost “optional whitespace + `//` or `|`”.
 * Replaces legacy `.replace(/\s*(\/\/|\|).*$/, "")` with linear-time scanning.
 */
function stripSlashOrPipeCommentSuffix(name: string): string {
  for (let i = 0; i < name.length; i++) {
    let j = i;
    while (j < name.length && isEcmaWhitespaceChar(name[j] ?? "")) j++;
    if (j < name.length && name[j] === "|") {
      return name.slice(0, i).trimEnd();
    }
    if (j + 1 < name.length && name[j] === "/" && name[j + 1] === "/") {
      return name.slice(0, i).trimEnd();
    }
  }
  return name;
}

/**
 * Remove a trailing set code ` (ABC)` optionally followed by spaces/digits (ReDoS-safe).
 * Mirrors `.replace(/\s*\([A-Z0-9]{2,6}\)[\s\d]*$/, "")`.
 */
function stripTrailingSetCodeSuffix(name: string): string {
  let i = name.length;
  while (i > 0) {
    const ch = name[i - 1] ?? "";
    if (isCollectorSuffixChar(ch)) {
      i--;
      continue;
    }
    break;
  }
  if (i === 0 || name[i - 1] !== ")") return name;

  let k = i - 2;
  let alnumLen = 0;
  while (k >= 0 && alnumLen < 6) {
    const c = name[k] ?? "";
    if (isSetCodeChar(c)) {
      alnumLen++;
      k--;
      continue;
    }
    break;
  }
  if (alnumLen < 2 || alnumLen > 6) return name;
  if (k < 0 || name[k] !== "(") return name;

  let beforeParen = k;
  while (beforeParen > 0 && isEcmaWhitespaceChar(name[beforeParen - 1] ?? "")) {
    beforeParen--;
  }
  return name.slice(0, beforeParen);
}

type DecklistSection = "main" | "sideboard" | "maybeboard" | "commander" | "partner";

function headingSection(heading: string): DecklistSection | undefined {
  switch (heading) {
    case "commander": return "commander";
    case "partner": return "partner";
    case "sideboard": return "sideboard";
    case "considering":
    case "maybeboard": return "maybeboard";
    case "deck":
    case "main":
    case "mainboard": return "main";
    default: return undefined;
  }
}

function parseDecklistCard(line: string, section: DecklistSection): UrlImportCard | null {
  const match = /^(\d+)[xX]?\s+(\S.*)$/.exec(line);
  if (!match) return null;
  const quantity = Math.min(Math.max(1, Number.parseInt(match[1], 10)), 99);
  const name = stripTrailingSetCodeSuffix(stripSlashOrPipeCommentSuffix(match[2])).trim();
  if (!name) return null;
  return {
    name,
    quantity,
    isCommander: section === "commander",
    isPartner: section === "partner",
    zone: section === "sideboard" || section === "maybeboard" ? section : "main",
  };
}

export function parsePlainTextDecklist(text: string): UrlImportCard[] {
  const cards: UrlImportCard[] = [];
  let section: DecklistSection = "main";

  for (const rawLine of text.split(/\r\n|\r|\n/).slice(0, 500)) {
    const line = rawLine.trim();
    if (!line) continue;
    const isComment = line.startsWith("//") || line.startsWith("#");
    const heading = (isComment ? line.replace(/^[/#]+/, "").trim() : line)
      .toLowerCase()
      .replace(/:$/, "")
      .replace(/\s{0,4}\(\d{1,3}\)$/, "");
    const nextSection = headingSection(heading);
    if (nextSection) {
      section = nextSection;
      continue;
    }
    if (isComment) continue;

    const card = parseDecklistCard(line, section);
    if (!card) continue;
    cards.push(card);
    if (section === "commander" || section === "partner") section = "main";
  }

  return cards;
}

/** Fallback: extract card names from HTML via simple regex patterns */
export function extractCardsFromHtml(html: string): UrlImportCard[] {
  // MTGTop8 has cards in spans/divs with class "O14" or similar
  // Pattern: "N Card Name" in consecutive elements
  const cards: UrlImportCard[] = [];
  const matches = html.matchAll(/\b(\d+)\s+([A-Z][A-Za-z0-9', /()-]{1,60}?)(?=<|&nbsp;|\s{2,})/g);
  for (const m of matches) {
    const quantity = Number.parseInt(m[1], 10);
    const name = m[2].trim();
    if (quantity > 0 && quantity <= 20 && name.length > 2) {
      cards.push({ name, quantity, isCommander: false, isPartner: false, zone: "main" });
    }
  }
  // Deduplicate by name
  const seen = new Set<string>();
  return cards.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
}
