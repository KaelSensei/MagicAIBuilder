/**
 * Parser and search for the official Magic: The Gathering Comprehensive Rules
 * text, as pure functions over the file's content.
 *
 * The source document (`infrastructure/data/MagicCompRules-*.txt`) is
 * structured as: title, effective date, table of contents (ends with
 * "Credits"), body (sections 1-9, chapters 100-905), glossary, credits.
 *
 * Nothing here touches the file system: `infrastructure/rules-file.ts` reads
 * the bundled file once per server process and hands its text to
 * `parseComprehensiveRules`, so the parser and the search run anywhere,
 * including in tests with a few lines of fixture text.
 */
import { parseRulesEffectiveDate } from "@/modules/rules-reference/domain/effective-date";

export interface RuleParagraph {
  /** Rule reference like "100.1" or "100.1a"; null for example/plain lines. */
  readonly ref: string | null;
  readonly text: string;
}

export interface RulesChapter {
  /** Three-digit chapter number, e.g. "903". */
  readonly number: string;
  readonly title: string;
  readonly paragraphs: readonly RuleParagraph[];
}

export interface RulesSection {
  /** Single-digit section number, e.g. "9". */
  readonly number: string;
  readonly title: string;
  readonly chapters: readonly RulesChapter[];
}

export interface GlossaryEntry {
  readonly term: string;
  readonly definition: string;
}

export interface ComprehensiveRules {
  /**
   * Day the rules take effect (midnight UTC), parsed from the file's
   * "These rules are effective as of August 7, 2026." line; null when absent.
   */
  readonly effectiveDate: Date | null;
  readonly sections: readonly RulesSection[];
  readonly glossary: readonly GlossaryEntry[];
}

const SECTION_RE = /^(\d)\. (.+)$/;
const CHAPTER_RE = /^(\d{3})\. (.+)$/;
const RULE_REF_RE = /^(\d{3}\.\d+[a-z]?)\.? /;
const EFFECTIVE_DATE_RE = /^These rules are effective as of (.+)\.$/;

/** Lines containing only whitespace (including non-breaking spaces) are separators. */
function isBlank(line: string): boolean {
  return line.replace(/[\s ]/g, "") === "";
}

interface MutableChapter {
  readonly number: string;
  readonly title: string;
  readonly paragraphs: RuleParagraph[];
}

interface MutableSection {
  readonly number: string;
  readonly title: string;
  readonly chapters: MutableChapter[];
}

function parseBody(lines: readonly string[]): readonly RulesSection[] {
  const sections: MutableSection[] = [];
  let currentSection: MutableSection | null = null;
  let currentChapter: MutableChapter | null = null;

  for (const line of lines) {
    if (isBlank(line)) continue;

    const sectionMatch = SECTION_RE.exec(line);
    if (sectionMatch) {
      currentSection = {
        number: sectionMatch[1],
        title: sectionMatch[2],
        chapters: [],
      };
      currentChapter = null;
      sections.push(currentSection);
      continue;
    }

    const chapterMatch = CHAPTER_RE.exec(line);
    if (chapterMatch && currentSection && !RULE_REF_RE.test(line)) {
      currentChapter = {
        number: chapterMatch[1],
        title: chapterMatch[2],
        paragraphs: [],
      };
      currentSection.chapters.push(currentChapter);
      continue;
    }

    if (currentChapter) {
      const refMatch = RULE_REF_RE.exec(line);
      currentChapter.paragraphs.push({
        ref: refMatch ? refMatch[1] : null,
        text: line,
      });
    }
  }

  return sections;
}

function parseGlossary(lines: readonly string[]): readonly GlossaryEntry[] {
  const entries: GlossaryEntry[] = [];
  let term: string | null = null;
  let definitionLines: string[] = [];

  const flush = (): void => {
    if (term !== null && definitionLines.length > 0) {
      entries.push({ term, definition: definitionLines.join("\n") });
    }
    term = null;
    definitionLines = [];
  };

  for (const line of lines) {
    if (isBlank(line)) {
      flush();
      continue;
    }
    if (term === null) {
      term = line.trim();
    } else {
      definitionLines.push(line.trim());
    }
  }
  flush();

  return entries;
}

/**
 * Parses the raw Comprehensive Rules document.
 *
 * @param raw - Full text content of the rules file.
 * @returns Structured sections, chapters, rule paragraphs, and glossary.
 */
export function parseComprehensiveRules(raw: string): ComprehensiveRules {
  const lines = raw.replaceAll("\r\n", "\n").split("\n");

  let effectiveDate: Date | null = null;
  for (const line of lines) {
    const match = EFFECTIVE_DATE_RE.exec(line.trim());
    if (match) {
      effectiveDate = parseRulesEffectiveDate(match[1]);
      break;
    }
  }

  // The table of contents ends with a "Credits" line; the body follows it.
  const contentsEnd = lines.findIndex((l) => l.trim() === "Credits");
  const bodyLines = contentsEnd >= 0 ? lines.slice(contentsEnd + 1) : lines;

  const glossaryStart = bodyLines.findIndex((l) => l.trim() === "Glossary");
  const creditsStart = bodyLines.findIndex((l) => l.trim() === "Credits");

  const sectionLines =
    glossaryStart >= 0 ? bodyLines.slice(0, glossaryStart) : bodyLines;

  // The glossary runs from its heading to the trailing Credits line, if present.
  const glossaryEnd = creditsStart > glossaryStart ? creditsStart : undefined;
  const glossaryLines =
    glossaryStart >= 0 ? bodyLines.slice(glossaryStart + 1, glossaryEnd) : [];

  return {
    effectiveDate,
    sections: parseBody(sectionLines),
    glossary: parseGlossary(glossaryLines),
  };
}

export interface RulesSearchResult {
  readonly kind: "rule" | "glossary";
  readonly chapter: string | null;
  readonly reference: string;
  readonly text: string;
}

/** Every rule paragraph with its chapter, in document order. */
function* searchableRuleParagraphs(rules: ComprehensiveRules) {
  for (const section of rules.sections) {
    for (const chapter of section.chapters) {
      for (const paragraph of chapter.paragraphs) {
        yield { chapter, paragraph };
      }
    }
  }
}

/**
 * Finds the rule paragraphs, then the glossary entries, whose text contains
 * the query, case-insensitively, in document order.
 *
 * A blank query or a non-positive limit yields no result. The search is
 * a plain substring match over the parsed corpus: no network, no index.
 *
 * @param rules - The parsed document to search.
 * @param query - Free text; surrounding whitespace is ignored.
 * @param limit - The most results to return, rules before glossary entries.
 */
export function searchComprehensiveRules(
  rules: ComprehensiveRules,
  query: string,
  limit = 25
): readonly RulesSearchResult[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery || limit <= 0) return [];

  const results: RulesSearchResult[] = [];
  for (const { chapter, paragraph } of searchableRuleParagraphs(rules)) {
    if (paragraph.text.toLocaleLowerCase().includes(normalizedQuery)) {
      results.push({
        kind: "rule",
        chapter: chapter.number,
        reference: paragraph.ref ?? chapter.number,
        text: paragraph.text,
      });
      if (results.length >= limit) return results;
    }
  }

  for (const entry of rules.glossary) {
    const haystack = `${entry.term} ${entry.definition}`.toLocaleLowerCase();
    if (haystack.includes(normalizedQuery)) {
      results.push({
        kind: "glossary",
        chapter: null,
        reference: entry.term,
        text: entry.definition,
      });
      if (results.length >= limit) return results;
    }
  }
  return results;
}
