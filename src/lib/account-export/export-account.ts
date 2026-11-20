/**
 * The account export use case: read everything tied to one account and turn
 * it into the published archive (I-38 requirement 7).
 *
 * Identity context, server entry. The route answers with what this returns;
 * it owns the session, the rate limit and the response headers.
 *
 * @module account-export/export-account
 */
import "server-only";
import type { AccountArchive } from "./archive-schema";
import { buildAccountArchive } from "./build-account-archive";
import { readAccountRows } from "./prisma-account-rows";

/**
 * Exports one account.
 *
 * @param userId - The signed-in account's id.
 * @param now - When the export runs; written as the archive's `generatedAt`.
 * @returns The archive, or null when no account has this id.
 * @throws Whatever the database read throws; the route answers 500.
 */
export async function exportAccount(
  userId: string,
  now: Date
): Promise<AccountArchive | null> {
  const rows = await readAccountRows(userId);
  return rows === null ? null : buildAccountArchive(rows, now);
}
