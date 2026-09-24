import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const BulkMoveSchema = z.object({
  deckIds: z.array(z.string().min(1).max(50)).min(1).max(100),
  folderId: z.string().min(1).max(50).nullable(),
});

/** Moves up to 100 owned decks into an owned folder in one request. */
export async function PATCH(request: Request) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;
    const userId = authentication.session.user.id;
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = BulkMoveSchema.safeParse(jsonBody.value);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid bulk move" }, { status: 400 });

    if (parsed.data.folderId) {
      const folder = await prisma.deckFolder.findFirst({
        where: { id: parsed.data.folderId, userId },
        select: { id: true },
      });
      if (!folder)
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 }
        );
    }
    const deckIds = [...new Set(parsed.data.deckIds)];
    const moved = await prisma.deck.updateMany({
      where: { id: { in: deckIds }, userId },
      data: { folderId: parsed.data.folderId },
    });
    return NextResponse.json({
      moved: moved.count,
      folderId: parsed.data.folderId,
    });
  } catch (error) {
    logger.error("Unexpected error", "PATCH /api/decks/folders", error);
    return NextResponse.json(
      { error: "Failed to move decks" },
      { status: 500 }
    );
  }
}
