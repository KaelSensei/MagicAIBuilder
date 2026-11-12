// Public read-only deck view — accessible without authentication
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ShareDeckView } from "@/components/deck/ShareDeckView";
import type { ApiSharedDeck } from "@/lib/deck/share-types";
import { findSharedDeckCached } from "@/lib/deck/shared-deck-lookup";
import { normalizeScryfallImageUrl } from "@/lib/scryfall/images";
import { logger } from "@/lib/logger";
import { metadataTranslations } from "@/lib/seo/page-metadata";

interface Params {
  readonly params: Promise<{ locale: string; token: string }>;
}

// ─── Server-side data fetching ────────────────────────────────────────────────

/**
 * The deck behind `token`, read in-process from Next's data cache under the
 * token's tag, so revoking the link purges it at once (OD-12). Read once per
 * request: `generateMetadata` and the page share the result.
 *
 * A database failure is logged and reads as a missing deck, as the HTTP read
 * did before; the link holder sees the not-found page, not a 500.
 */
const fetchSharedDeck = cache(
  async (token: string): Promise<ApiSharedDeck | null> => {
    try {
      const lookup = await findSharedDeckCached(token);
      return lookup.status === "found" ? lookup.deck : null;
    } catch (error) {
      // No token in the log: it is a bearer capability.
      logger.error(
        error instanceof Error ? error.message : "unknown",
        "/share/[token]"
      );
      return null;
    }
  }
);

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
