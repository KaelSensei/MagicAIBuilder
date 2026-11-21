/**
 * The PostgreSQL adapter of the public fork store port, and the read the
 * public deck page calls.
 *
 * Community context (infrastructure). A fork is listed through
 * {@link PUBLIC_FORK_SELECT}, cut from the public deck allowlist, so it can
 * expose nothing a visitor of the fork's own page could not read. `Deck` has
 * no index on `forkedFromDeckId`; the filter on it with `isPublic`, the
 * `take` and the one count are cheap while decks are few. An index may follow
 * if the query shows up in the slow-query logs.
 *
 * @module deck/public-fork-store
 */
import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  readInspiredForks,
  type InspiredForks,
  type PublicForkStore,
} from "@/lib/deck/inspired-forks";
import {
  PUBLIC_DECK_AUTHOR_SELECT,
  PUBLIC_DECK_SELECT,
} from "@/lib/deck/public-deck-select";

/**
 * A listed fork's columns: its id, its name and its author's public name and
 * username, each taken from {@link PUBLIC_DECK_SELECT}. No owner id, budget
 * or note.
 */
const PUBLIC_FORK_SELECT = {
  id: PUBLIC_DECK_SELECT.id,
  name: PUBLIC_DECK_SELECT.name,
  user: {
    select: {
      name: PUBLIC_DECK_AUTHOR_SELECT.name,
      username: PUBLIC_DECK_AUTHOR_SELECT.username,
    },
  },
} as const satisfies Prisma.DeckSelect;

/** The public, direct forks of one deck. */
function publicForksWhere(sourceDeckId: string) {
  return {
    forkedFromDeckId: sourceDeckId,
    isPublic: true,
  } as const satisfies Prisma.DeckWhereInput;
}

/**
 * Builds the store on a Prisma client.
 *
 * @param client - the client to read through: the app's, or a test database's
 * @returns a store that lists and counts in two queries run side by side
 */
export function prismaPublicForkStore(client: PrismaClient): PublicForkStore {
  return {
    publicForksOf: async (sourceDeckId, limit) => {
      const where = publicForksWhere(sourceDeckId);
      const [rows, total] = await Promise.all([
        client.deck.findMany({
          where,
          select: PUBLIC_FORK_SELECT,
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
          take: limit,
        }),
        client.deck.count({ where }),
      ]);
      const forks = rows.map(({ id, name, user }) => ({
        id,
        name,
        author: user?.name ?? user?.username ?? null,
      }));
      return { forks, total };
    },
  };
}

/**
 * The public forks the deck page lists for `deckId`, read from the app's
 * database. Never rejects: a failed read yields no forks (see
 * {@link readInspiredForks}).
 *
 * @param deckId - the deck the page shows
 * @returns its most recent public forks and their true count
 */
export function findInspiredForks(deckId: string): Promise<InspiredForks> {
  return readInspiredForks(prismaPublicForkStore(prisma), deckId);
}
