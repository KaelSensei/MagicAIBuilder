/** How a missing printing is deferred on the buy list. */
export type AcquisitionMode = "proxy_now" | "buy_later";

/** A buy-list choice, including returning the printing to the buy-now set. */
export type AcquisitionChoice = AcquisitionMode | "buy_now";

/**
 * True when a value is a deferred acquisition mode.
 *
 * @param value - unknown mode field
 * @returns whether the value is `proxy_now` or `buy_later`
 */
function isAcquisitionMode(value: unknown): value is AcquisitionMode {
  return value === "proxy_now" || value === "buy_later";
}

/**
 * Reads saved intents from the acquisition-intent route.
 *
 * A payload that is not an object, or whose `intents` field is not an array,
 * returns null so the caller can leave the current map alone. An object with
 * no `intents` field is an empty list.
 *
 * @param payload - raw JSON body
 * @returns the mode map, or null when the body cannot be trusted
 */
export function readAcquisitionIntents(
  payload: unknown
): Readonly<Record<string, AcquisitionMode>> | null {
  if (typeof payload !== "object" || payload === null) return null;
  if (!("intents" in payload)) return {};
  const intents = payload.intents;
  if (!Array.isArray(intents)) return null;

  const next: Record<string, AcquisitionMode> = {};
  for (const entry of intents) {
    if (!isIntentEntry(entry)) continue;
    next[entry.scryfallId] = entry.mode;
  }
  return next;
}

/**
 * Applies one printing's choice without touching the other printings.
 *
 * @param current - modes currently shown
 * @param scryfallId - printing the player toggled
 * @param mode - next choice; `buy_now` clears the deferred mode
 * @returns a new map
 */
export function applyAcquisitionChoice(
  current: Readonly<Record<string, AcquisitionMode>>,
  scryfallId: string,
  mode: AcquisitionChoice
): Record<string, AcquisitionMode> {
  const next = { ...current };
  if (mode === "buy_now") {
    delete next[scryfallId];
    return next;
  }
  next[scryfallId] = mode;
  return next;
}

/**
 * Type guard for one saved intent row.
 *
 * @param entry - one element of the intents array
 * @returns whether the row has a printing id and a known mode
 */
function isIntentEntry(
  entry: unknown
): entry is { readonly scryfallId: string; readonly mode: AcquisitionMode } {
  if (typeof entry !== "object" || entry === null) return false;
  if (!("scryfallId" in entry) || typeof entry.scryfallId !== "string") return false;
  if (!("mode" in entry) || !isAcquisitionMode(entry.mode)) return false;
  return true;
}
