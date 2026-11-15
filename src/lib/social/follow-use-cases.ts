/**
 * Following another builder, and unfollowing them.
 *
 * Community context, follows. `/api/community/users/[username]/follow` calls
 * these after the session and the username are checked, and maps each
 * outcome to a status; the HTTP concerns stay in the route. The use cases
 * depend on the ports in `follow-ports.ts` only, so they run in Vitest with
 * in-memory fakes and no database (ADR 0005). The rule is `canFollowUser`
 * (`follow-rules.ts`).
 *
 * @module social/follow-use-cases
 */
import type {
  FollowEdge,
  FollowStore,
  UserIdLookup,
} from "@/lib/social/follow-ports";
import { canFollowUser } from "@/lib/social/follow-rules";

/** The adapters the follow use cases run on; `follow-server.ts` passes the real ones. */
export interface FollowUseCasePorts {
  readonly users: UserIdLookup;
  readonly follows: FollowStore;
}

/** Who follows, or unfollows, whom: the target by username, as the URL names it. */
export interface FollowUserCommand {
  readonly followerId: string;
  /** A well-formed username, checked by the route with `isUsername`. */
  readonly username: string;
}

/**
 * The outcome of {@link followUser} and {@link unfollowUser}:
 * - `ok`: the edge is stored (or removed) and `followerCount` is the target's
 *   follower total after the write;
 * - `user-not-found`: no account has this username;
 * - `self-follow`: the follower is the target.
 */
export type FollowResult =
  | { readonly kind: "ok"; readonly followerCount: number }
  | { readonly kind: "user-not-found" }
  | { readonly kind: "self-follow" };

type FollowWrite = (edge: FollowEdge) => Promise<void>;

/**
 * Resolves the target, applies the rule, runs `write` and answers the new
 * follower count. Shared by both use cases because the route applied the
 * same checks to both verbs.
 */
async function changeFollow(
  { followerId, username }: FollowUserCommand,
  ports: FollowUseCasePorts,
  write: FollowWrite
): Promise<FollowResult> {
  const targetId = await ports.users.findUserIdByUsername(username);
  if (targetId === null) return { kind: "user-not-found" };

  const decision = canFollowUser(followerId, targetId);
  if (!decision.allowed) return { kind: decision.reason };

  await write({ followerId, followingId: targetId });
  return {
    kind: "ok",
    followerCount: await ports.follows.countFollowers(targetId),
  };
}

/**
 * Follows the builder behind `username`. Idempotent: following again keeps
 * one edge and answers the unchanged count.
 */
export function followUser(
  command: FollowUserCommand,
  ports: FollowUseCasePorts
): Promise<FollowResult> {
  return changeFollow(command, ports, (edge) => ports.follows.follow(edge));
}

/**
 * Unfollows the builder behind `username`. Idempotent: unfollowing someone
 * not followed answers the unchanged count. The self-follow rule applies
 * here too, as the route applied it before this use case existed.
 */
export function unfollowUser(
  command: FollowUserCommand,
  ports: FollowUseCasePorts
): Promise<FollowResult> {
  return changeFollow(command, ports, (edge) => ports.follows.unfollow(edge));
}
