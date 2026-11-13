/**
 * Who may report a deck and who may save one as a bookmark: the one place
 * each rule is written.
 *
 * Community context, deck actions. Pure: no database, no session. The report
 * and saved-deck use cases (`deck-report-use-cases.ts`,
 * `saved-deck-use-cases.ts`) read the deck's facts through a port and ask
 * this module. The facts are the visibility facts of COM-11
 * (`@/lib/community/deck-visibility-policy`), so a reader that serves
 * `canViewDeck` also serves these rules.
 *
 * The rules are the ones the reports and save routes applied before this
 * module existed (#1363, #1490), not a redesign. Changing one is a product
 * decision and a `fix/` PR with a Red test, never a side effect of a refactor.
 *
 * Not responsible for: votes and ratings (COM-12, `deck-interaction-policy.ts`,
 * whose `isOwnDeck` this module repeats until the two merge), comments
 * (COM-13), follows (`@/lib/social/follow-rules`).
 *
 * @module community/deck-action-rules
 */
import type { DeckVisibilityFacts } from "@/lib/community/deck-visibility-policy";

/**
 * The facts the report and save rules read. A subset of
 * {@link DeckVisibilityFacts}: the sharing setting plays no part, because a
 * share link grants no action and these routes are reached by deck id only.
 */
export type DeckActionFacts = Pick<DeckVisibilityFacts, "ownerId" | "isPublic">;

/**
 * The outcome of {@link canReportDeck} or {@link canSaveDeck}.
 *
 * - `allowed`: the actor may act.
 * - `hidden`: the deck is not public. Callers answer 404, as they do for a
 *   deck that does not exist, so nobody can tell a private deck from a
 *   missing one. The owner's own private deck is refused the same way: these
 *   are rules about acting on a public deck, not about viewing one.
 * - `own-deck`: the actor owns the deck. Callers answer 403.
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
 * Decides whether `reporterId` may report `deck` to the moderators.
 *
 * The rules, as the reports route applies them today:
 *
 * 1. Public only: a deck that is not public is `hidden`, whoever asks. The
 *    route used to read the deck through `findVisibleDeck` and test
 *    `isPublic` again; the owner of a private deck could see it but was
 *    still refused, so the one check here is the visible rule.
 * 2. The owner may not report their own deck: `own-deck`.
 *
 * The reasons a reporter may give are `REPORT_REASONS`
 * (`community-contracts.ts`), which the route's schema enforces. One report
 * per reporter and deck is a guarantee of the report store (`DeckReportStore`
 * in `deck-action-ports.ts`), not a decision taken here: it depends on what
 * is already stored.
 *
 * @param deck - the deck's facts, read by the repository
 * @param reporterId - the signed-in user filing the report
 */
export function canReportDeck(
  deck: DeckActionFacts,
  reporterId: string
): DeckActionDecision {
  if (!deck.isPublic) return HIDDEN;
  return isOwnDeck(deck, reporterId) ? OWN_DECK : ALLOWED;
}

/**
 * Decides whether a signed-in user may save `deck` as a private bookmark.
 *
 * The one rule, as the save route applies it today: public only. A deck that
 * is not public is `hidden`, for the owner too. Nothing stops an owner from
 * bookmarking their own public deck; see the COM-14 follow-up before adding
 * that rule, which would be a behaviour change.
 *
 * @param deck - the deck's facts, read by the repository
 */
export function canSaveDeck(deck: DeckActionFacts): DeckActionDecision {
  return deck.isPublic ? ALLOWED : HIDDEN;
}
