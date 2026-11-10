import { NextResponse } from "next/server";

/** The request header a client sets to make a create safe to repeat. */
export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";

/** Long enough not to collide by accident, short enough to index. */
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_.:-]{8,128}$/;

/** The key a request carried, or the 400 to return for a malformed one. */
export type IdempotencyKeyResult =
  | { readonly ok: true; readonly key: string | null }
  | { readonly ok: false; readonly response: NextResponse };

/**
 * Reads the optional `Idempotency-Key` header.
 *
 * Absent is fine: the request is then an ordinary create. Present but
 * malformed is refused rather than ignored, because a client that sent a key
 * expects a repeat to be safe, and silently dropping it would break that.
 *
 * @param request - the incoming request
 * @returns the key (or null), or a 400 response to return unchanged
 */
export function readIdempotencyKey(request: Request): IdempotencyKeyResult {
  const key = request.headers.get(IDEMPOTENCY_KEY_HEADER);
  if (key === null) return { ok: true, key: null };
  if (IDEMPOTENCY_KEY_PATTERN.test(key)) return { ok: true, key };
  return {
    ok: false,
    response: NextResponse.json(
      { error: "Invalid Idempotency-Key header" },
      { status: 400 }
    ),
  };
}
