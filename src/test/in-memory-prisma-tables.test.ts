// @vitest-environment node
/**
 * The in-memory database answers the way Prisma would for the reads it
 * supports, and refuses the ones it cannot answer faithfully.
 */
import { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  inMemoryPrisma,
  type InMemoryTables,
  type TableRead,
} from "./in-memory-prisma-tables";

const tables: InMemoryTables = new Map([
  [
    "deck",
    [
      { id: "deck-1", userId: "player-1", name: "Mine", shareToken: "secret" },
      { id: "deck-2", userId: "player-2", name: "Theirs", shareToken: null },
      { id: "deck-3", userId: "player-1", name: "Also mine", shareToken: null },
    ],
  ],
]);

const { prisma } = inMemoryPrisma({ prisma: new PrismaClient() }, tables);

describe("the in-memory Prisma tables", () => {
  it("returns only the rows whose columns equal the where", async () => {
    const rows = await prisma.deck.findMany({ where: { userId: "player-1" } });

    expect(rows.map((row) => row.id)).toEqual(["deck-1", "deck-3"]);
  });

  it("matches a column against an in list", async () => {
    const rows = await prisma.deck.findMany({
      where: { id: { in: ["deck-2", "deck-3"] } },
    });

    expect(rows.map((row) => row.id)).toEqual(["deck-2", "deck-3"]);
  });

  it("keeps a row that passes any branch of an OR next to the other columns", async () => {
    const rows = await prisma.deck.findMany({
      where: {
        userId: "player-1",
        OR: [{ name: "Mine" }, { shareToken: null }],
      },
    });

    expect(rows.map((row) => row.id)).toEqual(["deck-1", "deck-3"]);
  });

  it("reports the table and the rows each read returned", async () => {
    const reads: TableRead[] = [];
    const logged = inMemoryPrisma(
      { prisma: new PrismaClient() },
      tables,
      (read) => reads.push(read)
    ).prisma;

    await logged.deck.findMany({
      where: { userId: "player-2" },
      select: { id: true },
    });
    await logged.deck.findUnique({ where: { id: "missing" } });

    expect(reads).toEqual([
      { table: "deck", rows: [{ id: "deck-2" }] },
      { table: "deck", rows: [] },
    ]);
  });

  it("returns only the selected columns", async () => {
    const row = await prisma.deck.findUnique({
      where: { id: "deck-1" },
      select: { id: true, name: true },
    });

    expect(row).toEqual({ id: "deck-1", name: "Mine" });
  });

  it("answers null when no row matches, and an empty list for a table never seeded", async () => {
    expect(
      await prisma.deck.findFirst({ where: { id: "missing" } })
    ).toBeNull();
    expect(await prisma.userFollow.findMany({})).toEqual([]);
  });

  it("rejects a filter or a nested select it cannot answer faithfully", async () => {
    await expect(
      prisma.deck.findMany({ where: { name: { contains: "Mine" } } })
    ).rejects.toThrow(/unsupported filter/);
    await expect(
      prisma.deck.findMany({ select: { cards: { select: { name: true } } } })
    ).rejects.toThrow(/only flat selects/);
  });
});
