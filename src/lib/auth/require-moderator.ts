/**
 * The moderation gate for route handlers: a signed-in user who holds
 * moderation access, as `isModerator` reads it.
 *
 * Answers 401 through `requireAuth` and 403 when access is refused. The
 * moderation pages share the read and answer 404 instead, so the two gates
 * differ only in the answer, never in the rule.
 *
 * @module auth/require-moderator
 */
import "server-only";
import { NextResponse } from "next/server";
import { requireAuth } from "./helpers";
import { isModerator } from "./is-moderator";

/** Require an authenticated user with explicit moderation access. */
export async function requireModerator(): Promise<
  | { readonly moderatorId: string; readonly error?: never }
  | { readonly moderatorId?: never; readonly error: NextResponse }
> {
  const authentication = await requireAuth();
  if (authentication.error) return authentication;

  const moderatorId = authentication.session.user.id;
  if (!(await isModerator(moderatorId))) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { moderatorId };
}
