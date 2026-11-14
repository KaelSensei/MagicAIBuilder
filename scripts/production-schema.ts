/**
 * `pnpm db:production-schema` — the only supported production schema change.
 *
 * I-71 slice 1. Production on Supabase Free keeps no backups
 * (https://supabase.com/pricing, read 2026-11-10). This script asks
 * `planSchemaCommand` and runs Prisma only when that plan allows it. A
 * refusal is one line on stderr and does not include `DATABASE_URL`.
 * Encryption and the daily off-site copy are I-71 slice 2.
 *
 * @module scripts/production-schema
 */
import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";
import { planSchemaCommand } from "../src/lib/operations/schema-command-guard";

/**
 * The path passed as `--export-file`, if the operator gave one.
 *
 * @param argv - Arguments after the script name.
 * @returns The path, or null when the flag is absent or has no value.
 */
export function exportFileFromArgv(argv: readonly string[]): string | null {
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] ?? "";
    if (token.startsWith("--export-file=")) {
      const value = token.slice("--export-file=".length);
      return value === "" ? null : value;
    }
    if (token !== "--export-file") continue;
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) return null;
    return next;
  }
  return null;
}

/**
 * The size of an on-demand export, or null when it cannot be read.
 *
 * A directory, a missing path and an unreadable path are all "no export".
 * Zero bytes is returned as zero, which the guard also rejects.
 *
 * @param path - The path from `--export-file`, or null when the flag is absent.
 * @returns The file size in bytes, or null.
 */
export function readExportFileBytes(path: string | null): number | null {
  if (path === null) return null;
  try {
    const stat = statSync(path);
    return stat.isFile() ? stat.size : null;
  } catch {
    return null;
  }
}

/**
 * Applies the guard and, only on allow, runs the planned argv.
 *
 * @param input.argv - The operator's arguments, including `--export-file`.
 * @param input.databaseUrl - `DATABASE_URL`. It is not written to the refusal.
 * @param input.exportFileBytes - Size from `readExportFileBytes`.
 * @param input.run - Executes the planned argv and returns its status. Tests
 *   pass a recorder; the script passes Prisma.
 * @param input.writeError - Receives the refusal line.
 * @returns 1 when the guard refuses, otherwise the runner's status.
 */
export function runProductionSchema(input: {
  readonly argv: readonly string[];
  readonly databaseUrl: string | undefined;
  readonly exportFileBytes: number | null;
  readonly run: (argv: readonly string[]) => number;
  readonly writeError: (line: string) => void;
}): number {
  const plan = planSchemaCommand({
    databaseUrl: input.databaseUrl,
    argv: input.argv,
    exportFileBytes: input.exportFileBytes,
  });
  if (plan.outcome === "refuse") {
    input.writeError(plan.message);
    return 1;
  }
  return input.run(plan.argv);
}

/**
 * Runs the planned Prisma command with the current environment.
 *
 * The URL stays in the environment. It is not placed on the command line.
 *
 * @param argv - The argv from an allowed plan. The first word is the binary.
 * @returns The child status, or 1 when the binary is missing or fails to spawn.
 */
function runPrisma(argv: readonly string[]): number {
  const [bin, ...args] = argv;
  if (bin === undefined) return 1;
  const result = spawnSync(bin, [...args], { stdio: "inherit", env: process.env });
  if (result.error) {
    process.stderr.write(`${result.error.message}\n`);
    return 1;
  }
  return result.status ?? 1;
}

/**
 * The script entry. Reads `DATABASE_URL` and the export file, then decides.
 *
 * @returns The process status.
 */
function main(): number {
  const argv = process.argv.slice(2);
  return runProductionSchema({
    argv,
    databaseUrl: process.env.DATABASE_URL,
    exportFileBytes: readExportFileBytes(exportFileFromArgv(argv)),
    run: runPrisma,
    writeError: (line) => {
      process.stderr.write(`${line}\n`);
    },
  });
}

const entry = process.argv[1];
if (
  entry !== undefined &&
  (entry.endsWith("production-schema.ts") || entry.endsWith("production-schema.js"))
) {
  process.exit(main());
}
