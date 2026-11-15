import { describe, expect, it } from "vitest";

import {
  followUser,
  unfollowUser,
  type FollowUseCasePorts,
} from "./follow-use-cases";
import type { FollowEdge } from "./follow-ports";
import {
  edgeKey,
  inMemoryFollowStore,
  inMemoryUserIdLookup,
} from "./testing/follow-fakes";

const FOLLOWER = "follower-1";
const TARGET = "target-1";
const ACCOUNTS = [
  { id: FOLLOWER, username: "follower" },
  { id: TARGET, username: "kael" },
  { id: "fan-1", username: "fan" },
];
const EDGE: FollowEdge = { followerId: FOLLOWER, followingId: TARGET };
const FAN_EDGE: FollowEdge = { followerId: "fan-1", followingId: TARGET };

function ports(seed: readonly FollowEdge[] = []): {
  readonly ports: FollowUseCasePorts;
  readonly follows: ReturnType<typeof inMemoryFollowStore>;
} {
  const follows = inMemoryFollowStore(seed);
  return {
    ports: { users: inMemoryUserIdLookup(ACCOUNTS), follows },
    follows,
  };
}

describe("followUser", () => {
  it("stores the edge and answers the target's new follower count", async () => {
    const { ports: p, follows } = ports([FAN_EDGE]);

    await expect(
      followUser({ followerId: FOLLOWER, username: "kael" }, p)
    ).resolves.toEqual({ kind: "ok", followerCount: 2 });
    expect(follows.edges.get(edgeKey(EDGE))).toEqual(EDGE);
  });

  it("is idempotent when already following", async () => {
    const { ports: p, follows } = ports([EDGE]);

    await expect(
      followUser({ followerId: FOLLOWER, username: "kael" }, p)
    ).resolves.toEqual({ kind: "ok", followerCount: 1 });
    expect(follows.edges.size).toBe(1);
  });

  it("resolves the target username case-insensitively", async () => {
    const { ports: p } = ports();

    await expect(
      followUser({ followerId: FOLLOWER, username: "Kael" }, p)
    ).resolves.toEqual({ kind: "ok", followerCount: 1 });
  });

  it("refuses a self-follow and stores nothing", async () => {
    const { ports: p, follows } = ports();

    await expect(
      followUser({ followerId: TARGET, username: "kael" }, p)
    ).resolves.toEqual({ kind: "self-follow" });
    expect(follows.edges.size).toBe(0);
  });

  it("answers user-not-found for an unknown username", async () => {
    const { ports: p, follows } = ports();

    await expect(
      followUser({ followerId: FOLLOWER, username: "nobody" }, p)
    ).resolves.toEqual({ kind: "user-not-found" });
    expect(follows.edges.size).toBe(0);
  });
});

describe("unfollowUser", () => {
  it("removes the edge and answers the target's new follower count", async () => {
    const { ports: p, follows } = ports([EDGE, FAN_EDGE]);

    await expect(
      unfollowUser({ followerId: FOLLOWER, username: "kael" }, p)
    ).resolves.toEqual({ kind: "ok", followerCount: 1 });
    expect(follows.edges.has(edgeKey(EDGE))).toBe(false);
  });

  it("is idempotent when not currently following", async () => {
    const { ports: p } = ports();

    await expect(
      unfollowUser({ followerId: FOLLOWER, username: "kael" }, p)
    ).resolves.toEqual({ kind: "ok", followerCount: 0 });
  });

  it("currently refuses unfollowing oneself with the self-follow rule (pinned: the route applied it to both verbs)", async () => {
    const { ports: p } = ports();

    await expect(
      unfollowUser({ followerId: TARGET, username: "kael" }, p)
    ).resolves.toEqual({ kind: "self-follow" });
  });

  it("answers user-not-found for an unknown username", async () => {
    const { ports: p } = ports();

    await expect(
      unfollowUser({ followerId: FOLLOWER, username: "nobody" }, p)
    ).resolves.toEqual({ kind: "user-not-found" });
  });
});
