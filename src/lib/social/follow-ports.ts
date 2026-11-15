/**
 * What following a builder needs from the outside: the id behind a username,
 * and the stored follow edges.
 *
 * Community context, follows. The use cases in `follow-use-cases.ts` depend
 * on these ports only. `prisma-follow-store.ts` implements them over Prisma;
 * `follow-server.ts` wires them. Tests hand the use cases the in-memory fakes
 * of `testing/follow-fakes.ts` instead (ADR 0005).
 *
 * @module social/follow-ports
 */

/** Resolves a profile slug to an account. */
export interface UserIdLookup {
  /**
   * The id of the account whose username matches, case-insensitively:
   * profile slugs are stored lowercase but linked to with any casing.
   *
   * @param username - a well-formed username (`isUsername`), unchecked here
   * @returns the user's id, or null when no account has this username
   */
  findUserIdByUsername(username: string): Promise<string | null>;
}

/** One follow edge: `followerId` follows `followingId`. The pair identifies a stored row. */
export interface FollowEdge {
  readonly followerId: string;
  readonly followingId: string;
}

/**
 * The stored follow edges, one row per pair (`@@unique([followerId, followingId])`).
 *
 * An implementation guarantees:
 * - `follow` stores the edge and is idempotent: following twice keeps one
 *   row and is not an error;
 * - `unfollow` is idempotent: removing an edge that does not exist is not an
 *   error;
 * - `countFollowers` answers how many accounts follow `userId`.
 * Any method rejects with the store's own error when the store fails; the
 * route turns that into a 500.
 */
export interface FollowStore {
  follow(edge: FollowEdge): Promise<void>;
  unfollow(edge: FollowEdge): Promise<void>;
  countFollowers(userId: string): Promise<number>;
}
