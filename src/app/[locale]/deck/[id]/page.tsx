import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo/alternates";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PublicDeckView } from "@/components/profile/PublicDeckView";
import { fetchPublicDeck } from "@/lib/deck/public-deck";
import { auth } from "@/lib/auth/config";

interface Params {
  readonly params: Promise<{ locale: string; id: string }>;
}

async function fetchDeckForViewer(id: string) {
  const cookieHeader = (await headers()).get("cookie");
  return fetchPublicDeck(id, cookieHeader);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id, locale } = await params;
  const deck = await fetchDeckForViewer(id);

  if (!deck) return { title: "Deck not found — MagicAIBuilder" };

  const commander = deck.cards?.find(
    (c: { isCommander: boolean; isPartner: boolean }) => c.isCommander && !c.isPartner
  );
  const author = deck.user?.name ?? deck.user?.username ?? "Unknown";

  return {
    alternates: alternatesFor(locale, `/deck/${id}`),
    title: `${deck.name} by ${author} — MagicAIBuilder`,
    description: `Commander: ${commander?.name ?? "Unknown"} · Bracket ${deck.targetBracket} · ${deck.format}`,
    openGraph: {
      title: `${deck.name} by ${author}`,
      description: `Commander: ${commander?.name ?? "Unknown"} · Bracket ${deck.targetBracket}`,
      images: commander?.artCropUri ? [{ url: commander.artCropUri }] : [],
    },
  };
}

export default async function PublicDeckPage({ params }: Params) {
  const { id } = await params;
  const [deck, session] = await Promise.all([fetchDeckForViewer(id), auth()]);

  if (!deck) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <PublicDeckView deck={deck} isSignedIn={session?.user != null} />
    </div>
  );
}
