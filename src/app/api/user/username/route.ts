import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";

const usernameSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: "Username can only contain letters, numbers, hyphens and underscores",
    }),
});

// PATCH /api/user/username — claim or update username
export async function PATCH(request: Request) {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const jsonBody = await readJsonBody(request);

    if (!jsonBody.ok) return jsonBody.response;

    const body = jsonBody.value;
    const parsed = usernameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid username", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    // Normalize to lowercase for consistent storage — /u/Kael and /u/kael are the same
    const username = parsed.data.username.toLowerCase();

    // Check uniqueness (case-insensitive)
    const existing = await prisma.user.findFirst({
      where: {
        username: { equals: username, mode: "insensitive" },
        NOT: { id: result.session.user.id },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const user = await prisma.user.update({
      where: { id: result.session.user.id },
      data: { username },
      select: { id: true, username: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "PATCH /api/user/username"
    );
    return NextResponse.json({ error: "Failed to update username" }, { status: 500 });
  }
}
