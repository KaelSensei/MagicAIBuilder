import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ username: string }> };

// GET /api/users/[username] — public profile (no auth required)
export async function GET(_req: Request, { params }: Params) {
  const { username } = await params;

  if (!username || username.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    // Use findFirst with mode:insensitive to handle case-insensitive lookup
    // (e.g. /u/Kael and /u/kael both resolve to the same profile)
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        createdAt: true,
        decks: {
          where: { isPublic: true },
          select: {
            id: true,
            name: true,
            description: true,
            format: true,
            targetBracket: true,
            commanderId: true,
            isAIGenerated: true,
            createdAt: true,
            updatedAt: true,
            cards: {
              where: { isCommander: true },
              select: { name: true, artCropUri: true, imageUri: true },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/users/:username",
      { username: String(username).slice(0, 50) }
    );
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
