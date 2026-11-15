/**
 * Follow / unfollow another builder: `/api/community/users/[username]/follow`.
 *
 * POST   — follow the user behind :username
 * DELETE — unfollow them
 *
 * HTTP only: session, the username check and the status for each outcome.
 * The rules live in the use cases of `@/lib/social/follow-use-cases`. The
 * username rule is `isUsername`, shared with `/api/users/[username]`; the
 * match itself is case-insensitive, since profile slugs are stored lowercase
 * but linked to with any casing.
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { followUseCasePorts } from "@/lib/social/follow-server";
import {
  followUser,
  unfollowUser,
  type FollowResult,
  type FollowUseCasePorts,
} from "@/lib/social/follow-use-cases";
import { isUsername } from "@/lib/social/public-profile";

type Params = { params: Promise<{ username: string }> };

/** How many characters of a bad username the error log keeps. */
const LOGGED_USERNAME_LENGTH = 50;

type FollowUseCase = (
  command: { readonly followerId: string; readonly username: string },
  ports: FollowUseCasePorts
) => Promise<FollowResult>;

/** The follow state and count as the body, or the 400 / 404 the rules earn. */
function followResponse(result: FollowResult, following: boolean) {
  switch (result.kind) {
    case "ok":
      return NextResponse.json(
        { following, followerCount: result.followerCount },
        { status: following ? 201 : 200 }
      );
    case "user-not-found":
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    case "self-follow":
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
}

/**
 * Runs one follow use case for the signed-in caller. Both verbs share the
 * session check, the username check and the response mapping.
 */
async function changeFollow(
  username: string,
  run: FollowUseCase,
  following: boolean
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  if (!isUsername(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const command = { followerId: authResult.session.user.id, username };
  return followResponse(await run(command, followUseCasePorts), following);
}

// POST /api/community/users/[username]/follow
export async function POST(_req: Request, { params }: Params) {
  const { username } = await params;

  try {
    return await changeFollow(username, followUser, true);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "POST /api/community/users/:username/follow",
      { username: username.slice(0, LOGGED_USERNAME_LENGTH) }
    );
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

// DELETE /api/community/users/[username]/follow
export async function DELETE(_req: Request, { params }: Params) {
  const { username } = await params;

  try {
    return await changeFollow(username, unfollowUser, false);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "DELETE /api/community/users/:username/follow",
      { username: username.slice(0, LOGGED_USERNAME_LENGTH) }
    );
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
