/**
 * Public profile endpoint.
 *
 * GET — the profile behind a username, with its public decks, follow counts,
 * the viewer's own follow state and badges. No session required. The read is
 * `findPublicProfile` in `@/lib/social/public-profile-lookup`, shared with the
 * profile page; this module keeps the HTTP concerns: the username check, the
 * status codes and the request log.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import { isUsername } from "@/lib/social/public-profile";
import { findPublicProfile } from "@/lib/social/public-profile-lookup";

type Params = { params: Promise<{ username: string }> };

/**
 * Records the outcome and latency of a public-profile request.
 *
 * @param status HTTP status returned to the caller.
 * @param startedAt `performance.now()` value captured when the request began.
 * @returns Nothing; writes one structured info log line.
 */
function logPublicProfileRequest(status: number, startedAt: number): void {
  logger.info("Public profile request completed", "GET /api/users/:username", {
    status,
    durationMs: Math.round(performance.now() - startedAt),
  });
}

// GET /api/users/[username] — public profile (no auth required)
export async function GET(_req: Request, { params }: Params) {
  const startedAt = performance.now();
  let status = 500;
  const { username } = await params;

  if (!isUsername(username)) {
    status = 400;
    logPublicProfileRequest(status, startedAt);
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    const session = await auth();
    const profile = await findPublicProfile(
      username,
      session?.user?.id ?? null
    );

    if (!profile) {
      status = 404;
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    status = 200;
    return NextResponse.json(profile);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/users/:username",
      { username }
    );
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  } finally {
    if (status !== 400) logPublicProfileRequest(status, startedAt);
  }
}
