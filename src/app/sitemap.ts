import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { commanderToSlug } from "@/lib/meta/fetch";
import {
  buildSitemap,
  collapseToCommanders,
  type PublicDeck,
  type PublicProfile,
} from "@/lib/seo/sitemap";

/**
 * Every URL this site wants indexed.
 *
 * Reads only records their owners marked public. `/share/<token>` URLs are
 * deliberately absent — see the note in `@/lib/seo/sitemap`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [decks, profiles, commanderDecks] = await Promise.all([
    readPublicDecks(),
    readPublicProfiles(),
    readCommanderDecks(),
  ]);

  return buildSitemap({
    decks,
    profiles,
    commanders: collapseToCommanders(commanderDecks),
    now,
  });
}

/**
 * Reports a failed read instead of swallowing it.
 *
 * The database is genuinely absent during some builds, so this must not throw
 * — but the previous `catch {}` produced a one-URL sitemap indistinguishable
 * from a site that has one page, and said so nowhere. `logger.error` forwards
 * to Sentry, so a production build that silently stops indexing the catalogue
 * is now visible.
 *
 * @param what Names the read, for the log line.
 * @param read The query to run.
 */
async function readOrReport<T>(
  what: string,
  read: () => Promise<readonly T[]>
): Promise<readonly T[]> {
  try {
    return await read();
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      "sitemap",
      { read: what }
    );
    return [];
  }
}

/** Decks whose owner set `isPublic`. Never decks that are merely shared by link. */
async function readPublicDecks(): Promise<readonly PublicDeck[]> {
  return readOrReport("publicDecks", () =>
    prisma.deck.findMany({
      where: { isPublic: true },
      select: { id: true, updatedAt: true },
    })
  );
}

/** Users who have claimed a profile slug; `/u/<username>` is public. */
async function readPublicProfiles(): Promise<readonly PublicProfile[]> {
  return readOrReport("publicProfiles", async () => {
    const users = await prisma.user.findMany({
      where: { username: { not: null } },
      select: { username: true, updatedAt: true },
    });

    // `username` is nullable in the schema; the filter above narrows the rows
    // but not the type.
    return users.flatMap((user) =>
      user.username === null
        ? []
        : [{ username: user.username, updatedAt: user.updatedAt }]
    );
  });
}

/**
 * Public decks that name a commander, as slugs.
 *
 * The slug is derived rather than stored — `commanderToSlug` is shared with the
 * discovery route and the EDHRec URL builder, so a stored copy could desync.
 */
async function readCommanderDecks(): Promise<
  readonly { readonly slug: string; readonly updatedAt: Date }[]
> {
  return readOrReport("commanderDecks", async () => {
    const decks = await prisma.deck.findMany({
      where: { isPublic: true, commanderName: { not: null } },
      select: { commanderName: true, updatedAt: true },
    });

    return decks.flatMap((deck) =>
      deck.commanderName === null
        ? []
        : [
            {
              slug: commanderToSlug(deck.commanderName),
              updatedAt: deck.updatedAt,
            },
          ]
    );
  });
}
