"use client";
/**
 * The Owned / Buy badge of a deck card shown as a grid tile: the list row's
 * `DeckCardOwnershipBadge`, with the same rule, the same accessible name and
 * the same "Collection" switch, placed over the card image (I-37).
 *
 * The tile's corners already hold its remove, drag, select and move controls,
 * and the card's name runs along the top of the image, so the badge sits on
 * the left edge of the art box, clear of both at every grid width. An opaque
 * backing keeps its text readable over any artwork.
 *
 * @module deck/GridCardOwnershipBadge
 */
import { DeckCardOwnershipBadge } from "@/components/collection/DeckCardOwnershipBadge";
import type { DeckCard } from "@/lib/deck/types";

interface GridCardOwnershipBadgeProps {
  readonly card: Pick<DeckCard, "id" | "scryfallId" | "typeLine" | "quantity">;
}

/**
 * Overlays the card's Owned or Buy badge on its image.
 *
 * The parent must be positioned (`relative`) and wrap the image alone, so the
 * badge lands on the art whatever the tile shows under the image. Renders
 * nothing whenever the list row's badge would not show.
 */
export function GridCardOwnershipBadge({ card }: GridCardOwnershipBadgeProps) {
  return (
    <DeckCardOwnershipBadge
      card={card}
      className="absolute left-1 top-[40%] z-10 bg-black/80 shadow-lg"
    />
  );
}
