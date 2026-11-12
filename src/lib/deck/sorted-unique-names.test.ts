import { describe, expect, it } from "vitest";
import { sortedUniqueNames } from "@/lib/deck/sorted-unique-names";

describe("sortedUniqueNames", () => {
  it("names each card once and orders names case-insensitively", () => {
    const names = ["sol Ring", "Arcane Signet", "sol Ring", "Brainstorm"];

    expect(sortedUniqueNames(names)).toEqual([
      "Arcane Signet",
      "Brainstorm",
      "sol Ring",
    ]);
  });

  it("orders the same names the same way whatever order the rows arrive in", () => {
    const shuffled = ["Brainstorm", "sol Ring", "Arcane Signet"];

    expect(sortedUniqueNames(shuffled)).toEqual([
      "Arcane Signet",
      "Brainstorm",
      "sol Ring",
    ]);
  });

  it("breaks a case-only tie deterministically", () => {
    expect(sortedUniqueNames(["sol ring", "Sol Ring"])).toEqual([
      "sol ring",
      "Sol Ring",
    ]);
    expect(sortedUniqueNames(["Sol Ring", "sol ring"])).toEqual([
      "sol ring",
      "Sol Ring",
    ]);
  });
});
