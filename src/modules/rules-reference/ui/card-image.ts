/**
 * The image the Game Changers and banlist page shows for a card, chosen from
 * the versions Scryfall lists and nothing else.
 *
 * Rules reference context, a pure helper beside the `ui/` components. It differs
 * from the catalog's `getCardImageUri` (`lib/scryfall/images.ts`) on a card
 * with no listed image: the catalog builds a URL from the printing id, this page
 * shows its "no image" placeholder instead. Both helpers belong to the card
 * catalog context; this one moves there once the series that edits `images.ts`
 * has merged (RR-04 follow-up).
 *
 * @module rules-reference/ui/card-image
 */
import { getListedImageUri, type ImageSize } from "@/lib/scryfall/images";
import type { ScryfallCard } from "@/lib/scryfall/types";

/**
 * The URL Scryfall lists for one image version of a card: the card's own, else
 * its front face's (a double-faced card keeps its images on its faces).
 *
 * @param card - Scryfall card
 * @param size - WebP version
 * @returns the URL, or `null` when neither the card nor its front face lists one
 */
export function getListedCardImageUri(
  card: ScryfallCard,
  size: ImageSize
): string | null {
  return (
    getListedImageUri(card.image_uris, size) ??
    getListedImageUri(card.card_faces?.[0]?.image_uris, size) ??
    null
  );
}

/**
 * The image a grid tile shows: the `grid` version, else the smaller `thumb`
 * one when that is all Scryfall lists.
 *
 * @param card - Scryfall card
 * @returns the URL, or `null` when the card lists no image at all
 */
export function getCardGridImageUri(card: ScryfallCard): string | null {
  return (
    getListedCardImageUri(card, "grid") ?? getListedCardImageUri(card, "thumb")
  );
}
