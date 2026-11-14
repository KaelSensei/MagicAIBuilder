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
});
