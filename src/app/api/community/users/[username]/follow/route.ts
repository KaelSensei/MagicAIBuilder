/**
 * Follow / unfollow another builder.
 *
 * POST   — follow the user behind :username
 * DELETE — unfollow them
 *
 * Both require a session. Username matching mirrors /api/users/[username]:
 * case-insensitive, since profile slugs are stored lowercase but linked to
 * with any casing.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ username: string }> };

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const USERNAME_MAX_LENGTH = 50;

/**
 * Validates a username slug from the route.
 *
 * @param username Raw route segment.
 * @returns True when the slug is well-formed.
 */
function isValidUsername(username: string): boolean {
  return (
    username.length > 0 &&
    username.length <= USERNAME_MAX_LENGTH &&
    USERNAME_PATTERN.test(username)
  );
}

/**
 * Resolves the follow target and the signed-in follower.
 *
 * @param username Target profile slug.
 * @returns The follower and target ids, or an error response.
 */
async function resolveFollowPair(
  username: string
): Promise<
  | { followerId: string; targetId: string; error?: never }
  | { followerId?: never; targetId?: never; error: NextResponse }
> {
  const authResult = await requireAuth();
  if (authResult.error) return { error: authResult.error };

  if (!isValidUsername(username)) {
    return { error: NextResponse.json({ error: "Invalid username" }, { status: 400 }) };
  }

  const target = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true },
  });

  if (!target) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  const followerId = authResult.session.user.id;
  if (followerId === target.id) {
    return {
      error: NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 }),
    };
  }

  return { followerId, targetId: target.id };
}

/**
 * Counts how many users follow a given profile.
 *
 * @param userId Profile owner id.
 * @returns The follower total.
 */
function countFollowers(userId: string): Promise<number> {
  return prisma.userFollow.count({ where: { followingId: userId } });
}

// POST /api/community/users/[username]/follow
export async function POST(_req: Request, { params }: Params) {
  const { username } = await params;

  try {
    const pair = await resolveFollowPair(username);
    if (pair.error) return pair.error;

    const { followerId, targetId } = pair;

    // upsert keeps a repeated follow idempotent rather than a unique-constraint error.
    await prisma.userFollow.upsert({
      where: { followerId_followingId: { followerId, followingId: targetId } },
      update: {},
      create: { followerId, followingId: targetId },
    });

    return NextResponse.json(
      { following: true, followerCount: await countFollowers(targetId) },
      { status: 201 }
    );
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "POST /api/community/users/:username/follow",
      { username: username.slice(0, USERNAME_MAX_LENGTH) }
    );
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
  }
}

// DELETE /api/community/users/[username]/follow
export async function DELETE(_req: Request, { params }: Params) {
  const { username } = await params;

  try {
    const pair = await resolveFollowPair(username);
    if (pair.error) return pair.error;

    const { followerId, targetId } = pair;

    await prisma.userFollow.deleteMany({
      where: { followerId, followingId: targetId },
    });

    return NextResponse.json({
      following: false,
      followerCount: await countFollowers(targetId),
    });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "DELETE /api/community/users/:username/follow",
      { username: username.slice(0, USERNAME_MAX_LENGTH) }
    );
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 });
  }
}
