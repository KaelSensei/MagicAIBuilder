/**
 * Runtime parsing for collection payloads.
 *
 * This is a trust boundary: everything here validates data that arrived from
 * the API, and a rejection is silent by design — `parseCollectionCard` returns
 * `null` and the caller drops the row rather than letting a half-formed card
 * into the store. Silent rejection is the right behaviour and the reason these
 * guards deserve tests of their own, since a mistake here makes a card vanish
 * with no error anywhere.
 *
 * @module collection/parse
 */

import type { CollectionCard, CardCondition } from "./types";

const VALID_CONDITIONS = new Set(["NM", "LP", "MP", "HP", "DMG"]);

/**
 * Parses a card condition from an unknown value.
 *
 * @param v - raw value, typically from an API response
 * @returns the condition, or null when absent or unrecognised
 */
export function parseCondition(v: unknown): CardCondition | null {
  if (typeof v === "string" && VALID_CONDITIONS.has(v)) return v as CardCondition;
  return null;
}

/**
 * Type guard for plain objects.
 *
 * Note this accepts arrays, which are objects — callers that care read named
 * properties, and an array has none of them, so the field checks reject it.
 *
 * @param v - any value
 */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Parses one collection card from an unknown payload.
 *
 * Every field the store relies on is checked; a single wrong type rejects the
 * whole row. Optional fields degrade instead: an unparseable condition becomes
 * null, a missing image becomes an empty string.
 *
 * @param v - raw value, typically one element of an API list
 * @returns the card, or null when the payload cannot be trusted
 */
export function parseCollectionCard(v: unknown): CollectionCard | null {
  if (!isRecord(v)) return null;

  const { id, scryfallId, name, quantity, foil, createdAt, acquiredAt, price, imageUri } = v;

  if (typeof id !== "string") return null;
  if (typeof scryfallId !== "string") return null;
  if (typeof name !== "string") return null;
  if (typeof quantity !== "number") return null;
  if (typeof foil !== "boolean") return null;
  if (typeof createdAt !== "string") return null;

  return {
    id,
    scryfallId,
    name,
    quantity,
    foil,
    condition: parseCondition(v["condition"]),
    acquiredAt: typeof acquiredAt === "string" ? new Date(acquiredAt) : null,
    price: typeof price === "number" ? price : null,
    imageUri: typeof imageUri === "string" ? imageUri : "",
    createdAt: new Date(createdAt),
  };
}
