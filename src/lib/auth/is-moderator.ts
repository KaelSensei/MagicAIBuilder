/**
 * The one read of a user's moderation access, shared by the route gate
 * (`requireModerator`) and the moderation pages.
 *
 * The `isModerator` flag is read from the database on every call, never from
 * the session token, so revoking it takes effect on the next request. Folding
 * it into the session user select is a separate performance change.
 *
 * @module auth/is-moderator
 */
import "server-only";
import { prisma } from "@/lib/db/prisma";

/**
 * Whether the user a session names holds moderation access.
 *
 * @param userId - the id the session carries; `null` for a signed-out
 *   visitor. An empty id is treated as signed out too, as `requireAuth` does.
 * @returns `false` without a database read when there is no id, and `false`
 *   when the id names no live user; `true` only when the row's flag is set.
 */
export async function isModerator(userId: string | null): Promise<boolean> {
  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isModerator: true },
  });
  return user?.isModerator === true;
}
