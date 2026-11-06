import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { readJsonBody } from "@/lib/api/json-body";
import { prisma } from "@/lib/db/prisma";

const notificationPreferenceSchema = z
  .object({
    replies: z.boolean().optional(),
    mentions: z.boolean().optional(),
    follows: z.boolean().optional(),
    watchedDecks: z.boolean().optional(),
  })
  .refine((preferences) => Object.values(preferences).some((value) => value !== undefined), {
    message: "At least one notification preference is required",
  });

const preferenceSelection = {
  replies: true,
  mentions: true,
  follows: true,
  watchedDecks: true,
};

const defaultPreferences = {
  replies: true,
  mentions: true,
  follows: true,
  watchedDecks: true,
};

/** GET /api/user/notification-preferences — Get the current user's event preferences. */
export async function GET() {
  const result = await requireAuth();
  if (result.error) return result.error;

  const preferences = await prisma.notificationPreference.upsert({
    where: { userId: result.session.user.id },
    update: {},
    create: { userId: result.session.user.id, ...defaultPreferences },
    select: preferenceSelection,
  });

  return NextResponse.json(preferences);
}

/** PATCH /api/user/notification-preferences — Update supplied event preferences only. */
export async function PATCH(request: Request) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const jsonBody = await readJsonBody(request);
  if (!jsonBody.ok) return jsonBody.response;

  const parsed = notificationPreferenceSchema.safeParse(jsonBody.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid notification preferences", details: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }

  const preferences = await prisma.notificationPreference.upsert({
    where: { userId: result.session.user.id },
    update: parsed.data,
    create: { userId: result.session.user.id, ...defaultPreferences, ...parsed.data },
    select: preferenceSelection,
  });

  return NextResponse.json(preferences);
}
