import { describe, expect, it } from "vitest";

import { canFollowUser, type FollowDecision } from "./follow-rules";

const ALLOWED: FollowDecision = { allowed: true };
const SELF_FOLLOW: FollowDecision = { allowed: false, reason: "self-follow" };

describe("canFollowUser", () => {
  it.each([
    ["a builder follows another builder", "follower-1", "target-1", ALLOWED],
    ["a builder follows themselves", "target-1", "target-1", SELF_FOLLOW],
  ])("%s", (_case, followerId, targetId, expected) => {
    expect(canFollowUser(followerId, targetId)).toEqual(expected);
  });
});
