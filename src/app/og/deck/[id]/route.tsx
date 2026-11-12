import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import {
  DeckSocialImage,
  SiteSocialImage,
} from "@/components/og/DeckSocialImage";
import { routing } from "@/i18n/routing";
import { loadPublicDeckImage } from "@/lib/deck/social-image";
import { DECK_IMAGE_SIZE } from "@/lib/seo/deck-image";

/** Prisma needs Node.js; the free-text `/api/og` this replaces ran on the edge. */
export const runtime = "nodejs";

/**
 * One minute, so a deck turned private stops showing within a minute (I-36
 * requirement 1.3). `ImageResponse` otherwise sends `immutable` with a one-year
 * max-age in production. The deck page's `?v=` key, not a long max-age, is what
 * lets a chat app keep an unchanged image.
 */
const CACHE_CONTROL = "public, max-age=60, s-maxage=60";

interface Params {
  readonly params: Promise<{ readonly id: string }>;
}

/**
 * GET /og/deck/{id} — a 1200×630 PNG of a public deck, for link previews.
 *
 * It is a route handler rather than an `opengraph-image.tsx` beside the deck
 * page: that convention would serve the image under every locale prefix and
 * through the auth and locale middleware, while crawlers need one signed-out URL
 * outside `/api/`, which robots.txt disallows.
 *
 * Everything printed comes from the database; the query string is ignored. A
 * private, missing or malformed deck gets the generic site image, the same
 * bytes for each, so the image never tells a private deck from a missing one.
 * Text is in the default locale, since nothing in the URL may change the image.
 *
 * @param _request - unused; no query parameter changes the image
 * @param context - route params holding the deck id
 * @returns the PNG
 */
export async function GET(
  _request: Request,
  { params }: Params
): Promise<Response> {
  const { id } = await params;
  const [deck, t] = await Promise.all([
    loadPublicDeckImage(id),
    getTranslations({
      locale: routing.defaultLocale,
      namespace: "deck.socialImage",
    }),
  ]);

  const image =
    deck === null ? (
      <SiteSocialImage tagline={t("tagline")} />
    ) : (
      <DeckSocialImage
        deck={deck}
        labels={{
          byAuthor:
            deck.author === null
              ? null
              : t("byAuthor", { author: deck.author }),
          cardCount: t("cardCount", { count: deck.cardCount }),
        }}
      />
    );

  return new ImageResponse(image, {
    ...DECK_IMAGE_SIZE,
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
