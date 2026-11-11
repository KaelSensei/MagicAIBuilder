import { z } from "zod";

/** The query the player reads and edits stays short enough to check. */
const MAX_SCRYFALL_QUERY_LENGTH = 400;

const INJECTION_MARKERS = [
  "ignore previous",
  "ignore all",
  "system prompt",
  "jailbreak",
  "```",
  "<script",
  "javascript:",
  "://",
] as const;

const SCRYFALL_KEYWORDS = new Set([
  "name", "n", "type", "t", "oracle", "o", "keyword", "kw", "flavor", "ft",
  "color", "c", "identity", "id", "ci", "mana", "m", "mv", "cmc", "power", "pow",
  "toughness", "tou", "loyalty", "loy", "is", "legal", "banned", "restricted",
  "format", "f", "set", "e", "s", "rarity", "r", "artist", "a", "usd", "eur",
  "tix", "year", "date", "lang", "game", "in", "produces", "devotion", "layout",
  "frame", "border", "stamp", "watermark", "unique", "cube", "art", "new",
  "reprint", "fo",
]);

const modelQuerySchema = z.object({ query: z.string() });

/**
 * Checks that a string is one bounded Scryfall query.
 *
 * @param query - candidate query, before or after deck context is applied
 * @returns whether the text is Scryfall syntax the player can run
 */
export function isAcceptableScryfallQuery(query: string): boolean {
  const trimmed = collapseSpaces(query);
  if (!hasAllowedQueryShape(trimmed)) return false;
  if (containsInjectionMarker(trimmed)) return false;
  if (!hasBalancedDelimiters(trimmed)) return false;
  return hasSearchIntent(trimmed);
}

/**
 * Reads the single query field from a model completion.
 *
 * @param modelText - raw provider completion, optionally wrapped in a code fence
 * @returns the query text, or null when the completion is not that JSON object
 */
export function readModelQuery(modelText: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(modelText));
  } catch {
    return null;
  }
  const result = modelQuerySchema.safeParse(parsed);
  if (!result.success) return null;
  const query = collapseSpaces(result.data.query);
  return query.length === 0 ? null : query;
}

/**
 * Drops legality clauses so deck format can be applied once, or left off.
 *
 * @param query - Scryfall text that may already contain legal:
 * @returns the query without those clauses
 */
export function removeLegalityClause(query: string): string {
  return collapseSpaces(query.replace(new RegExp("\\blegal:[a-z]+\\b", "gi"), " "));
}

function collapseSpaces(value: string): string {
  return value.replaceAll(/\s+/g, " ").trim();
}

function hasAllowedQueryShape(query: string): boolean {
  if (query.length === 0 || query.length > MAX_SCRYFALL_QUERY_LENGTH) return false;
  if (query.includes("`") || query.includes("\\") || query.includes(";") || query.includes("</")) {
    return false;
  }
  for (const char of query) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 32 || code === 127) return false;
  }
  return true;
}

function containsInjectionMarker(query: string): boolean {
  const lower = query.toLowerCase();
  return INJECTION_MARKERS.some((marker) => lower.includes(marker));
}

function hasBalancedDelimiters(query: string): boolean {
  let quotes = 0;
  let depth = 0;
  for (const char of query) {
    if (char === '"') quotes += 1;
    if (char === "(") depth += 1;
    if (char === ")") {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return quotes % 2 === 0 && depth === 0;
}

function hasSearchIntent(query: string): boolean {
  const remainder = removeLegalityClause(query);
  if (remainder.length === 0) return false;
  if (new RegExp('(?:^|\\s)!"').test(remainder)) return true;
  return hasKnownKeyword(remainder);
}

function hasKnownKeyword(query: string): boolean {
  const pattern = /(?:^|[\s(])-?([a-z]{1,12})\s*(?:<=|>=|!=|:|=|<|>)/gi;
  for (const match of query.matchAll(pattern)) {
    const keyword = match[1]?.toLowerCase();
    if (keyword && SCRYFALL_KEYWORDS.has(keyword)) return true;
  }
  return false;
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  const withoutOpen = trimmed.replace(/^```(?:json)?\s*/i, "");
  return withoutOpen.replace(/\s*```$/, "").trim();
}
