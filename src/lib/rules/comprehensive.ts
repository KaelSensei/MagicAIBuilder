/**
 * Parser for the official Magic: The Gathering Comprehensive Rules text file.
 *
 * The source document (`data/MagicCompRules-*.txt`) is structured as:
 * title → effective date → table of contents (ends with "Credits") →
 * body (sections 1–9, chapters 100–905) → glossary → credits.
 *
 * Parsing happens server-side only; the ~1 MB file is read once per process
 * and the parsed result is cached at module level.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

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
  /** Human-readable effective date, e.g. "August 7, 2026". */
  readonly effectiveDate: string;
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

  let effectiveDate = "";
  for (const line of lines) {
    const match = EFFECTIVE_DATE_RE.exec(line.trim());
    if (match) {
      effectiveDate = match[1];
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

const RULES_FILE = path.join(
  process.cwd(),
  "src",
  "lib",
  "rules",
  "data",
  "MagicCompRules-20260807.txt"
);

let cachedRules: ComprehensiveRules | null = null;

/**
 * Reads and parses the bundled Comprehensive Rules file.
 * The parsed document is cached for the lifetime of the server process.
 *
 * @returns The parsed Comprehensive Rules document.
 */
export function loadComprehensiveRules(): ComprehensiveRules {
  cachedRules ??= parseComprehensiveRules(readFileSync(RULES_FILE, "utf8"));
  return cachedRules;
}

export interface RulesSearchResult {
  readonly kind: "rule" | "glossary";
  readonly chapter: string | null;
  readonly reference: string;
  readonly text: string;
}

/** Search the locally parsed rules corpus; no network access is performed. */
export function searchComprehensiveRules(
  rules: ComprehensiveRules,
  query: string,
  limit = 25
): readonly RulesSearchResult[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery || limit <= 0) return [];

  const results: RulesSearchResult[] = [];
  for (const section of rules.sections) {
    for (const chapter of section.chapters) {
      for (const paragraph of chapter.paragraphs) {
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
