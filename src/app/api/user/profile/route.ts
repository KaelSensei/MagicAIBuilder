import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";

/** GET /api/user/profile — Get current user's profile */
export async function GET() {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const user = await prisma.user.findUnique({
      where: { id: result.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        onboardingDone: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "GET /api/user/profile");
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z
    .string()
    .max(2048)
    .refine(isValidHttpUrl, { message: "Invalid image URL" })
    .nullable()
    .optional(),
});

/** PATCH /api/user/profile — Update current user's profile */
export async function PATCH(request: Request) {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const jsonBody = await readJsonBody(request);

    if (!jsonBody.ok) return jsonBody.response;

    const body = jsonBody.value;
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: result.session.user.id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "PATCH /api/user/profile");
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

/** DELETE /api/user/profile — Delete current user's account and all data */
export async function DELETE() {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    await prisma.user.delete({
      where: { id: result.session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "DELETE /api/user/profile");
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
