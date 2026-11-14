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

/** The schema command the operator asked for, after flags are read off. */
type SchemaCommand =
  | { readonly name: "db-push"; readonly forceReset: boolean }
  | { readonly name: "migrate-deploy" }
  | { readonly name: "migrate-reset" }
  | { readonly name: "unrecognised" };

/**
 * Drops the guard's own flag and a leading `prisma`, leaving the command words.
 *
 * `--export-file` belongs to this guard, not to Prisma. Skipping a leading
 * `prisma` makes `prisma migrate reset` and `migrate reset` the same request.
 *
 * @param argv - Arguments after `pnpm db:production-schema --`.
 * @returns The words that name the Prisma command, flags included.
 */
function commandWords(argv: readonly string[]): readonly string[] {
  const words: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] ?? "";
    if (token === "--export-file") {
      index += 1;
      continue;
    }
    if (token.startsWith("--export-file=")) continue;
    if (token === "prisma" || token === "npx") continue;
    words.push(token);
  }
  return words;
}

/**
 * Reads the schema command out of the arguments that follow the script name.
 *
 * @param argv - Arguments after `pnpm db:production-schema --`.
 * @returns The command. Unknown words stay `unrecognised` rather than a guess.
 */
function parseSchemaCommand(argv: readonly string[]): SchemaCommand {
  const words = commandWords(argv);
  const forceReset = words.includes("--force-reset");
  const positional = words.filter((word) => !word.startsWith("--"));
  const [first, second] = positional;
  if (positional.length !== 2) return { name: "unrecognised" };
  if (first === "db" && second === "push") return { name: "db-push", forceReset };
  if (first === "migrate" && second === "deploy") return { name: "migrate-deploy" };
  if (first === "migrate" && second === "reset") return { name: "migrate-reset" };
  return { name: "unrecognised" };
}

/**
 * Whether this command drops the database.
 *
 * `db push` without `--force-reset` does not. An export file does not change
 * the answer: a reset of production stays a reset.
 *
 * @param command - The parsed command.
 * @returns True for `migrate reset` and `db push --force-reset`.
 */
function isDestructiveReset(command: SchemaCommand): boolean {
  switch (command.name) {
    case "migrate-reset":
      return true;
    case "db-push":
      return command.forceReset;
    case "migrate-deploy":
    case "unrecognised":
      return false;
    default: {
      const unreachable: never = command;
      return unreachable;
    }
  }
}

/**
 * The Prisma invocation for an allowed command.
 *
 * Built from the parsed command, never from the raw arguments, so a flag the
 * guard did not accept cannot be forwarded. The database URL stays in the
 * environment.
 *
 * @param command - A command `parseSchemaCommand` recognised.
 * @returns The argv a shell may execute.
 */
function prismaArgv(command: Exclude<SchemaCommand, { readonly name: "unrecognised" }>): readonly string[] {
  switch (command.name) {
    case "db-push":
      return command.forceReset
        ? ["npx", "prisma", "db", "push", "--force-reset"]
        : ["npx", "prisma", "db", "push"];
    case "migrate-deploy":
      return ["npx", "prisma", "migrate", "deploy"];
    case "migrate-reset":
      return ["npx", "prisma", "migrate", "reset", "--force"];
    default: {
      const unreachable: never = command;
      return unreachable;
    }
  }
}

/**
 * Decides whether a reset may run, and which Prisma argv an allowed command uses.
 *
 * On a production host both `db push --force-reset` and `migrate reset` are
 * refused, including when an export file was passed. An allowed command's
 * argv comes from the parsed command. Requiring an export before a production
 * schema change is not decided here yet.
 *
 * @param input.databaseUrl - The URL to classify. It is not copied into the plan.
 * @param input.argv - The operator's arguments.
 * @param input.exportFileBytes - Present so a later rule can require an export.
 *   This rule ignores it.
 * @returns Refuse for a production reset, otherwise the Prisma argv to run.
 */
export function planSchemaCommand(input: {
  readonly databaseUrl: string | undefined;
  readonly argv: readonly string[];
  readonly exportFileBytes: number | null;
}): SchemaCommandPlan {
  const host = readDatabaseHost(input.databaseUrl);
  const command = parseSchemaCommand(input.argv);
  if (host.ok && host.host.kind === "production" && isDestructiveReset(command)) {
    return {
      outcome: "refuse",
      code: "destructive-on-production",
      message: DESTRUCTIVE_ON_PRODUCTION,
    };
  }

  if (command.name === "unrecognised") {
    return { outcome: "allow", argv: ["npx", "prisma", "db", "push"] };
  }

  return { outcome: "allow", argv: prismaArgv(command) };
}
