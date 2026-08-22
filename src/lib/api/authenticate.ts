/**
 * Bearer-key authentication for `/api/v1/*`.
 *
 * Separate from `requireAuth` on purpose. The session helper answers "is a
 * browser signed in", reading a NextAuth cookie; this answers "is this machine
 * holding a valid key", reading an `Authorization` header. Sharing one helper
 * would mean a cookie could authenticate the public API and a key could
 * authenticate the app — two different trust boundaries, silently merged, and
 * the API would inherit the app's CSRF surface for free.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  hasScope,
  hashApiKey,
  isWellFormedApiKey,
  parseBearerToken,
  parseScopes,
  type ApiScope,
} from "./keys";

/** Requests per key per window. */
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;

/**
 * How stale `lastUsedAt` may get before it is rewritten.
 *
 * Writing it on every call would turn a read-only API into one write per
 * request. An hour's resolution answers the question the field exists for —
 * "is this key still in use, can I revoke it" — at a fraction of the cost.
 */
const LAST_USED_RESOLUTION_MS = 60 * 60 * 1000;

export interface ApiCaller {
  readonly userId: string;
  readonly keyId: string;
  readonly scopes: readonly ApiScope[];
}

export type ApiAuthResult =
  | { readonly ok: true; readonly caller: ApiCaller }
  | { readonly ok: false; readonly response: NextResponse };

/** Machine-readable error codes, so a client can branch without parsing prose. */
export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "invalid_request"
  | "server_error";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  rate_limited: 429,
  invalid_request: 400,
  server_error: 500,
};

/**
 * The single error shape every `/api/v1` route returns.
 *
 * One envelope from the first endpoint, because a public API's error format is
 * as much a contract as its success format — changing it later breaks callers
 * exactly as hard as renaming a field.
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status: STATUS_BY_CODE[code], headers }
  );
}

function unauthorized(message: string): NextResponse {
  return apiError("unauthorized", message, {
    "WWW-Authenticate": 'Bearer realm="MagicAIBuilder API"',
  });
}

/**
 * Rewrite `lastUsedAt` only once it has gone stale.
 *
 * Never throws and is awaited by the caller: on a serverless runtime a detached
 * promise can be frozen with the response, so it would land or not at random.
 */
async function touchKey(keyId: string, lastUsedAt: Date | null, now: Date): Promise<void> {
  if (lastUsedAt && now.getTime() - lastUsedAt.getTime() < LAST_USED_RESOLUTION_MS) {
    return;
  }
  try {
    await prisma.apiKey.update({ where: { id: keyId }, data: { lastUsedAt: now } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "lastUsedAt write failed";
    logger.error(message, "touchKey", { keyId });
  }
}

/**
 * Resolve a request's API key to its owner.
 *
 * Every rejection below the header check returns the same "Invalid API key"
 * text. A revoked key, an expired key and a key that never existed are
 * different facts, and telling them apart would confirm to a holder of a
 * cancelled credential that it was once real — and to anyone guessing, which
 * guesses landed on a row.
 */
export async function authenticateApiKey(request: Request): Promise<ApiAuthResult> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) {
    return {
      ok: false,
      response: unauthorized("Missing Authorization: Bearer <key> header"),
    };
  }

  // Shape-checked before the database is touched, so junk costs no queries.
  if (!isWellFormedApiKey(token)) {
    return { ok: false, response: unauthorized("Invalid API key") };
  }

  let key: {
    id: string;
    userId: string;
    scopes: string[];
    revokedAt: Date | null;
    expiresAt: Date | null;
    lastUsedAt: Date | null;
  } | null;

  try {
    key = await prisma.apiKey.findUnique({
      where: { tokenHash: hashApiKey(token) },
      select: {
        id: true,
        userId: true,
        scopes: true,
        revokedAt: true,
        expiresAt: true,
        lastUsedAt: true,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "API key lookup failed";
    logger.error(message, "authenticateApiKey");
    return {
      ok: false,
      response: apiError("server_error", "Could not verify the API key"),
    };
  }

  const now = new Date();
  if (!key || key.revokedAt !== null || (key.expiresAt !== null && key.expiresAt <= now)) {
    return { ok: false, response: unauthorized("Invalid API key") };
  }

  // Keyed on the key and not the IP: the quota belongs to the credential, so
  // one caller cannot spend another's by sharing an egress address, and moving
  // between addresses does not reset it.
  const rl = checkRateLimit(`api-key:${key.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    const retrySec = Math.ceil(rl.retryAfterMs / 1000);
    return {
      ok: false,
      response: apiError("rate_limited", `Too many requests. Retry in ${retrySec}s.`, {
        "Retry-After": String(retrySec),
      }),
    };
  }

  await touchKey(key.id, key.lastUsedAt, now);

  return {
    ok: true,
    caller: { userId: key.userId, keyId: key.id, scopes: parseScopes(key.scopes) },
  };
}

/**
 * Authenticate and check one scope in a single step.
 *
 * A missing scope is 403 and not 401: the credential is valid, so inviting the
 * client to re-authenticate would send it round a loop it cannot win.
 */
export async function requireApiScope(
  request: Request,
  scope: ApiScope
): Promise<ApiAuthResult> {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth;

  if (!hasScope(auth.caller.scopes, scope)) {
    return {
      ok: false,
      response: apiError("forbidden", `This key is missing the "${scope}" scope`),
    };
  }

  return auth;
}
