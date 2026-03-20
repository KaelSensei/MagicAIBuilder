// Scryfall card image URL helpers
import type { ScryfallCard } from "./types";

export type ImageSize =
  | "small"
  | "normal"
  | "large"
  | "png"
  | "art_crop"
  | "border_crop";

/** Get card image URL for a given size, handling double-faced cards */
export function getCardImageUri(
  card: ScryfallCard,
  size: ImageSize = "normal"
): string {
  // Single-faced card
  if (card.image_uris) {
    return card.image_uris[size] ?? card.image_uris.normal ?? "";
  }

  // Double-faced card — use front face
  if (card.card_faces?.[0]?.image_uris) {
    return card.card_faces[0].image_uris[size] ?? card.card_faces[0].image_uris.normal ?? "";
  }

  // Fallback: construct URL from ID
  return buildScryfallImageUrl(card.id, size);
}

/** Construct a Scryfall image URL from card ID */
export function buildScryfallImageUrl(
  id: string,
  size: ImageSize = "normal",
  face: "front" | "back" = "front"
): string {
  const ext = size === "png" ? "png" : "jpg";
  return `https://cards.scryfall.io/${size}/${face}/${id[0]}/${id[1]}/${id}.${ext}`;
}

/** Placeholder card back image */
export const CARD_BACK_URL =
  "https://cards.scryfall.io/normal/back/0/0/0aeebaf5-8c7d-4636-9e82-8c27447861f7.jpg";
