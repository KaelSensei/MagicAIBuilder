import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { readJsonBody } from "@/lib/api/json-body";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

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

/**
 * Logs a database failure under the route's name and answers the standard
 * JSON 500 body, so a failed read or write never escapes as Next's HTML error
 * page (B2-13).
 *
 * @param error - whatever Prisma threw; an `Error` keeps its stack for Sentry
 * @param route - the handler's name, e.g. `"GET /api/user/notification-preferences"`
 * @param message - the body's `error` string
 */
function databaseFailure(
  error: unknown,
  route: string,
  message: string
): NextResponse {
  logger.error(error instanceof Error ? error : String(error), route);
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * GET /api/user/notification-preferences — Get the current user's event preferences.
 *
 * Reads through an upsert, so a player who has no row yet gets the defaults
 * written on first read.
 */
export async function GET() {
  const result = await requireAuth();
  if (result.error) return result.error;

  try {
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: result.session.user.id },
      update: {},
      create: { userId: result.session.user.id, ...defaultPreferences },
      select: preferenceSelection,
    });
    return NextResponse.json(preferences);
  } catch (error) {
    return databaseFailure(
      error,
      "GET /api/user/notification-preferences",
      "Failed to load notification preferences"
    );
  }
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

  try {
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: result.session.user.id },
      update: parsed.data,
      create: { userId: result.session.user.id, ...defaultPreferences, ...parsed.data },
      select: preferenceSelection,
    });
    return NextResponse.json(preferences);
  } catch (error) {
    return databaseFailure(
      error,
      "PATCH /api/user/notification-preferences",
      "Failed to save notification preferences"
    );
  }
}
