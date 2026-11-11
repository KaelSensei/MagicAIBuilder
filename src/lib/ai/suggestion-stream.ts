import type { StreamEvent } from "@/app/api/ai/suggest/route";
import { isRecordOrArray } from "@/lib/guards";
import type {
  AISuggestionResult,
  CardRemoval,
  CardSuggestion,
} from "./suggestion-types";

/** Running suggestion state while an NDJSON stream is read. */
export interface SuggestionStreamAcc {
  suggestions: CardSuggestion[];
  removals: CardRemoval[];
  analysis: string;
  provider: AISuggestionResult["provider"];
}

/**
 * Accepts one NDJSON object as a suggestion-stream event.
 *
 * @param value - parsed line
 * @returns whether the object matches a known event
 */
function isStreamEvent(value: unknown): value is StreamEvent {
  if (!isRecordOrArray(value) || typeof value.type !== "string") return false;
  switch (value.type) {
    case "analysis": {
      const provider = value.provider;
      return (
        typeof value.content === "string" &&
        (provider === "anthropic" || provider === "openai" || provider === "mock")
      );
    }
    case "suggestion":
      return isSuggestionData(value.data);
    case "removal":
      return isRemovalData(value.data);
    case "done":
      return true;
    case "error":
      return typeof value.message === "string";
    default:
      return false;
  }
}

/**
 * True when a suggestion payload has the fields the panel renders.
 *
 * @param value - event data
 * @returns whether the suggestion can be stored
 */
function isSuggestionData(value: unknown): boolean {
  if (!isRecordOrArray(value)) return false;
  const priority = value.priority;
  return (
    typeof value.name === "string" &&
    typeof value.reason === "string" &&
    typeof value.category === "string" &&
    (priority === "high" || priority === "medium" || priority === "low")
  );
}

/**
 * True when a removal payload names a card and a reason.
 *
 * @param value - event data
 * @returns whether the removal can be stored
 */
function isRemovalData(value: unknown): boolean {
  return (
    isRecordOrArray(value) &&
    typeof value.name === "string" &&
    typeof value.reason === "string"
  );
}

/**
 * Parses one NDJSON line into a stream event.
 *
 * @param line - one line from the response, possibly blank or invalid
 * @returns the event, or undefined when the line should be skipped
 */
function parseNdjsonLine(line: string): StreamEvent | undefined {
  const trimmed = line.trim();
  if (!trimmed) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return undefined;
  }
  if (!isStreamEvent(parsed)) return undefined;
  return parsed;
}

/**
 * Applies one event to the accumulator.
 *
 * @param event - validated stream event
 * @param acc - accumulator updated in place
 * @returns whether the caller should publish the new state
 */
function applyStreamEvent(event: StreamEvent, acc: SuggestionStreamAcc): boolean {
  switch (event.type) {
    case "analysis":
      acc.analysis = event.content;
      acc.provider = event.provider;
      return true;
    case "suggestion":
      acc.suggestions.push(event.data);
      return true;
    case "removal":
      acc.removals.push(event.data);
      return true;
    case "done":
      return false;
    case "error":
      throw new Error(event.message);
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

/**
 * Reads a NDJSON suggestion stream and publishes the accumulator after each change.
 *
 * @param reader - body reader from the suggest response
 * @param onUpdate - called with the accumulator after an event that changes it
 * @returns the final accumulator
 */
export async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onUpdate: (acc: SuggestionStreamAcc) => void
): Promise<SuggestionStreamAcc> {
  const decoder = new TextDecoder();
  const acc: SuggestionStreamAcc = {
    suggestions: [],
    removals: [],
    analysis: "",
    provider: "mock",
  };
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const event = parseNdjsonLine(line);
      if (event === undefined) continue;
      if (applyStreamEvent(event, acc)) onUpdate(acc);
    }
  }
  return acc;
}
