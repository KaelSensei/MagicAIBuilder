/**
 * Reducing an arbitrary validated value to something Prisma will store as JSON.
 *
 * The same eight lines lived in three route files — both cache routes and the
 * meta route — each with its own copy of the comment explaining the idiom. One
 * home instead, so the reasoning is stated once and a fix reaches every caller.
 *
 * **Not `structuredClone`.** SonarCloud's S7784 suggests it for the
 * `JSON.parse(JSON.stringify(…))` shape, and here that would be a regression,
 * not a cleanup. The two are different operations: `structuredClone` preserves
 * a `Date` as a `Date` and throws outright on a function, while the point of
 * this helper is to *flatten* a value to plain JSON — dates to ISO strings,
 * non-serialisable members dropped — which is the only thing
 * `Prisma.InputJsonValue` accepts. The rule is right about the idiom in
 * general and wrong about this use of it.
 */

import type { Prisma } from "@prisma/client";

/**
 * @param value - anything already validated by the caller
 * @returns the value as plain JSON, ready for a Prisma `Json` column
 * @throws TypeError when the value has no JSON representation at all
 */
export function toJsonPayload(value: unknown): Prisma.InputJsonValue {
  const encoded = JSON.stringify(value);

  // `JSON.stringify` returns `undefined` — not the string "undefined" — for
  // `undefined`, a function or a symbol. Feeding that straight back to
  // `JSON.parse` throws `SyntaxError: "undefined" is not valid JSON`, which
  // names the parser rather than the caller's mistake. All three copies of this
  // helper had that edge, and all three would have reported it that way.
  if (encoded === undefined) {
    throw new TypeError("Value has no JSON representation and cannot be stored");
  }

  // `JSON.parse` is typed `any`, which satisfies `InputJsonValue` without an
  // assertion — the reason the round trip is written this way rather than cast.
  return JSON.parse(encoded);
}
