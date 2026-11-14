/**
 * The production schema script refuses a reset and does not run Prisma then.
 *
 * I-71 slice 1. The decision is `planSchemaCommand`; this file checks that
 * the script reports the refusal and does not call the runner.
 */
import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  exportFileFromArgv,
  readExportFileBytes,
  runProductionSchema,
} from "./production-schema";

const PRODUCTION_URL =
  "postgresql://app:secret-password@db.example.supabase.co:5432/postgres";

describe("runProductionSchema", () => {
  it("does not run Prisma when the database is production and the command resets it", () => {
    const ran: string[][] = [];
    const errors: string[] = [];

    const code = runProductionSchema({
      argv: ["db", "push", "--force-reset"],
      databaseUrl: PRODUCTION_URL,
      exportFileBytes: 4_096,
      run: (argv) => {
        ran.push([...argv]);
        return 0;
      },
      writeError: (line) => {
        errors.push(line);
      },
    });

    expect(code).toBe(1);
    expect(ran).toEqual([]);
    expect(errors).toEqual([
      "Refusing to reset a production database. This command drops every table, and Supabase Free keeps no backup.",
    ]);
    expect(errors.join("\n")).not.toContain("secret-password");
  });

  it("runs migrate deploy when the export file is non-empty and returns the runner's status", () => {
    const ran: string[][] = [];

    const code = runProductionSchema({
      argv: ["migrate", "deploy", "--export-file", "decks.dump"],
      databaseUrl: PRODUCTION_URL,
      exportFileBytes: 4_096,
      run: (argv) => {
        ran.push([...argv]);
        return 0;
      },
      writeError: () => {
        throw new Error("a refusal was not expected");
      },
    });

    expect(code).toBe(0);
    expect(ran).toEqual([["npx", "prisma", "migrate", "deploy"]]);
  });
});

describe("the export file", () => {
  it("reads a non-empty dump and treats a missing path as no export", () => {
    const directory = mkdtempSync(join(tmpdir(), "schema-export-"));
    const dump = join(directory, "decks.dump");
    writeFileSync(dump, "not a real dump");

    expect(exportFileFromArgv(["--export-file", dump, "migrate", "deploy"])).toBe(dump);
    expect(readExportFileBytes(dump)).toBeGreaterThan(0);
    expect(exportFileFromArgv(["migrate", "deploy"])).toBeNull();
    expect(readExportFileBytes(null)).toBeNull();
    expect(readExportFileBytes(join(directory, "missing.dump"))).toBeNull();
  });
});
