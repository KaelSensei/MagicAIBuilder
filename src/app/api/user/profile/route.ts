/**
 * `/api/user/profile`: the signed-in account's own profile. GET reads it,
 * PATCH changes the display name or avatar URL, DELETE deletes the account
 * and, through the schema's cascades, everything it owns.
 *
 * Identity context. Session only (`requireAuth`); no route reads another
 * account's profile here (the public profile is `/api/users/[username]`).
 * Every request logs one line with its status and duration, never the
 * account's details.
 *
 * @module api/user/profile
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";
import { withRequestLog } from "@/lib/api/route-kit";

const COMPLETED = "Profile request completed";

/** GET /api/user/profile — Get current user's profile */
export async function GET() {
  return withRequestLog(
    { message: COMPLETED, context: "GET /api/user/profile" },
    readProfile
  );
}

async function readProfile(): Promise<NextResponse> {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const { id, name, email, image, createdAt, onboardingDone } = result.session.user;
    return NextResponse.json({ id, name, email, image, createdAt, onboardingDone });
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
  return withRequestLog(
    { message: COMPLETED, context: "PATCH /api/user/profile" },
    () => updateProfile(request)
  );
}

async function updateProfile(request: Request): Promise<NextResponse> {
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
  return withRequestLog(
    { message: COMPLETED, context: "DELETE /api/user/profile" },
    deleteAccount
  );
}

async function deleteAccount(): Promise<NextResponse> {
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
