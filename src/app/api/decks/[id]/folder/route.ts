import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const MoveSchema = z.object({ folderId: z.string().min(1).max(50).nullable() });
interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

/** Moves one owned deck into an owned folder, or back to the unfiled library. */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;
    const userId = authentication.session.user.id;
    const { id } = await context.params;
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = MoveSchema.safeParse(jsonBody.value);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });

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
    const moved = await prisma.deck.updateMany({
      where: { id, userId },
      data: { folderId: parsed.data.folderId },
    });
    if (moved.count === 0)
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    return NextResponse.json({ id, folderId: parsed.data.folderId });
  } catch (error) {
    logger.error("Unexpected error", "PATCH /api/decks/:id/folder", error);
    return NextResponse.json({ error: "Failed to move deck" }, { status: 500 });
  }
}
