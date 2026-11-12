/**
 * Reads the deck behind a share link.
 *
 * A share token is a capability: it opens its deck, public or private, while
 * the owner keeps sharing enabled, and an unknown or revoked token opens
 * nothing. The read goes through {@link SHARED_DECK_SELECT}, so a link holder
 * receives what the share page renders and nothing else.
 *
 * Shared by `GET /api/share/[token]` and the share page (`/share/[token]`), so
 * the page reads the database in-process instead of calling the app's own API
 * over HTTP: no base URL to guess, no self-call that a deployment-protected
 * preview would refuse. The page reads through {@link findSharedDeckCached},
 * which keeps the answer in Next's data cache under the token's tag, so
 * revoking the link still purges it at once (owner decision OD-12).
 *
 * @module deck/shared-deck-lookup
 */
import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import {
  SHARE_LINK_REVALIDATE_SECONDS,
  shareLinkCacheTag,
} from "@/lib/deck/share-link-cache";
import { SHARED_DECK_SELECT } from "@/lib/deck/shared-deck-select";
import type { ApiSharedDeck } from "@/lib/deck/share-types";

/**
 * The outcome of looking a share token up.
 *
 * - `invalid-token`: the token cannot have been minted by
 *   `POST /api/decks/[id]/share`, so the database was not asked;
 * - `not-found`: no deck has sharing enabled under this token, because it is
 *   unknown or was revoked;
 * - `found`: the deck, as the share-link allowlist exposes it.
 */
export type SharedDeckLookup =
  | { readonly status: "invalid-token" }
  | { readonly status: "not-found" }
  | { readonly status: "found"; readonly deck: ApiSharedDeck };

const INVALID_TOKEN: SharedDeckLookup = { status: "invalid-token" };
const NOT_FOUND: SharedDeckLookup = { status: "not-found" };

/**
 * Minted tokens are 12 base64url characters. The limit of 64 leaves room for
 * a longer scheme without a schema change, and it keeps a URL's worth of junk
 * out of the query and the cache.
 */
const SHARE_TOKEN_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

/** The deck behind an enabled link, or null for an unknown or revoked token. */
function readEnabledSharedDeck(token: string): Promise<ApiSharedDeck | null> {
  return prisma.deck.findUnique({
    where: { shareToken: token, shareEnabled: true },
    select: SHARED_DECK_SELECT,
  });
}

/**
 * The same read, served from Next's data cache for
 * {@link SHARE_LINK_REVALIDATE_SECONDS} under the token's tag, which
 * `DELETE /api/decks/[id]/share` purges when the link is revoked.
 */
function readEnabledSharedDeckCached(token: string) {
  return unstable_cache(readEnabledSharedDeck, ["shared-deck"], {
    revalidate: SHARE_LINK_REVALIDATE_SECONDS,
    tags: [shareLinkCacheTag(token)],
  })(token);
}

async function lookUp(
  token: string,
  read: (token: string) => Promise<ApiSharedDeck | null>
): Promise<SharedDeckLookup> {
  if (!SHARE_TOKEN_PATTERN.test(token)) return INVALID_TOKEN;
  const deck = await read(token);
  return deck ? { status: "found", deck } : NOT_FOUND;
}

/**
 * Finds the deck behind `token`, reading the database on every call.
 *
 * For `GET /api/share/[token]`, which maps each status to its own HTTP answer.
 *
 * @param token - the share token from the URL, unchecked
 * @returns the lookup outcome; see {@link SharedDeckLookup}
 * @throws whatever Prisma throws when the database is unavailable
 */
export function findSharedDeck(token: string): Promise<SharedDeckLookup> {
  return lookUp(token, readEnabledSharedDeck);
}

/**
 * Finds the deck behind `token` through Next's data cache, so a popular link
 * costs one database read a minute, not one per visitor.
 *
 * For the share page. A malformed token is answered without touching the
 * database or the cache. The cache entry carries `shareLinkCacheTag(token)`,
 * so revoking the link purges it at once (OD-12).
 *
 * @param token - the share token from the URL, unchecked
 * @returns the lookup outcome; see {@link SharedDeckLookup}
 * @throws whatever Prisma throws when the database is unavailable
 */
export function findSharedDeckCached(token: string): Promise<SharedDeckLookup> {
  return lookUp(token, readEnabledSharedDeckCached);
}
