import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "./prisma-errors";

describe("isUniqueViolation", () => {
  it("recognises a rejection carrying Prisma's unique-constraint code", () => {
    const error = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
    });

    expect(isUniqueViolation(error)).toBe(true);
  });

  it("recognises a plain object with the code, as the in-memory fakes throw", () => {
    expect(isUniqueViolation({ code: "P2002" })).toBe(true);
  });

  it("rejects another Prisma error code, such as a missing record", () => {
    expect(isUniqueViolation({ code: "P2025" })).toBe(false);
  });

  it("rejects an error without a code", () => {
    expect(isUniqueViolation(new Error("connection reset"))).toBe(false);
  });

  it.each([null, undefined, "P2002", 2002])(
    "rejects a rejection reason that is not an object: %s",
    (reason) => {
      expect(isUniqueViolation(reason)).toBe(false);
    }
  );
});
