/**
 * `GET /api/user/export`: everything tied to the signed-in account, as one
 * JSON file to download (I-38 requirement 7; GDPR Art. 15 access and Art. 20
 * portability). The archive's contract is `accountArchiveSchema`, documented
 * in `docs/engineering/account-export.md`.
 *
 * Identity context. Session only (`requireAuth`): the archive is the caller's
 * own. Free on every plan, so no plan check (I-38 requirement 10.1). Rate
 * limited against abuse only, once an hour per account (requirement 7.3). The
 * request log line carries the status and duration, never the account's data.
 *
 * @module api/user/export
 */
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { exportAccount } from "@/lib/account-export/export-account";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  jsonError,
  logRouteFailure,
  rateLimitResponse,
  withRequestLog,
} from "@/lib/api/route-kit";

const CONTEXT = "GET /api/user/export";

/** One export per account per window (I-38 requirement 7.3: "for example once an hour"). */
const EXPORTS_PER_WINDOW = 1;
const EXPORT_WINDOW_MS = 60 * 60 * 1000;

/** GET /api/user/export — download the caller's account archive. */
export async function GET() {
  return withRequestLog(
    { message: "Account export request completed", context: CONTEXT },
    answerExport
  );
}

async function answerExport(): Promise<NextResponse> {
  const result = await requireAuth();
  if (result.error) return result.error;
  const userId = result.session.user.id;

  const budget = checkRateLimit(
    `account-export:${userId}`,
    EXPORTS_PER_WINDOW,
    EXPORT_WINDOW_MS
  );
  if (!budget.allowed) {
    return rateLimitResponse(budget, "Too many exports. Try again later.");
  }

  try {
    const now = new Date();
    const archive = await exportAccount(userId, now);
    if (archive === null) return jsonError(401, "Unauthorized");
    return new NextResponse(JSON.stringify(archive), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${archiveFileName(now)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logRouteFailure(error, CONTEXT);
    return jsonError(500, "Failed to export account");
  }
}

/** @returns the download's file name, dated by the export's UTC day */
function archiveFileName(now: Date): string {
  return `magicaibuilder-account-${now.toISOString().slice(0, 10)}.json`;
}
