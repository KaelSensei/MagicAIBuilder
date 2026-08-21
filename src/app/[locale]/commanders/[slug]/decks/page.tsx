import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo/alternates";
import { headers } from "next/headers";
import { Header } from "@/components/layout/Header";
import { CommanderDecksView } from "@/components/community/CommanderDecksView";
import {
  buildViewerScopedRequestInit,
  resolveAppBaseUrl,
} from "@/lib/api/viewer-request";
import { auth } from "@/lib/auth/config";
import type { CommanderDecksResponse } from "@/lib/community/discovery-types";

interface Params {
  readonly params: Promise<{ locale: string; slug: string }>;
}

/**
 * Vote state in the response is viewer-relative, so an authenticated request
 * must forward its cookie and bypass the cache — otherwise one viewer's votes
 * would be served to everyone.
 */
async function fetchCommanderDecks(
  slug: string
): Promise<CommanderDecksResponse | null> {
  try {
    const cookieHeader = (await headers()).get("cookie");
    const res = await fetch(
      `${resolveAppBaseUrl()}/api/community/commanders/${slug}/decks`,
      buildViewerScopedRequestInit(cookieHeader)
    );
    if (!res.ok) return null;
    return (await res.json()) as CommanderDecksResponse;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, locale } = await params;
  const data = await fetchCommanderDecks(slug);
  const name = data?.commanderName ?? slug.replaceAll("-", " ");

  return {
    alternates: alternatesFor(locale, `/commanders/${slug}/decks`),
    title: `${name} decks — MagicAIBuilder`,
    description: `Public Commander decks led by ${name}, ranked by community votes.`,
  };
}

export default async function CommanderDecksPage({ params }: Params) {
  const { slug } = await params;
  const [data, session] = await Promise.all([fetchCommanderDecks(slug), auth()]);

  // An unknown slug is not an error: it is a commander nobody has published a
  // deck for yet, so the page renders its empty state rather than a 404.
  const decks = data?.decks ?? [];
  const commanderName = data?.commanderName ?? slug.replaceAll("-", " ");

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <CommanderDecksView
        commanderName={commanderName}
        decks={decks}
        canVote={session?.user?.id != null}
      />
    </div>
  );
}
