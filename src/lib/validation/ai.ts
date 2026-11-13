/*
 * Input checks for the AI routes: the build and suggest request schemas, and the
 * sanitiser that turns client text into one bounded line of prompt data.
 */
import { z } from "zod";
import { BRACKET_LEVELS } from "@/lib/constants/brackets";
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

/**
 * The most card names one suggestion request may list: a Commander deck. The
 * deck's Game Changers are some of its cards, so the same cap bounds them.
 */
const MAX_SUGGEST_CARD_NAMES = 100;

/**
 * The most bracket warnings one request may carry. `scoreBracket`
 * (`lib/deck/bracket.ts`) writes at most twelve: legality (2), combos (1),
 * Game Changers (1), composition (4), target bracket (1) and companion (3).
 */
const MAX_BRACKET_WARNINGS = 20;

/**
 * The longest bracket warning one request may carry. A legality warning names
 * every offending card, so it can list a whole deck: after its label, this
 * leaves room for 100 names of 37 characters, each with its ", " separator.
 */
export const MAX_BRACKET_WARNING_LENGTH = 4000;

/**
 * The most detected themes one request may carry. `detectThemes`
 * (`lib/deck/themes.ts`) knows 17 themes.
 */
const MAX_DETECTED_THEMES = 20;

/** The longest theme name one request may carry; the longest known is 14. */
export const MAX_THEME_NAME_LENGTH = 50;

/**
 * The deck's category counts, with the keys and in the order
 * `deckCategoryCounts` (`lib/ai/suggest-payload.ts`) writes them. The prompt
 * lists each key, so a key outside these six is dropped.
 */
const DECK_CATEGORY_COUNTS = z
  .object({
    ramp: z.number(),
    draw: z.number(),
    removal: z.number(),
    boardWipe: z.number(),
    creatures: z.number(),
    lands: z.number(),
  })
  .partial();

/**
 * Schema for the body of `POST /api/ai/suggest`, the deck summary that
 * `buildSuggestPayload` (`lib/ai/suggest-payload.ts`) sends.
 *
 * A body that fails it is refused before any model call. Unknown fields are
 * dropped: the client also sends `cardPrices`, which the route never reads.
 * `brief` and `question` stay `unknown` because their own readers
 * (`normalizeDeckBrief`, `readDeckQuestion`) bound them.
 */
export const suggestSchema = z.object({
  deckId: z.string(),
  commanderName: z.string().nullable(),
  partnerName: z.string().nullable(),
  colorIdentity: z.array(z.enum(COLOR_SYMBOLS)).max(COLOR_SYMBOLS.length),
  cardNames: z.array(z.string()).max(MAX_SUGGEST_CARD_NAMES),
  categories: DECK_CATEGORY_COUNTS,
  avgCmc: z.number(),
  bracket: z.literal(BRACKET_LEVELS),
  bracketDimensions: z
    .object({
      ramp: z.number(),
      draw: z.number(),
      removal: z.number(),
      winSpeed: z.number(),
      avgCmc: z.number(),
    })
    .optional(),
  bracketWarnings: z
    .array(z.string().max(MAX_BRACKET_WARNING_LENGTH))
    .max(MAX_BRACKET_WARNINGS)
    .optional(),
  targetBracket: z.literal(BRACKET_LEVELS),
  budget: z.number().nullable(),
  gameChangersCount: z.number(),
  gameChangersList: z.array(z.string()).max(MAX_SUGGEST_CARD_NAMES).optional(),
  detectedThemes: z
    .array(z.string().max(MAX_THEME_NAME_LENGTH))
    .max(MAX_DETECTED_THEMES)
    .optional(),
  archetype: z.string().optional(),
  budgetPerCard: z.number().nullable().optional(),
  brief: z.unknown().optional(),
  question: z.unknown().optional(),
});

/** A suggestion request body that passed {@link suggestSchema}. */
export type SuggestBody = z.infer<typeof suggestSchema>;
