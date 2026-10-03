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
