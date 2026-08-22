/**
 * `DELETE /api/user/api-keys/:id` — revoke one key.
 *
 * Revocation stamps `revokedAt` rather than deleting the row. A key that had to
 * be revoked is exactly the one whose history matters afterwards — when it was
 * created, when it was last used — and a delete destroys that evidence at the
 * moment it becomes useful.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { id } = await params;
  const userId = result.session.user.id;

  try {
    // Scoped by userId in the same statement as the id: fetching then checking
    // ownership would leave a window, and a bare `update` on the id alone would
    // let anyone revoke anyone's key.
    const { count } = await prisma.apiKey.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (count === 0) {
      // One answer for "no such key", "not yours" and "already revoked". The
      // first two must not be distinguishable — that difference would confirm a
      // key id belongs to someone — and the third is idempotent by nature.
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({ revoked: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "API key revocation failed";
    logger.error(message, "DELETE /api/user/api-keys/:id", { userId });
    return NextResponse.json({ error: "Could not revoke the API key" }, { status: 500 });
  }
}
