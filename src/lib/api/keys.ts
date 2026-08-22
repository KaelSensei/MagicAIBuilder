/**
 * API key minting and verification for the public REST API.
 *
 * A key is `mab_` followed by 32 random bytes in base64url. The database stores
 * only the SHA-256 of the whole token, never the token itself: a leaked
 * database dump must not hand over working credentials.
 *
 * **SHA-256 and not bcrypt, deliberately.** Slow hashes exist to make guessing a
 * *low-entropy* secret expensive, and a password is low-entropy. This token is
 * 256 bits of `randomBytes`, so guessing is already infeasible by a margin no
 * work factor improves on — while bcrypt would put a deliberate delay on every
 * single API request. The reasoning inverts the moment a key becomes anything a
 * human chooses, so keys must stay machine-generated.
 *
 * The stored hash is also the lookup index, so verification is one indexed read
 * rather than a scan-and-compare over every key in the table.
 */

import { createHash, randomBytes } from "node:crypto";

// Scopes live in their own module so client components can read the list
// without pulling node:crypto into the browser bundle.
export {
  API_SCOPES,
  DEFAULT_API_SCOPES,
  hasScope,
  parseScopes,
  type ApiScope,
} from "./scopes";

/** Marks a MagicAIBuilder key in logs, secret scanners and support tickets. */
export const API_KEY_PREFIX = "mab_";

/** Bytes of entropy behind the secret. 32 bytes → 43 base64url characters. */
const SECRET_BYTES = 32;

/** Characters of the token kept in clear for display, after the prefix. */
const DISPLAY_CHARS = 8;

export interface MintedApiKey {
  /** The full secret. Returned once, at creation, and never recoverable. */
  readonly token: string;
  /** SHA-256 of `token`, hex — the only form that reaches the database. */
  readonly tokenHash: string;
  /** `mab_` plus the first 8 characters, for identifying a key in a list. */
  readonly displayPrefix: string;
}

/** SHA-256 of a token, hex-encoded. */
export function hashApiKey(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Mint a new key. The caller must show `token` to the user immediately — it cannot be re-derived. */
export function mintApiKey(): MintedApiKey {
  const token = `${API_KEY_PREFIX}${randomBytes(SECRET_BYTES).toString("base64url")}`;
  return {
    token,
    tokenHash: hashApiKey(token),
    displayPrefix: token.slice(0, API_KEY_PREFIX.length + DISPLAY_CHARS),
  };
}

/**
 * Whether a string could be one of our tokens at all.
 *
 * A cheap shape check before the database is touched, so a flood of obvious
 * junk costs no queries. It is not a security boundary — the hash lookup is.
 */
export function isWellFormedApiKey(token: string): boolean {
  if (!token.startsWith(API_KEY_PREFIX)) return false;
  const secret = token.slice(API_KEY_PREFIX.length);
  // 32 bytes in base64url is exactly 43 characters, unpadded.
  return /^[A-Za-z0-9_-]{43}$/.test(secret);
}

/**
 * The token from an `Authorization: Bearer …` header.
 *
 * The scheme is matched case-insensitively because RFC 7235 defines it as
 * case-insensitive, and clients do send `bearer`.
 *
 * A numbered group rather than a named one: the project's TypeScript target is
 * below ES2018, where named capture groups are a syntax error.
 *
 * @returns the token, or `null` when the header is absent or not a Bearer header
 */
export function parseBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer[ ]+(\S+)$/i.exec(header);
  return match?.[1] ?? null;
}
