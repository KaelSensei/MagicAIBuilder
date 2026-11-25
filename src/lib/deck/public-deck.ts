/**
 * The shape of a deck on the public deck page (`/deck/[id]`) and in the
 * community deck comparison, which reads it from `GET /api/deck/[id]`.
 *
 * Types only, so client components can import it. The server-side read is
 * `findDeckForViewer` in `@/lib/deck/deck-for-viewer`.
 */

import type { PublicDeckRecord } from "@/lib/deck/public-deck-select";

/** A card of a public deck, exactly as the public allowlist exposes it. */
export type PublicCard = Readonly<PublicDeckRecord["cards"][number]>;

/** The author byline of a public deck. */
export type PublicDeckAuthor = Readonly<NonNullable<PublicDeckRecord["user"]>>;

/**
 * The deck's stored creation and update instants as a viewer receives them:
 * ISO 8601 strings, the form JSON gives a `Date`. The page reads in-process
 * and gets the same form, so no client type claims a `Date` that the API
 * delivers as a string.
 */
export interface DeckDatesAsIso {
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * What every viewer of a public deck receives. The owner receives their whole
 * deck, which is a superset of this shape.
 */
export type PublicDeck = Readonly<
  Omit<PublicDeckRecord, "cards" | "user" | keyof DeckDatesAsIso>
> &
  DeckDatesAsIso & {
    readonly cards: readonly PublicCard[];
    readonly user: PublicDeckAuthor | null;
    readonly isOwner: boolean;
  };
