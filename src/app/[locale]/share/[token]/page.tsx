// Public read-only deck view — accessible without authentication
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShareDeckView } from "@/components/deck/ShareDeckView";
import type { ApiSharedDeck } from "@/lib/deck/share-types";
import { normalizeScryfallImageUrl } from "@/lib/scryfall/images";
import {
  SHARE_LINK_REVALIDATE_SECONDS,
  shareLinkCacheTag,
} from "@/lib/deck/share-link-cache";
import { metadataTranslations } from "@/lib/seo/page-metadata";

interface Params {
  readonly params: Promise<{ locale: string; token: string }>;
}

// ─── Server-side data fetching ────────────────────────────────────────────────

async function fetchSharedDeck(token: string): Promise<ApiSharedDeck | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    // Cached per token for a minute, and tagged so that revoking the link
    // purges the entry at once (OD-12). The tag is the one DELETE
    // /api/decks/[id]/share passes to `revalidateTag`.
    const res = await fetch(`${baseUrl}/api/share/${token}`, {
      next: {
        revalidate: SHARE_LINK_REVALIDATE_SECONDS,
        tags: [shareLinkCacheTag(token)],
      },
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── OG meta tags ─────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token, locale } = await params;
  const [t, deck] = await Promise.all([
    metadataTranslations(locale, "share"),
    fetchSharedDeck(token),
  ]);

  if (!deck) {
    return { title: t("notFound") };
  }

  const commander = deck.cards.find((c) => c.isCommander && !c.isPartner);
  const partner = deck.cards.find((c) => c.isPartner);
  const cardCount = deck.cards.length;

  let commanderLabel: string;
  if (!commander) {
    commanderLabel = t("noCommander");
  } else if (partner) {
    commanderLabel = `${commander.name} + ${partner.name}`;
  } else {
    commanderLabel = commander.name;
  }

  const description = t("description", {
    commander: commanderLabel,
    cardCount,
    bracket: deck.targetBracket,
    format: deck.format,
  });

  return {
    title: t("title", { name: deck.name }),
    description,
    robots: {
      index: false,
      follow: false,
      noarchive: true,
    },
    openGraph: {
      title: deck.name,
      description,
      type: "website",
      images: commander?.artCropUri
        ? [
            {
              url: normalizeScryfallImageUrl(commander.artCropUri),
              alt: commander.name,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: deck.name,
      description,
      images: commander?.artCropUri
        ? [normalizeScryfallImageUrl(commander.artCropUri)]
        : [],
    },
  };
}

// ─── Page component ───────────────────────────────────────────────────────────

export default async function SharePage({ params }: Params) {
  const { token } = await params;
  const deck = await fetchSharedDeck(token);

  if (!deck) {
    notFound();
  }

  return <ShareDeckView deck={deck} />;
}
