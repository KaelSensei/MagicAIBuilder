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
    if (
      isEcmaWhitespaceChar(ch) ||
      (ch >= "0" && ch <= "9")
    ) {
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
    if ((c >= "A" && c <= "Z") || (c >= "0" && c <= "9")) {
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

export function parsePlainTextDecklist(text: string): UrlImportCard[] {
  const cards: UrlImportCard[] = [];
  let inCommanderSection = false;

  for (const rawLine of text.split("\n").slice(0, 500)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//") || line.startsWith("#")) {
      // The header text has to be read with its comment marker stripped. The
      // previous form anchored `^(deck|…)` at the start of the raw line, which
      // can only be reached when the line is blank or starts with `//` / `#` —
      // so the "leave the commander section" branch could never fire. An empty
      // commander section followed by a deck header therefore mislabelled the
      // first deck card as the commander.
      const heading = line.replace(/^[/#]+/, "").trim();
      if (/commander/i.test(heading)) inCommanderSection = true;
      else if (/^(deck|main|sideboard)/i.test(heading)) inCommanderSection = false;
      continue;
    }

    const m = /^(\d+)x?\s+(\S.*)$/.exec(line);
    if (!m) continue;

    const quantity = Math.min(Math.max(1, Number.parseInt(m[1], 10)), 99);
    const name = stripTrailingSetCodeSuffix(
      stripSlashOrPipeCommentSuffix(m[2])
    ).trim();

    if (!name) continue;

    cards.push({ name, quantity, isCommander: inCommanderSection, isPartner: false, zone: "main" });
    if (inCommanderSection) inCommanderSection = false; // only first card in section = commander
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
