/*
 * Input checks for the AI routes: the build request schema, and the
 * sanitiser that turns client text into one bounded line of prompt data.
 */
import { z } from "zod";
import { COLOR_SYMBOLS } from "@/lib/mana/colors";

/**
 * A run of whitespace or control characters. `\s` covers the Unicode line and
 * paragraph separators (U+2028, U+2029); `\p{Cc}` covers CR, LF, NEL, NUL and
 * every other control character.
 */
const LINE_BREAKS_AND_WHITESPACE = /[\s\p{Cc}]+/gu;

/**
 * Turns client text into one bounded line of prompt data.
 *
 * Every prompt is line-structured: section headings such as `TASK:` and rows
 * such as `- Theme: …` start a line. So the text loses every line break and
 * control character, and its length is capped. Printable characters stay: an
 * apostrophe or a quote is part of a card name ("Urza's Saga",
 * `Henzie "Toolbox" Torre`), a French elision or a mana symbol (`{G}`), and the
 * model must read it verbatim to name the card back. A caller that wraps the
 * text in a delimiter escapes that delimiter itself.
 *
 * @param input - text sent by the client
 * @param maxLen - maximum length in UTF-16 code units
 * @returns the text on one line, whitespace collapsed, trimmed and capped
 */
export function sanitizeForPrompt(input: string, maxLen = 100): string {
  return input
    .replaceAll(LINE_BREAKS_AND_WHITESPACE, " ")
    .trim()
    .slice(0, maxLen);
}

// Schema for POST /api/ai/build
export const buildSchema = z.object({
  budget: z.number().positive().nullable().optional().default(null),
  colors: z.array(z.enum(COLOR_SYMBOLS)).min(1).max(6),
  strategy: z.string().min(1).max(50),
  bracket: z.number().int().min(1).max(5),
  commanderName: z.string().max(200).nullable().optional().default(null),
});
