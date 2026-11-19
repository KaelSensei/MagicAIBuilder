/**
 * Reads the public decks led by one commander, ranked by community votes:
 * `listCommanderDecks` wired to PostgreSQL, plus the caching policy.
 *
 * Community context, composition root of commander discovery until COM-18
 * moves the context to `src/modules/community/` (ADR 0002). The use case
 * (`commander-discovery-use-case.ts`) runs on `prismaCommanderDeckReader`
 * (`prisma-commander-deck-reader.ts`), which matches the slug in SQL against
 * the denormalised `Deck.commanderName`; the pure rules in
 * `commander-discovery.ts` summarise, rank and cap the decks. `viewerVote` is
 * the one viewer-relative field, so a signed-in viewer's read is never
 * cached, while a signed-out visitor's read may be served from Next's data
 * cache for {@link ANONYMOUS_READ_REVALIDATE_SECONDS}.
 *
 * Shared by `GET /api/community/commanders/[slug]/decks` and the commander
 * decks page (`/commanders/[slug]/decks`), so the page reads the database
 * in-process instead of calling the app's own API over HTTP: no base URL to
 * guess, no self-call that a deployment-protected preview would refuse.
 *
 * @module community/commander-decks-lookup
 */
import "server-only";
import { unstable_cache } from "next/cache";
import { ANONYMOUS_READ_REVALIDATE_SECONDS } from "@/lib/community/anonymous-read-cache";
import {
  listCommanderDecks,
  type CommanderDiscoveryPorts,
} from "@/lib/community/commander-discovery-use-case";
import type { CommanderDecksResponse } from "@/lib/community/discovery-types";
import { prismaCommanderDeckReader } from "@/lib/community/prisma-commander-deck-reader";
import { prisma } from "@/lib/db/prisma";

/** The discovery use case's ports over the shared client; one instance per server process. */
const commanderDiscoveryPorts: CommanderDiscoveryPorts = {
  decks: prismaCommanderDeckReader(prisma),
};

function readCommanderDecks(
  slug: string,
  viewerId: string | null
): Promise<CommanderDecksResponse> {
  return listCommanderDecks(commanderDiscoveryPorts, { slug, viewerId });
}

/** A signed-out visitor's read, served from Next's data cache for a minute. */
function readAnonymousCommanderDecksCached(
  slug: string
): Promise<CommanderDecksResponse> {
  return unstable_cache(
    (commanderSlug: string) => readCommanderDecks(commanderSlug, null),
    ["commander-decks"],
    { revalidate: ANONYMOUS_READ_REVALIDATE_SECONDS }
  )(slug);
}

/**
 * Finds the public decks led by the commander behind `slug`, as `viewerId`
 * may see them, reading the database on every call.
 *
 * For `GET /api/community/commanders/[slug]/decks`.
 *
 * @param slug - the commander slug from the URL; a slug no commander name can
 *   produce matches nothing and answers an empty listing
 * @param viewerId - the signed-in user's id, or null for a signed-out viewer
 * @returns the ranked listing, empty when no public deck leads with the commander
 * @throws whatever Prisma throws when the database is unavailable
 */
export function findCommanderDecks(
  slug: string,
  viewerId: string | null
): Promise<CommanderDecksResponse> {
  return readCommanderDecks(slug, viewerId);
}

/**
 * Finds the listing behind `slug` for a page render: a signed-out visitor's
 * read comes from Next's data cache for
 * {@link ANONYMOUS_READ_REVALIDATE_SECONDS}, so a popular commander costs one
 * database read a minute; a signed-in viewer's read is fresh, so their
 * `viewerVote` never reaches another viewer.
 *
 * For the commander decks page (`/commanders/[slug]/decks`).
 *
 * @param slug - the commander slug from the URL; callers reject slugs that
 *   fail `isCommanderSlug` before calling, which keeps junk out of the cache
 * @param viewerId - the signed-in user's id, or null for a signed-out viewer
 * @returns the ranked listing, empty when no public deck leads with the commander
 * @throws whatever Prisma throws when the database is unavailable
 */
export function findCommanderDecksForViewer(
  slug: string,
  viewerId: string | null
): Promise<CommanderDecksResponse> {
  return viewerId === null
    ? readAnonymousCommanderDecksCached(slug)
    : readCommanderDecks(slug, viewerId);
}
