/**
 * In-memory fakes of the follow ports, for the follow use-case tests
 * (ADR 0005: owned ports get a hand-written fake).
 *
 * Community context, follows. The fakes keep the guarantees the ports state
 * in `follow-ports.ts`: one edge per pair, idempotent follow and unfollow, a
 * case-insensitive username match. A test seeds the accounts and edges it
 * needs and reads the set back for its assertions.
 *
 * @module social/testing/follow-fakes
 */
import type {
  FollowEdge,
  FollowStore,
  UserIdLookup,
} from "@/lib/social/follow-ports";

/** An account as the fake knows it. */
export interface FakeAccount {
  readonly id: string;
  readonly username: string;
}

/** A lookup over the given accounts, matching usernames case-insensitively. */
export function inMemoryUserIdLookup(
  accounts: readonly FakeAccount[]
): UserIdLookup {
  return {
    findUserIdByUsername: (username) =>
      Promise.resolve(
        accounts.find(
          (account) =>
            account.username.toLowerCase() === username.toLowerCase()
        )?.id ?? null
      ),
  };
}

/** The one string an edge is keyed on: who follows whom. */
export function edgeKey({ followerId, followingId }: FollowEdge): string {
  return `${followerId}>${followingId}`;
}

/** The follow fake, with its edges exposed for seeding and assertions. */
export interface InMemoryFollowStore extends FollowStore {
  readonly edges: Map<string, FollowEdge>;
}

/** @returns a new follow store holding `seed`, independent of every other */
export function inMemoryFollowStore(
  seed: readonly FollowEdge[] = []
): InMemoryFollowStore {
  const edges = new Map(seed.map((edge) => [edgeKey(edge), edge]));
  return {
    edges,
    follow: (edge) => {
      edges.set(edgeKey(edge), edge);
      return Promise.resolve();
    },
    unfollow: (edge) => {
      edges.delete(edgeKey(edge));
      return Promise.resolve();
    },
    countFollowers: (userId) =>
      Promise.resolve(
        [...edges.values()].filter((edge) => edge.followingId === userId)
          .length
      ),
  };
}
