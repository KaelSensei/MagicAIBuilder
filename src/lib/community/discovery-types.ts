/**
 * Shapes returned by the commander deck discovery endpoint.
 *
 * Kept separate from `votes.ts` so both the server route and the client view
 * can import them without pulling in the tallying logic.
 *
 * @module community/discovery-types
 */

import type { QualityBadge } from "@/lib/ratings/ratings";
import type { VoteValue } from "./votes";

/** The commander card as shown on a discovery row. */
export interface DiscoveryCommander {
  readonly name: string;
  readonly imageUri: string;
  readonly artCropUri: string;
}

/** The deck's owner, as displayed. All fields may be absent. */
export interface DiscoveryAuthor {
  readonly name: string | null;
  readonly username: string | null;
  readonly image: string | null;
}

/** One public deck in the discovery listing. */
export interface CommanderDeckSummary {
  readonly id: string;
  readonly name: string;
  readonly format: string;
  readonly updatedAt: string;
  readonly cardCount: number;
  readonly commander: DiscoveryCommander;
  readonly author: DiscoveryAuthor | null;
  readonly score: number;
  readonly upvotes: number;
  readonly downvotes: number;
  readonly viewerVote?: VoteValue | null;
  readonly averageRating: number;
  readonly ratingCount: number;
  readonly badge: QualityBadge;
}

/** Response body of `GET /api/community/commanders/[slug]/decks`. */
export interface CommanderDecksResponse {
  readonly slug: string;
  readonly commanderName: string | null;
  readonly total: number;
  readonly decks: readonly CommanderDeckSummary[];
}
