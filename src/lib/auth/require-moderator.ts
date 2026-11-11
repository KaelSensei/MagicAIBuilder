/**
 * The moderation gate for route handlers: a signed-in user whose `isModerator`
 * flag is set.
 *
 * The flag is read from the database on every call, not from the session
 * token, so revoking it takes effect on the next request. Answers 401 through
 * `requireAuth` and 403 when the flag is off.
 *
 * @module auth/require-moderator
 */
import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "./helpers";

/** Require an authenticated user with explicit moderation access. */
export async function requireModerator(): Promise<
  | { readonly moderatorId: string; readonly error?: never }
  | { readonly moderatorId?: never; readonly error: NextResponse }
> {
  const authentication = await requireAuth();
  if (authentication.error) return authentication;

  const moderator = await prisma.user.findUnique({
    where: { id: authentication.session.user.id },
    select: { isModerator: true },
  });
  if (!moderator?.isModerator) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { moderatorId: authentication.session.user.id };
}
