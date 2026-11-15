/**
 * Who may follow whom: the one place that rule is written.
 *
 * Community context, follows. Pure: no database, no session. The follow use
 * cases (`follow-use-cases.ts`) resolve the target through a port and ask this
 * module. The rule is the one `/api/community/users/[username]/follow`
 * applied before this module existed, not a redesign: changing it is a
 * product decision and a `fix/` PR with a Red test.
 *
 * The other half of "who may follow", an existing target, is not a decision:
 * the use case answers `user-not-found` when the lookup finds nobody.
 *
 * @module social/follow-rules
 */

/**
 * The outcome of {@link canFollowUser}.
 *
 * - `allowed`: the follower may follow, or unfollow, the target.
 * - `self-follow`: the follower is the target. The route answers 400, for an
 *   unfollow too: it applied the same check to both verbs.
 */
export type FollowDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: "self-follow" };

const ALLOWED: FollowDecision = { allowed: true };
const SELF_FOLLOW: FollowDecision = { allowed: false, reason: "self-follow" };

/**
 * Decides whether `followerId` may follow `targetId`.
 *
 * Both are user ids the caller has already resolved: the follower from the
 * session, the target from its username. The one rule: nobody follows
 * themselves.
 *
 * @param followerId - the signed-in user
 * @param targetId - the id behind the `[username]` segment
 */
export function canFollowUser(
  followerId: string,
  targetId: string
): FollowDecision {
  return followerId === targetId ? SELF_FOLLOW : ALLOWED;
}
