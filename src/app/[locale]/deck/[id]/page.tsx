import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo/alternates";
import { metadataTranslations } from "@/lib/seo/page-metadata";
import {
  deckImagePath,
  deckImageVersion,
  DECK_IMAGE_SIZE,
} from "@/lib/seo/deck-image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { PublicDeckView } from "@/components/profile/PublicDeckView";
import { findDeckForViewer } from "@/lib/deck/deck-for-viewer";
import { auth } from "@/lib/auth/config";

interface Params {
  readonly params: Promise<{ locale: string; id: string }>;
}

/**
 * The deck as this request's viewer may see it, read once per request:
 * `generateMetadata` and the page share the result.
 */
const fetchDeckForViewer = cache(async (id: string) => {
  const session = await auth();
  return findDeckForViewer(id, session?.user?.id ?? null);
});

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
  const socialTitle = t("socialTitle", byline);
  const socialDescription = t("socialDescription", summary);
  const imageText = await getTranslations({
    locale,
    namespace: "deck.socialImage",
  });
  // Built from stored data by /og/deck/[id]. Not the commander's art crop:
  // Scryfall's crop cuts the artist credit, and art alone says nothing of the deck.
  const image = {
    url: deckImagePath(id, deckImageVersion(deck)),
    ...DECK_IMAGE_SIZE,
    alt: imageText("imageAlt", { deck: deck.name, author: byline.author }),
  };

  return {
    alternates: alternatesFor(locale, `/deck/${id}`),
    title: t("title", byline),
    description: t("description", { ...summary, format: deck.format }),
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: [image],
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
