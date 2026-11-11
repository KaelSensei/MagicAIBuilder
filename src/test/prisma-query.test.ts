// @vitest-environment node
/**
 * Pins `prismaQuery`, which lets an in-memory fake answer a Prisma call
 * without an `async` function that awaits nothing (SonarCloud S7503).
 */
import { describe, expect, it } from "vitest";
import { prismaQuery } from "./prisma-query";

describe("prismaQuery", () => {
  it("resolves with what the query body returns", async () => {
    await expect(prismaQuery(() => ({ count: 1 }))).resolves.toEqual({
      count: 1,
    });
  });

  it("rejects with what the query body throws, and does not throw at the call, as a Prisma client call does", async () => {
    let settled: Promise<unknown> = Promise.resolve();

    expect(() => {
      settled = prismaQuery(() => {
        throw new Error("Record to update not found.");
      });
    }).not.toThrow();
    await expect(settled).rejects.toThrow("Record to update not found.");
  });

  it("runs the query body during the call, so a write lands before the caller awaits", () => {
    const writes: string[] = [];

    void prismaQuery(() => writes.push("card"));

    expect(writes).toEqual(["card"]);
  });
});
