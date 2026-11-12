import { describe, expect, it, vi } from "vitest";
import { createOnce } from "./create-once";

const uniqueViolation = Object.assign(new Error("Unique constraint failed"), {
  code: "P2002",
});

describe("createOnce", () => {
  it("returns the earlier row without writing", async () => {
    const create = vi.fn();

    const result = await createOnce({
      findExisting: () => Promise.resolve("earlier"),
      create,
    });

    expect(result).toEqual({ row: "earlier", created: false });
    expect(create).not.toHaveBeenCalled();
  });

  it("writes when no earlier row exists", async () => {
    const result = await createOnce({
      findExisting: () => Promise.resolve(null),
      create: () => Promise.resolve("new"),
    });

    expect(result).toEqual({ row: "new", created: true });
  });

  it("returns the winner's row when a concurrent write took the key first", async () => {
    const findExisting = vi
      .fn<() => Promise<string | null>>()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("winner");

    const result = await createOnce({
      findExisting,
      create: () => Promise.reject(uniqueViolation),
    });

    expect(result).toEqual({ row: "winner", created: false });
  });

  it("rethrows any other write failure", async () => {
    const outage = new Error("connect ECONNREFUSED");

    await expect(
      createOnce({
        findExisting: () => Promise.resolve(null),
        create: () => Promise.reject(outage),
      })
    ).rejects.toBe(outage);
  });

  it("rethrows a unique violation that left no row behind", async () => {
    await expect(
      createOnce({
        findExisting: () => Promise.resolve(null),
        create: () => Promise.reject(uniqueViolation),
      })
    ).rejects.toBe(uniqueViolation);
  });
});
