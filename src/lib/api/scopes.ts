/**
 * What an API key is allowed to do.
 *
 * Split out of `keys.ts` because that module imports `node:crypto`, and the
 * settings screen — a client component — needs the scope list to render its
 * checkboxes. Importing `keys.ts` there would pull the minting and hashing code
 * into the browser bundle: a build error at best, and at worst a bundler that
 * shims `node:crypto` and quietly ships the key-generation logic to every
 * visitor. The constants have no dependencies; the secret-handling code does.
 *
 * Scopes exist from the first key even though every endpoint today is
 * read-only. Shipping keys without them would mean that the day a write
 * endpoint lands, every key already in the wild silently gains write access — a
 * privilege escalation delivered by a deploy, with nothing in the request to
 * show it happened.
 */

export const API_SCOPES = ["decks:read", "collection:read"] as const;

export type ApiScope = (typeof API_SCOPES)[number];

/** Scopes granted to a key whose creator asked for nothing in particular. */
export const DEFAULT_API_SCOPES: readonly ApiScope[] = ["decks:read"];

/** Whether `granted` covers `required`. */
export function hasScope(granted: readonly string[], required: ApiScope): boolean {
  return granted.includes(required);
}

/** Narrow arbitrary stored strings back to known scopes, dropping any the code no longer defines. */
export function parseScopes(stored: readonly string[]): readonly ApiScope[] {
  const known = new Set<string>(API_SCOPES);
  return stored.filter((scope): scope is ApiScope => known.has(scope));
}
