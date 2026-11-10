/**
 * Shape checks for Scryfall bodies the app did not build itself: Scryfall's own
 * answers before the server stores them, and the shared cache's answers before
 * the browser uses them. They check the fields every reader relies on, not the
 * whole card.
 */
import type { ScryfallCard, ScryfallSearchResponse } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param value - a parsed JSON body
 * @returns true when it carries a card's id and name
 */
export function isScryfallCard(value: unknown): value is ScryfallCard {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

/**
 * @param value - a parsed JSON body
 * @returns true when it is a Scryfall list of cards
 */
export function isScryfallSearchResponse(
  value: unknown
): value is ScryfallSearchResponse {
  return (
    isRecord(value) &&
    value.object === "list" &&
    typeof value.total_cards === "number" &&
    typeof value.has_more === "boolean" &&
    Array.isArray(value.data) &&
    value.data.every(isScryfallCard)
  );
}
