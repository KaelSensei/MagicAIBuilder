/**
 * Asks `GET /api/user/export` for the signed-in player's account archive and
 * turns the route's answer into what Settings → Account shows (I-38
 * requirement 7.1, slice 5).
 *
 * Browser only, and through the route only: the archive is built on the
 * server (`src/lib/account-export/*`), never here. Not responsible for saving
 * the file, which `downloadTextFile` does, or for the wording, which the
 * section takes from the catalogs.
 *
 * @module components/settings/account-archive-request
 */

const EXPORT_ENDPOINT = "/api/user/export";

/**
 * The name the file is saved under when the answer does not name one. The
 * route always names it (`magicaibuilder-account-YYYY-MM-DD.json`); this keeps
 * a proxy that drops the header from saving a file called "download".
 */
export const FALLBACK_ARCHIVE_FILE_NAME = "magicaibuilder-account.json";

/** What one request for the archive came to. */
export type ArchiveAnswer =
  | {
      readonly kind: "archive";
      readonly content: string;
      readonly fileName: string;
    }
  | {
      readonly kind: "rate-limited";
      /** Seconds until the next export is allowed, or `null` when the answer does not say. */
      readonly retryAfterSeconds: number | null;
    }
  | { readonly kind: "failed" };

const FAILED: ArchiveAnswer = { kind: "failed" };

/**
 * Requests the archive once.
 *
 * Never throws: a network failure, an unreadable body and any status other
 * than 200 or 429 come back as `failed`, so the caller shows one message and
 * a retry instead of a status code.
 *
 * @returns the archive's text and file name, the rate limit, or a failure
 */
export async function requestAccountArchive(): Promise<ArchiveAnswer> {
  const response = await fetch(EXPORT_ENDPOINT, { cache: "no-store" }).catch(
    () => null
  );
  if (response === null) return FAILED;
  if (response.status === 429) {
    return {
      kind: "rate-limited",
      retryAfterSeconds: retryAfterSeconds(response.headers.get("Retry-After")),
    };
  }
  if (!response.ok) return FAILED;
  const content = await response.text().catch(() => null);
  if (content === null) return FAILED;
  return {
    kind: "archive",
    content,
    fileName:
      attachmentFileName(response.headers.get("Content-Disposition")) ??
      FALLBACK_ARCHIVE_FILE_NAME,
  };
}

/**
 * Reads the delay of a `Retry-After` header in its delay-seconds form, the
 * one `rateLimitResponse` sends (`src/lib/api/route-kit.ts`). The HTTP-date
 * form (RFC 9110 §10.2.3, https://www.rfc-editor.org/rfc/rfc9110#section-10.2.3,
 * read 2026-11-20) is not sent by this app and reads as unknown.
 */
function retryAfterSeconds(header: string | null): number | null {
  if (header === null || !/^\d+$/.test(header.trim())) return null;
  const seconds = Number(header.trim());
  return seconds > 0 ? seconds : null;
}

/** Reads the quoted `filename` of a `Content-Disposition: attachment` header. */
function attachmentFileName(header: string | null): string | null {
  const match = header === null ? null : /filename="([^"]+)"/.exec(header);
  return match?.[1] ?? null;
}
