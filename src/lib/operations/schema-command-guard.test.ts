/**
 * I-71 slice 1: a production schema change must not reset the database.
 *
 * Supabase Free keeps no backups (https://supabase.com/pricing, read
 * 2026-11-10). `docs/engineering/infrastructure.md` used to print
 * `prisma db push --force-reset` against that host. These tests pin the
 * guard that replaced that recipe. They do not open a database.
 */
import { describe, expect, it } from "vitest";
import { planSchemaCommand } from "@/lib/operations/schema-command-guard";

const PRODUCTION_URL =
  "postgresql://app:secret-password@db.example.supabase.co:5432/postgres";

describe("planSchemaCommand", () => {
  it("refuses to reset a production database with db push --force-reset", () => {
    const plan = planSchemaCommand({
      databaseUrl: PRODUCTION_URL,
      argv: ["db", "push", "--force-reset"],
      exportFileBytes: 4_096,
    });

    expect(plan).toEqual({
      outcome: "refuse",
      code: "destructive-on-production",
      message:
        "Refusing to reset a production database. This command drops every table, and Supabase Free keeps no backup.",
    });
    expect(JSON.stringify(plan)).not.toContain("secret-password");
  });

  it("refuses migrate reset on a production host even after an export", () => {
    const plan = planSchemaCommand({
      databaseUrl: PRODUCTION_URL,
      argv: ["migrate", "reset"],
      exportFileBytes: 4_096,
    });

    expect(plan).toEqual({
      outcome: "refuse",
      code: "destructive-on-production",
      message:
        "Refusing to reset a production database. This command drops every table, and Supabase Free keeps no backup.",
    });
  });

  it("allows a local reset and runs prisma db push --force-reset", () => {
    const plan = planSchemaCommand({
      databaseUrl: "postgresql://app:secret-password@localhost:5432/postgres",
      argv: ["db", "push", "--force-reset"],
      exportFileBytes: null,
    });

    expect(plan).toEqual({
      outcome: "allow",
      argv: ["npx", "prisma", "db", "push", "--force-reset"],
    });
    expect(JSON.stringify(plan)).not.toContain("secret-password");
  });

  it("refuses a production schema change until a non-empty export exists", () => {
    const missing = planSchemaCommand({
      databaseUrl: PRODUCTION_URL,
      argv: ["migrate", "deploy"],
      exportFileBytes: null,
    });
    const empty = planSchemaCommand({
      databaseUrl: PRODUCTION_URL,
      argv: ["db", "push"],
      exportFileBytes: 0,
    });
    const refusal = {
      outcome: "refuse",
      code: "export-required",
      message:
        "Refusing a production schema change until an on-demand export exists. Pass --export-file pointing at a non-empty dump. See docs/engineering/infrastructure.md.",
    };

    expect(missing).toEqual(refusal);
    expect(empty).toEqual(refusal);
  });

  it("refuses to run when DATABASE_URL is missing or not a postgres URL", () => {
    const missing = planSchemaCommand({
      databaseUrl: undefined,
      argv: ["migrate", "deploy"],
      exportFileBytes: 4_096,
    });
    const notPostgres = planSchemaCommand({
      databaseUrl: "https://user:secret-password@db.example.supabase.co/postgres",
      argv: ["migrate", "deploy"],
      exportFileBytes: 4_096,
    });
    const refusal = {
      outcome: "refuse",
      code: "unreadable-database-url",
      message:
        "Refusing to run: DATABASE_URL is missing or is not a postgres URL. Nothing was changed.",
    };

    expect(missing).toEqual(refusal);
    expect(notPostgres).toEqual(refusal);
    expect(JSON.stringify(notPostgres)).not.toContain("secret-password");
  });

  it("runs migrate deploy on production once the export file has bytes", () => {
    const plan = planSchemaCommand({
      databaseUrl: PRODUCTION_URL,
      argv: ["--export-file", "decks.dump", "migrate", "deploy"],
      exportFileBytes: 4_096,
    });

    expect(plan).toEqual({
      outcome: "allow",
      argv: ["npx", "prisma", "migrate", "deploy"],
    });
  });

  it("refuses a command it does not recognise instead of guessing a push", () => {
    const plan = planSchemaCommand({
      databaseUrl: "postgresql://app:secret-password@localhost:5432/postgres",
      argv: ["db", "push", "--accept-data-loss"],
      exportFileBytes: null,
    });

    expect(plan).toEqual({
      outcome: "refuse",
      code: "unrecognised-command",
      message:
        "Refusing to run: the command is not migrate deploy, db push, or migrate reset. Nothing was changed.",
    });
  });
});
