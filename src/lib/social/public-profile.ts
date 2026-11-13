/**
 * The shape of a public profile as `GET /api/users/[username]` answers it and
 * the profile page (`/u/[username]`) renders it, plus the username rule both
 * apply before touching the database.
 *
 * Types and a pure rule only, so client components can import them. The
 * server-side read is `findPublicProfile` in
 * `@/lib/social/public-profile-lookup`.
 *
 * @module social/public-profile
 */

import type { PlayerBadge } from "@/lib/social/player-badges";

/** The commander card of a public deck, as the profile's deck grid shows it. */
export interface PublicProfileCommanderCard {
  readonly name: string;
  readonly artCropUri: string;
  readonly imageUri: string;
}

/** One public deck on a profile. Dates are ISO strings, as over HTTP. */
export interface PublicProfileDeck {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly format: string;
  readonly targetBracket: number;
  readonly commanderId: string | null;
  readonly isAIGenerated: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** The commander card alone (`take: 1`), or empty for a deck without one. */
  readonly cards: readonly PublicProfileCommanderCard[];
}

/** What every visitor of a public profile receives. */
export interface PublicProfile {
  readonly id: string;
  readonly name: string | null;
  readonly username: string;
  readonly image: string | null;
  /** When the account was created, as an ISO string. */
  readonly createdAt: string;
  /** The owner's public decks, most recently updated first. */
  readonly decks: readonly PublicProfileDeck[];
  readonly followerCount: number;
  readonly followingCount: number;
  /**
   * Whether the viewer follows this profile. Viewer-relative: false for a
   * signed-out viewer, and always false for the owner.
   */
  readonly isFollowing: boolean;
  readonly badges: readonly PlayerBadge[];
}

/**
 * A username is 1 to 50 ASCII letters, digits, `_` or `-`, the characters the
 * sign-up form accepts. Anything else cannot name an account, so the route
 * answers 400 and the page shows not-found without asking the database.
 */
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{1,50}$/;

/**
 * Whether `username` can name an account.
 *
 * @param username - the `[username]` segment of the URL, unchecked
 * @returns true when it matches the username rule above
 */
export function isUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}
