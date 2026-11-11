/**
 * Flattening a validated value to the plain JSON a Prisma `Json` column stores.
 *
 * Shared kernel beside the Prisma client. Callers: the shared Scryfall cache
 * (`lib/scryfall/shared-cache.ts`), deck snapshots (`snapshotContent` in
 * `lib/deck/deck-version.ts`) and the meta cache
 * (`app/api/meta/[commanderSlug]/route.ts`).
 *
 * **Not `structuredClone`.** SonarCloud's S7784 suggests it for the
 * `JSON.parse(JSON.stringify(…))` shape, and here that would be a regression.
 * `structuredClone` keeps a `Date` as a `Date` and throws on a function; this
 * helper must flatten dates to ISO strings and drop non-serialisable members,
 * because plain JSON is the only thing `Prisma.InputJsonValue` accepts.
 *
 * @module db/json-payload
 */

import type { Prisma } from "@prisma/client";

/**
 * A plain-JSON copy of a value, ready for a Prisma `Json` column.
 *
 * Dates become ISO strings; `undefined` members, functions and symbols inside
 * an object are dropped. The copy shares nothing with the input, so a later
 * mutation of the input cannot reach the stored value.
 *
 * @param value - anything already validated by the caller
 * @throws TypeError when the value itself has no JSON representation
 *   (`undefined`, a function or a symbol)
 */
export function toJsonPayload(value: unknown): Prisma.InputJsonValue {
  const encoded = JSON.stringify(value);

  // `JSON.stringify` returns `undefined` — not the string "undefined" — for
  // `undefined`, a function or a symbol. Feeding that straight back to
  // `JSON.parse` throws `SyntaxError: "undefined" is not valid JSON`, which
  // names the parser rather than the caller's mistake.
  if (encoded === undefined) {
    throw new TypeError("Value has no JSON representation and cannot be stored");
  }

  // `JSON.parse` is typed `any`, which satisfies `InputJsonValue` without an
  // assertion — the reason the round trip is written this way rather than cast.
  return JSON.parse(encoded);
}
