import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo/alternates";
import { metadataTranslations } from "@/lib/seo/page-metadata";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PublicDeckView } from "@/components/profile/PublicDeckView";
import { fetchPublicDeck } from "@/lib/deck/public-deck";
import { auth } from "@/lib/auth/config";
import { normalizeScryfallImageUrl } from "@/lib/scryfall/images";

interface Params {
  readonly params: Promise<{ locale: string; id: string }>;
}

async function fetchDeckForViewer(id: string) {
  const cookieHeader = (await headers()).get("cookie");
  return fetchPublicDeck(id, cookieHeader);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await metadataTranslations(locale, "deck");
  let deck;
  try {
    deck = await fetchDeckForViewer(id);
  } catch {
    return { title: t("unavailable") };
  }

  if (!deck) return { title: t("notFound") };

  const commander = deck.cards?.find(
    (c: { isCommander: boolean; isPartner: boolean }) =>
      c.isCommander && !c.isPartner
  );
  const byline = {
    name: deck.name,
    author: deck.user?.name ?? deck.user?.username ?? t("unknownAuthor"),
  };
  const summary = {
    commander: commander?.name ?? t("unknownCommander"),
    bracket: deck.targetBracket,
  };

  return {
    alternates: alternatesFor(locale, `/deck/${id}`),
    title: t("title", byline),
    description: t("description", { ...summary, format: deck.format }),
    openGraph: {
      title: t("socialTitle", byline),
      description: t("socialDescription", summary),
      images: commander?.artCropUri
        ? [{ url: normalizeScryfallImageUrl(commander.artCropUri) }]
        : [],
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
