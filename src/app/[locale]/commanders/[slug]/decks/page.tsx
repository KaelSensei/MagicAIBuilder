import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo/alternates";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { CommanderDecksView } from "@/components/community/CommanderDecksView";
import {
  buildViewerScopedRequestInit,
  resolveAppBaseUrl,
} from "@/lib/api/viewer-request";
import { auth } from "@/lib/auth/config";
import type { CommanderDecksResponse } from "@/lib/community/discovery-types";
import { isCommanderSlug } from "@/lib/meta/fetch";

interface Params {
  readonly params: Promise<{ locale: string; slug: string }>;
}

/** Thrown when the discovery API cannot answer; the route error boundary offers a retry. */
const COMMANDER_DECKS_UNAVAILABLE = "COMMANDER_DECKS_UNAVAILABLE";

/**
 * Vote state in the response is viewer-relative, so an authenticated request
 * must forward its cookie and bypass the cache — otherwise one viewer's votes
 * would be served to everyone.
 *
 * A failed request throws rather than reading as "no decks". "No decks" is
 * rendered as a noindex empty listing, and a commander whose decks merely
 * failed to load would otherwise drop out of the index as an empty one.
 */
async function fetchCommanderDecks(
  slug: string
): Promise<CommanderDecksResponse> {
  const cookieHeader = (await headers()).get("cookie");
  const res = await fetch(
    `${resolveAppBaseUrl()}/api/community/commanders/${encodeURIComponent(slug)}/decks`,
    buildViewerScopedRequestInit(cookieHeader)
  ).catch(() => null);

  if (!res?.ok) throw new Error(COMMANDER_DECKS_UNAVAILABLE);
  return (await res.json()) as CommanderDecksResponse;
}

/**
 * The commander's name as its decks spell it, or, for a commander nobody has
 * published a deck for yet, as read back from the slug.
 *
 * @param data The discovery API's answer.
 * @param slug The route's commander slug.
 * @returns A display name for the page heading and title.
 */
function commanderNameFor(data: CommanderDecksResponse, slug: string): string {
  return data.commanderName ?? slug.replaceAll("-", " ");
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, locale } = await params;
  if (!isCommanderSlug(slug)) {
    return { title: "Commander not found — MagicAIBuilder" };
  }

  let data: CommanderDecksResponse;
  try {
    data = await fetchCommanderDecks(slug);
  } catch {
    return { title: "Commander decks unavailable — MagicAIBuilder" };
  }

  const name = commanderNameFor(data, slug);
  const listing = {
    title: `${name} decks — MagicAIBuilder`,
    description: `Public Commander decks led by ${name}, ranked by community votes.`,
  };

  // An empty listing stays reachable — the builder links to it for any
  // commander being built — but it has nothing to index, and indexing it
  // would make every typo'd slug a page. No canonical, and noindex.
  if (data.decks.length === 0) return { ...listing, robots: { index: false } };

  return {
    ...listing,
    alternates: alternatesFor(locale, `/commanders/${slug}/decks`),
  };
}

export default async function CommanderDecksPage({ params }: Params) {
  const { slug } = await params;
  // No commander name slugs to this, so there is no listing to show, even an
  // empty one. A real commander with no public deck yet renders below.
  if (!isCommanderSlug(slug)) notFound();

  const [data, session] = await Promise.all([fetchCommanderDecks(slug), auth()]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <CommanderDecksView
        commanderName={commanderNameFor(data, slug)}
        decks={data.decks}
        canVote={session?.user?.id != null}
      />
    </div>
  );
}
