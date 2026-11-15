/**
 * Who may act on a deck: vote on it or rate it. The one place that rule is
 * written.
 *
 * Community context, deck interactions. Pure: no database, no session. The
 * vote and rating use cases (`deck-vote-use-cases.ts`,
 * `deck-rating-use-cases.ts`) read the deck's facts through a port and ask
 * this module. It builds on the visibility policy
 * (`@/lib/community/deck-visibility-policy`, COM-11): acting on a deck starts
 * with being allowed to see it.
 *
 * The rules are the ones the vote and ratings routes applied before this
 * module existed (#1363), not a redesign. Changing one is a product decision
 * and a `fix/` PR with a Red test, never a side effect of a refactor.
 *
 * Not responsible for: comments (COM-13), reports, saves and follows (COM-14),
 * which add rules of their own on top of `isOwnDeck`.
 *
 * @module community/deck-interaction-policy
 */
import {
  canViewDeck,
  DECK_ACCESS_BY_ID,
  type DeckVisibilityFacts,
} from "@/lib/community/deck-visibility-policy";

/**
 * The outcome of {@link canActOnDeck}.
 *
 * - `allowed`: the actor may vote on or rate the deck.
 * - `hidden`: the actor may not even see the deck. Callers answer 404, as
 *   they do for a deck that does not exist, so a stranger cannot tell a
 *   private deck from a missing one.
 * - `own-deck`: the actor owns the deck. Callers answer 403: the owner may
 *   see their deck, but a deck's quality signals come from other players.
 */
export type DeckActionDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: "hidden" | "own-deck" };

const ALLOWED: DeckActionDecision = { allowed: true };
const HIDDEN: DeckActionDecision = { allowed: false, reason: "hidden" };
const OWN_DECK: DeckActionDecision = { allowed: false, reason: "own-deck" };

/**
 * Whether `actorId` owns the deck.
 *
 * `actorId` is a signed-in user's id, never null: the routes that ask have
 * already required a session. A deck with no owner (`ownerId` null, allowed
 * by the schema though nothing writes one) belongs to nobody, so no actor
 * owns it.
 *
 * @param deck - the deck's owner, as the repository read it
 * @param actorId - the signed-in user acting on the deck
 */
export function isOwnDeck(
  deck: { readonly ownerId: string | null },
  actorId: string
): boolean {
  return deck.ownerId !== null && deck.ownerId === actorId;
}

/**
 * Decides whether `actorId` may vote on or rate `deck`.
 *
 * The rules, as the routes apply them today:
 *
 * 1. The actor must be allowed to view the deck by its id
 *    ({@link canViewDeck} with `DECK_ACCESS_BY_ID`); otherwise the deck is
 *    `hidden`.
 * 2. The owner may not act on their own deck: `own-deck`.
 * 3. Public only: a non-owner may act on a public deck only. By id, this is
 *    rule 1 already, because the visibility policy shows a non-owner a public
 *    deck and refuses a private one (its rules 3 and 4). It is named here so
 *    the rule reads in one place; a private deck reached by a non-owner is
 *    `hidden`, not a distinct refusal, so the answer stays 404.
 *
 * A share link grants no action: these routes are reached by deck id only,
 * so a share-token viewer who is not the owner acts on a public deck like
 * anyone else, and cannot reach a private one through this policy.
 *
 * @param deck - the deck's visibility facts, read by the repository
 * @param actorId - the signed-in user acting on the deck
 * @returns the decision; see {@link DeckActionDecision}
 */
export function canActOnDeck(
  deck: DeckVisibilityFacts,
  actorId: string
): DeckActionDecision {
  const view = canViewDeck(deck, actorId, DECK_ACCESS_BY_ID);
  if (!view.allowed) return HIDDEN;
  return isOwnDeck(deck, actorId) ? OWN_DECK : ALLOWED;
}
