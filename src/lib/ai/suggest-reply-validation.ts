/**
 * Reads a model's reply to the suggest prompt before the route uses it.
 *
 * The prompt (approved in `app/api/ai/suggest/__prompts__/*.txt`) asks for an
 * object with an `analysis`, a `suggestions` list and a `removals` list. Only
 * what the route reads is checked here: each list is a list, and each entry
 * names a card, because the evidence lookup reads `name`. The panel's reader
 * (`suggestion-stream.ts`) checks the fields it renders.
 *
 * A reply with the wrong shape, or one that offers entries none of which is
 * usable, is refused. The route then settles the call as rejected by the
 * validator, which gives the player the allowance unit back: the player got
 * no answer (I-30 requirement 4.4). A reply with no entries at all, or with
 * an analysis alone, is an answer and is kept.
 */
import { isRecord } from "@/lib/guards";
import type {
  CardAlternative,
  CardRemoval,
  CardSuggestion,
} from "./suggestion-types";

/** The usable part of a reply: its lists with the nameless entries removed. */
export interface SuggestReplyContent {
  suggestions: CardSuggestion[];
  removals: CardRemoval[];
  analysis: string;
}

/** What `readSuggestReply` made of a parsed reply. */
export type SuggestReplyReading =
  | { readonly ok: true; readonly content: SuggestReplyContent }
  | { readonly ok: false; readonly reason: string };

/**
 * Reads parsed, untrusted provider output as a suggestion reply.
 *
 * Absent or null lists read as empty. Entries without a card name are dropped;
 * so are a kept suggestion's nameless alternatives, and its `alternatives`
 * field when it is not a list.
 *
 * @param value - the reply, parsed from JSON
 * @returns the usable content, or why the reply cannot be used: not an
 *   object, a list that is not a list, or entries none of which names a card
 *   with no analysis to fall back on
 */
export function readSuggestReply(value: unknown): SuggestReplyReading {
  if (!isRecord(value)) {
    return refused("The AI returned a reply that is not a JSON object.");
  }
  const suggestions = readList(value.suggestions);
  if (suggestions === undefined) {
    return refused("The AI returned suggestions that are not a list.");
  }
  const removals = readList(value.removals);
  if (removals === undefined) {
    return refused("The AI returned removals that are not a list.");
  }

  const content: SuggestReplyContent = {
    suggestions: suggestions.flatMap(readSuggestion),
    removals: removals.flatMap(readRemoval),
    analysis: typeof value.analysis === "string" ? value.analysis : "",
  };
  const offeredEntries = suggestions.length + removals.length > 0;
  const answers =
    content.suggestions.length + content.removals.length > 0 ||
    content.analysis.trim().length > 0;
  if (offeredEntries && !answers) {
    return refused(
      "The AI returned no usable suggestion, removal or analysis."
    );
  }
  return { ok: true, content };
}

function refused(reason: string): SuggestReplyReading {
  return { ok: false, reason };
}

/** A list field: absent or null reads as empty; anything else must be an array. */
function readList(field: unknown): readonly unknown[] | undefined {
  if (field === undefined || field === null) return [];
  return Array.isArray(field) ? field : undefined;
}

/** Whether an entry names a card: a string with text once trimmed. */
function namesCard(entry: Record<string, unknown>): boolean {
  return typeof entry.name === "string" && entry.name.trim().length > 0;
}

/**
 * Narrows to a suggestion the route can use. Only the name is checked here;
 * the panel's reader checks the fields it renders.
 */
function isCardSuggestion(entry: unknown): entry is CardSuggestion {
  return isRecord(entry) && namesCard(entry);
}

function isCardAlternative(entry: unknown): entry is CardAlternative {
  return isRecord(entry) && namesCard(entry);
}

function isCardRemoval(entry: unknown): entry is CardRemoval {
  return isRecord(entry) && namesCard(entry);
}

function readSuggestion(entry: unknown): CardSuggestion[] {
  if (!isCardSuggestion(entry)) return [];
  const { alternatives, ...suggestion } = entry;
  return Array.isArray(alternatives)
    ? [{ ...suggestion, alternatives: alternatives.filter(isCardAlternative) }]
    : [suggestion];
}

function readRemoval(entry: unknown): CardRemoval[] {
  return isCardRemoval(entry) ? [entry] : [];
}
