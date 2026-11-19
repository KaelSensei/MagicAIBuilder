/**
 * Lists the public decks led by one commander, ranked by community votes:
 * the read behind `GET /api/community/commanders/[slug]/decks` and the
 * commander decks page.
 *
 * Community context, application layer (master plan COM-10). The use case
 * reads the decks through the `CommanderDeckReader` port
 * (`commander-discovery-port.ts`) and hands them to the pure rules of
 * `commander-discovery.ts`, so it runs in Vitest on the in-memory reader with
 * no database (ADR 0005). `commander-decks-lookup.ts` wires the Prisma
 * adapter and owns the caching policy; the route and the page call the
 * lookup.
 *
 * @module community/commander-discovery-use-case
 */
import type { CommanderDeckReader } from "@/lib/community/commander-discovery-port";
import { buildCommanderDeckListing } from "@/lib/community/commander-discovery";
import type { CommanderDecksResponse } from "@/lib/community/discovery-types";

/** The adapters the use case runs on; `commander-decks-lookup.ts` passes the real one. */
export interface CommanderDiscoveryPorts {
  readonly decks: CommanderDeckReader;
}

/** Who asks for which commander's listing. */
export interface ListCommanderDecksQuery {
  /**
   * The commander slug from the URL. A slug no commander name can produce
   * matches nothing and answers an empty listing.
   */
  readonly slug: string;
  /** The signed-in viewer, or null when signed out. */
  readonly viewerId: string | null;
}

/**
 * Lists the public decks led by the commander behind `query.slug`, as
 * `query.viewerId` sees them.
 *
 * @returns the ranked listing, capped at 50 decks, empty when no public deck
 *   leads with the commander; `viewerVote` is the one viewer-relative field
 * @throws whatever the reader throws when its store is unavailable
 */
export async function listCommanderDecks(
  ports: CommanderDiscoveryPorts,
  query: ListCommanderDecksQuery
): Promise<CommanderDecksResponse> {
  const decks = await ports.decks.listPublicDecksByCommanderSlug(query.slug);
  return buildCommanderDeckListing(query.slug, decks, query.viewerId);
}
