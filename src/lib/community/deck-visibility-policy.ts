/**
 * Who may view a deck: the one place the rule is written.
 *
 * Community context, deck visibility. Pure: no database, no session. The
 * repositories read the facts and apply it: `findVisibleDeck` and
 * `decideDeckView` in `@/lib/community/visible-deck` for a deck opened by id,
 * for `GET /api/deck/[id]`, the public deck page and the community routes
 * (comments, ratings, votes, reports). A deck opened through its share link is
 * read by `@/lib/deck/shared-deck-lookup`, whose query keeps the same rule in
 * its `where` clause (see {@link canViewDeck}, rules 5 and 6).
 *
 * The rules below are the ones the routes applied before this module existed
 * (#1363, #1428, #1448), not a redesign. Changing one is a product decision
 * and a `fix/` PR with a Red test, never a side effect of a refactor.
 *
 * Not responsible for: who may *act* on a deck (vote, rate, comment, report,
 * save, fork). Those routes add their own rules on top, such as "not the
 * owner" or "public only"; see the community route handlers.
 *
 * @module community/deck-visibility-policy
 */

/**
 * The facts of a deck the rule reads.
 *
 * `ownerId` is null for a deck with no owner: the schema allows the row even
 * though no current code path writes one, so the rule must not read a missing
 * owner as "the anonymous viewer".
 */
export interface DeckVisibilityFacts {
  readonly ownerId: string | null;
  readonly isPublic: boolean;
  readonly shareEnabled: boolean;
}

/**
 * How the viewer reached the deck.
 *
 * - `id`: the deck id in the URL (`/deck/[id]`, `/api/deck/[id]`, the
 *   community routes). Who the viewer is decides.
 * - `share-token`: the deck's share link (`/share/[token]`,
 *   `/api/share/[token]`). The repository has already matched the token to
 *   the deck; the link itself is the capability, so who holds it does not
 *   matter.
 */
export type DeckAccess =
  { readonly kind: "id" } | { readonly kind: "share-token" };

/** The viewer opened the deck by its id. */
export const DECK_ACCESS_BY_ID: DeckAccess = { kind: "id" };

/** The viewer opened the deck through its share link. */
export const DECK_ACCESS_BY_SHARE_TOKEN: DeckAccess = { kind: "share-token" };

/**
 * The outcome of {@link canViewDeck}.
 *
 * - `owner`: the viewer owns the deck and may read it whole.
 * - `reader`: the viewer may read the deck through the allowlist of the way
 *   they arrived: `PUBLIC_DECK_SELECT` by id, `SHARED_DECK_SELECT` by share
 *   link. Never the owner's columns.
 * - `private`: the deck is private and the viewer is not its owner. Callers
 *   answer 404, not 403, so a stranger cannot tell a private deck from a
 *   missing one.
 * - `sharing-disabled`: the link's deck exists but its owner turned sharing
 *   off. Callers answer as for an unknown token.
 */
export type DeckViewDecision =
  | { readonly allowed: true; readonly view: "owner" | "reader" }
  | {
      readonly allowed: false;
      readonly reason: "private" | "sharing-disabled";
    };

const OWNER_VIEW: DeckViewDecision = { allowed: true, view: "owner" };
const READER_VIEW: DeckViewDecision = { allowed: true, view: "reader" };
const PRIVATE: DeckViewDecision = { allowed: false, reason: "private" };
const SHARING_DISABLED: DeckViewDecision = {
  allowed: false,
  reason: "sharing-disabled",
};

/**
 * Decides whether `viewerId` may view `deck`, and as whom.
 *
 * The rules, as the routes apply them today:
 *
 * 1. By id, a signed-in viewer whose id is the deck's owner id is the owner
 *    and sees the deck whole, public or private.
 * 2. A signed-out viewer owns nothing, and a deck with no owner belongs to
 *    nobody: a null viewer never matches a null owner.
 * 3. By id, anyone who is not the owner sees a public deck as a reader.
 * 4. By id, anyone who is not the owner is refused a private deck. The
 *    sharing setting plays no part when arriving by id: a private deck with
 *    sharing on is still refused to a viewer who did not come through the
 *    link.
 * 5. By share link, while sharing is enabled, the viewer sees the deck as a
 *    reader, public or private, signed in or not, the owner included: the
 *    share route and page never ask who the viewer is (#1428, #1448).
 * 6. By share link, with sharing disabled, nobody opens the deck, the owner
 *    included; the owner opens it by id instead.
 *
 * @param deck - the deck's visibility facts, read by the repository
 * @param viewerId - the signed-in user's id, or null when signed out
 * @param access - how the viewer reached the deck
 * @returns the decision; see {@link DeckViewDecision}
 */
export function canViewDeck(
  deck: DeckVisibilityFacts,
  viewerId: string | null,
  access: DeckAccess
): DeckViewDecision {
  switch (access.kind) {
    case "id":
      return decideById(deck, viewerId);
    case "share-token":
      return deck.shareEnabled ? READER_VIEW : SHARING_DISABLED;
    default: {
      const unreachable: never = access;
      return unreachable;
    }
  }
}

/** Rules 1 to 4: the viewer's identity decides. */
function decideById(
  deck: DeckVisibilityFacts,
  viewerId: string | null
): DeckViewDecision {
  // Rule 2: both sides are nullable, so `deck.ownerId === viewerId` alone
  // would read null === null as ownership.
  const isOwner = viewerId !== null && deck.ownerId === viewerId;
  if (isOwner) return OWNER_VIEW;
  return deck.isPublic ? READER_VIEW : PRIVATE;
}
