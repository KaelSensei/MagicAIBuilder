/**
 * The `UserIdLookup` and `FollowStore` ports over the `User` and `UserFollow`
 * tables.
 *
 * Community context, follows. Implements `follow-ports.ts` for
 * `follow-use-cases.ts`; wired by `follow-server.ts`. One edge per pair is
 * the table's unique key (`followerId_followingId`), which is what makes
 * `follow` an upsert with nothing to update and `unfollow` a `deleteMany`
 * that may delete nothing.
 *
 * @module social/prisma-follow-store
 */
import "server-only";
import type { PrismaClient } from "@prisma/client";

import type { FollowStore, UserIdLookup } from "@/lib/social/follow-ports";

/**
 * The username lookup over `client`. The match is case-insensitive, as
 * `/api/users/[username]` matches: slugs are stored lowercase but linked to
 * with any casing.
 *
 * @param client - the Prisma client to run on; the shared one in production,
 *   a `stubPrisma` in tests
 */
export function prismaUserIdLookup(client: PrismaClient): UserIdLookup {
  return {
    async findUserIdByUsername(username) {
      const user = await client.user.findFirst({
        where: { username: { equals: username, mode: "insensitive" } },
        select: { id: true },
      });
      return user?.id ?? null;
    },
  };
}

/**
 * The follow store over `client`.
 *
 * @param client - the Prisma client to run on
 */
export function prismaFollowStore(client: PrismaClient): FollowStore {
  return {
    async follow({ followerId, followingId }) {
      // Upsert keeps a repeated follow idempotent rather than a unique-constraint error.
      await client.userFollow.upsert({
        where: { followerId_followingId: { followerId, followingId } },
        update: {},
        create: { followerId, followingId },
      });
    },

    async unfollow({ followerId, followingId }) {
      // deleteMany keeps this idempotent when no edge exists.
      await client.userFollow.deleteMany({
        where: { followerId, followingId },
      });
    },

    countFollowers(userId) {
      return client.userFollow.count({ where: { followingId: userId } });
    },
  };
}
