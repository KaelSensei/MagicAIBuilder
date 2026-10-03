import { sanitizeForPrompt } from "@/lib/validation/ai";

export const MAX_DECK_BRIEF_FIELD_LENGTH = 200;

export interface DeckBrief {
  readonly theme: string;
  readonly playPattern: string;
  readonly dislikes: string;
}

function readTextField(value: unknown, key: keyof DeckBrief): string {
  if (typeof value !== "object" || value === null) return "";
  const field = Object.getOwnPropertyDescriptor(value, key)?.value;
  return typeof field === "string" ? field : "";
}

/**
 * Narrows an untrusted API value to the three supported brief fields.
 *
 * @param value - unknown request payload value
 * @returns A safe brief with invalid or missing fields replaced by empty text
 */
export function normalizeDeckBrief(value: unknown): DeckBrief {
  return {
    theme: readTextField(value, "theme"),
    playPattern: readTextField(value, "playPattern"),
    dislikes: readTextField(value, "dislikes"),
  };
}

/**
 * Formats a player's deckbuilding intent as bounded prompt data.
 *
 * @param brief - player-authored theme, desired experience and exclusions
 * @returns A prompt section with blank preferences omitted
 */
export function formatDeckBriefForPrompt(brief: DeckBrief): string {
  const rows: string[] = [];
  const theme = sanitizeForPrompt(brief.theme, MAX_DECK_BRIEF_FIELD_LENGTH);
  const playPattern = sanitizeForPrompt(brief.playPattern, MAX_DECK_BRIEF_FIELD_LENGTH);
  const dislikes = sanitizeForPrompt(brief.dislikes, MAX_DECK_BRIEF_FIELD_LENGTH);

  if (theme) rows.push(`- Theme: ${theme}`);
  if (playPattern) rows.push(`- Desired play pattern: ${playPattern}`);
  if (dislikes) rows.push(`- Avoid: ${dislikes}`);

  if (rows.length === 0) {
    return "PLAYER DECK BRIEF:\n  No additional preferences provided";
  }
  return `PLAYER DECK BRIEF:\n${rows.join("\n")}`;
}
