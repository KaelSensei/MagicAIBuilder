import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Header } from "@/components/layout/Header";
import { CommanderDecksView } from "@/components/community/CommanderDecksView";
import { auth } from "@/lib/auth/config";
import { findCommanderDecksForViewer } from "@/lib/community/commander-decks-lookup";
import type { CommanderDecksResponse } from "@/lib/community/discovery-types";
import { logger } from "@/lib/logger";
import { isCommanderSlug } from "@/lib/meta/fetch";
import { alternatesFor } from "@/lib/seo/alternates";
import { metadataTranslations } from "@/lib/seo/page-metadata";

interface Params {
  readonly params: Promise<{ locale: string; slug: string }>;
}

/** Thrown when the listing cannot be read; the route error boundary offers a retry. */
const COMMANDER_DECKS_UNAVAILABLE = "COMMANDER_DECKS_UNAVAILABLE";

/** The listing as this request's viewer may see it, and who that viewer is. */
interface CommanderDecksForViewer {
  readonly listing: CommanderDecksResponse;
  readonly viewerId: string | null;
}

/**
 * The listing as this request's viewer may see it, read in-process once per
 * request: `generateMetadata` and the page share the result. A signed-out
 * visitor is served from the data cache; a signed-in viewer reads fresh, so
 * their `viewerVote` is never served to anyone else.
 *
 * A database failure is logged and thrown as
 * {@link COMMANDER_DECKS_UNAVAILABLE} rather than read as "no decks". "No
 * decks" is rendered as a noindex empty listing, and a commander whose decks
 * merely failed to load would otherwise drop out of the index as an empty one.
 */
const fetchCommanderDecksForViewer = cache(
  async (slug: string): Promise<CommanderDecksForViewer> => {
    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    try {
      const listing = await findCommanderDecksForViewer(slug, viewerId);
      return { listing, viewerId };
    } catch (error) {
      logger.error(
        error instanceof Error ? error : String(error),
        "/commanders/[slug]/decks",
        { slug }
      );
      throw new Error(COMMANDER_DECKS_UNAVAILABLE);
    }
  }
);

/**
 * The commander's name as its decks spell it, or, for a commander nobody has
 * published a deck for yet, as read back from the slug.
 *
 * @param listing The discovery read's answer.
 * @param slug The route's commander slug.
 * @returns A display name for the page heading and title.
 */
function commanderNameFor(
  listing: CommanderDecksResponse,
  slug: string
): string {
  return listing.commanderName ?? slug.replaceAll("-", " ");
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await metadataTranslations(locale, "commanderDecks");
  if (!isCommanderSlug(slug)) {
    return { title: t("notFound") };
  }

  let listing: CommanderDecksResponse;
  try {
    ({ listing } = await fetchCommanderDecksForViewer(slug));
  } catch {
    return { title: t("unavailable") };
  }

  const commander = commanderNameFor(listing, slug);
  const page = {
    title: t("title", { commander }),
    description: t("description", { commander }),
  };

  // An empty listing stays reachable — the builder links to it for any
  // commander being built — but it has nothing to index, and indexing it
  // would make every typo'd slug a page. No canonical, and noindex.
  if (listing.decks.length === 0) return { ...page, robots: { index: false } };

  return {
    ...page,
    alternates: alternatesFor(locale, `/commanders/${slug}/decks`),
  };
}

export default async function CommanderDecksPage({ params }: Params) {
  const { slug } = await params;
  // No commander name slugs to this, so there is no listing to show, even an
  // empty one. A real commander with no public deck yet renders below.
  if (!isCommanderSlug(slug)) notFound();

  const { listing, viewerId } = await fetchCommanderDecksForViewer(slug);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <CommanderDecksView
        commanderName={commanderNameFor(listing, slug)}
        decks={listing.decks}
        canVote={viewerId !== null}
      />
    </div>
  );
}
