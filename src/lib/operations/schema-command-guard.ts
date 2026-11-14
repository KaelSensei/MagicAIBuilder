/**
 * Whether a Prisma schema command may run against the database in `DATABASE_URL`.
 *
 * I-71 slice 1. Production on Supabase Free keeps no backups
 * (https://supabase.com/pricing, read 2026-11-10), and a reset drops every
 * table. This module decides; the script that runs Prisma is separate. A
 * decision never includes the URL, so a refusal cannot leak a password.
 *
 * A host is production when it is not one of the local development names.
 * Anything else, including Supabase and Neon, is treated as production so a
 * remote URL cannot be reset by mistake.
 *
 * @module operations/schema-command-guard
 */

/** Hosts that a local reset is allowed to wipe. Docker Compose uses `postgres`. */
const LOCAL_DATABASE_HOSTS: ReadonlySet<string> = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "postgres",
  "host.docker.internal",
]);

const DESTRUCTIVE_ON_PRODUCTION =
  "Refusing to reset a production database. This command drops every table, and Supabase Free keeps no backup.";

/** A database host classified for the guard. The hostname is not a secret. */
export type DatabaseHost = {
  readonly kind: "local" | "production";
  readonly hostname: string;
};

/** Why a URL cannot be classified. The URL itself is not part of the result. */
export type DatabaseUrlFailure = "missing" | "not-a-url";

/** The guard's answer. An allowed `argv` never contains the database URL. */
export type SchemaCommandPlan =
  | { readonly outcome: "allow"; readonly argv: readonly string[] }
  | {
      readonly outcome: "refuse";
      readonly code: "destructive-on-production";
      readonly message: string;
    };

/**
 * Classifies the host of a Postgres URL.
 *
 * @param databaseUrl - `DATABASE_URL`, which may be absent. A password in it
 *   is ignored and is not returned.
 * @returns The host kind, or why the URL could not be read.
 */
export function readDatabaseHost(
  databaseUrl: string | undefined
):
  | { readonly ok: true; readonly host: DatabaseHost }
  | { readonly ok: false; readonly reason: DatabaseUrlFailure } {
  if (databaseUrl === undefined || databaseUrl.trim() === "") {
    return { ok: false, reason: "missing" };
  }

  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    return { ok: false, reason: "not-a-url" };
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    return { ok: false, reason: "not-a-url" };
  }

  const hostname = url.hostname.replaceAll("[", "").replaceAll("]", "").toLowerCase();
  if (hostname === "") return { ok: false, reason: "not-a-url" };

  return {
    ok: true,
    host: {
      kind: LOCAL_DATABASE_HOSTS.has(hostname) ? "local" : "production",
      hostname,
    },
  };
}

/**
 * Decides whether `db push --force-reset` may run.
 *
 * On a production host the answer is refuse, including when an export file
 * was passed: an export does not make a reset safe. Other commands are not
 * decided here yet.
 *
 * @param input.databaseUrl - The URL to classify. It is not copied into the plan.
 * @param input.argv - The operator's arguments.
 * @param input.exportFileBytes - Present so a later rule can require an export.
 *   This rule ignores it.
 * @returns Refuse for a production reset, otherwise allow a non-reset push.
 */
export function planSchemaCommand(input: {
  readonly databaseUrl: string | undefined;
  readonly argv: readonly string[];
  readonly exportFileBytes: number | null;
}): SchemaCommandPlan {
  const host = readDatabaseHost(input.databaseUrl);
  const forceReset = input.argv.includes("--force-reset");
  if (host.ok && host.host.kind === "production" && forceReset) {
    return {
      outcome: "refuse",
      code: "destructive-on-production",
      message: DESTRUCTIVE_ON_PRODUCTION,
    };
  }

  return { outcome: "allow", argv: ["npx", "prisma", "db", "push"] };
}
