import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

type Params = { readonly params: Promise<{ readonly id: string }> };

const SaveSchema = z.object({ folderId: z.string().min(1).nullable() });

/** Save a public deck as a private bookmark, optionally inside a personal folder. */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;
    const userId = authentication.session.user.id;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = SaveSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    const deck = await prisma.deck.findUnique({
      where: { id },
      select: { id: true, isPublic: true, userId: true },
    });
    if (!deck?.isPublic) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const folderId = parsed.data.folderId;
    if (folderId) {
      const folder = await prisma.publicDeckFolder.findFirst({
        where: { id: folderId, userId },
        select: { id: true },
      });
      if (!folder) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
      }
    }

    await prisma.savedPublicDeck.upsert({
      where: { userId_deckId: { userId, deckId: id } },
      update: { folderId },
      create: { userId, deckId: id, folderId },
    });
    return NextResponse.json({ saved: true, folderId }, { status: 201 });
  } catch (error) {
    logger.error("Unexpected error", "POST /api/community/decks/:id/save", error);
    return NextResponse.json({ error: "Failed to save deck" }, { status: 500 });
  }
}

/** Remove only the caller's bookmark; the public deck remains untouched. */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;

    await prisma.savedPublicDeck.deleteMany({
      where: { userId: authentication.session.user.id, deckId: id },
    });
    return NextResponse.json({ saved: false });
  } catch (error) {
    logger.error("Unexpected error", "DELETE /api/community/decks/:id/save", error);
    return NextResponse.json({ error: "Failed to remove saved deck" }, { status: 500 });
  }
}
