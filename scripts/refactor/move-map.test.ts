// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mapMovedPath, originalPathOf, parseMoveMap } from "./move-map";

/** The validation errors for a map, or an empty list when it is accepted. */
function errorsOf(map: unknown): readonly string[] {
  const result = parseMoveMap(map);
  return result.ok ? [] : result.errors;
}

describe("parseMoveMap", () => {
  it("accepts the empty map that ships before the first move", () => {
    expect(parseMoveMap([])).toEqual({ ok: true, moves: [] });
  });

  it("accepts file and folder moves in order", () => {
    const map = [
      { from: "src/lib/combos", to: "src/modules/combos/domain" },
      { from: "src/lib/dice.ts", to: "src/modules/playtest/domain/dice.ts" },
    ];
    expect(parseMoveMap(map)).toEqual({ ok: true, moves: map });
  });

  it("rejects anything but a list of from and to strings", () => {
    expect(errorsOf({ from: "a", to: "b" })).not.toEqual([]);
    expect(errorsOf([{ from: "src/a.ts" }])).not.toEqual([]);
    expect(errorsOf([{ from: "src/a.ts", to: 3 }])).not.toEqual([]);
  });

  it("accepts an entry marked as a temporary re-export shim and keeps the mark", () => {
    const map = [
      { from: "src/lib/dice.ts", to: "src/modules/dice.ts", shim: true },
      { from: "src/lib/random.ts", to: "src/modules/random.ts", shim: false },
    ];
    expect(parseMoveMap(map)).toEqual({ ok: true, moves: map });
  });

  it("rejects a shim mark that is not a boolean", () => {
    expect(
      errorsOf([{ from: "src/a.ts", to: "src/b.ts", shim: "yes" }])
    ).toHaveLength(1);
  });

  it.each([
    ["an absolute path", "/src/a.ts"],
    ["a parent segment", "src/../a.ts"],
    ["a leading ./", "./src/a.ts"],
    ["a trailing slash", "src/lib/"],
    ["a backslash", "src\\a.ts"],
    ["an empty path", ""],
  ])(
    "rejects %s, since paths are POSIX and relative to the repository root",
    (_, path) => {
      expect(errorsOf([{ from: path, to: "src/b.ts" }])).toHaveLength(1);
      expect(errorsOf([{ from: "src/b.ts", to: path }])).toHaveLength(1);
    }
  );

  it("rejects a move onto itself or into its own folder, which a second run would repeat", () => {
    expect(errorsOf([{ from: "src/a.ts", to: "src/a.ts" }])).toHaveLength(1);
    expect(
      errorsOf([{ from: "src/lib/combos", to: "src/lib/combos/domain" }])
    ).toHaveLength(1);
  });

  it("rejects a destination that reuses or overlaps the source of an earlier move", () => {
    const map = [
      { from: "src/lib/dice.ts", to: "src/modules/dice.ts" },
      { from: "src/lib/random.ts", to: "src/lib/dice.ts" },
    ];
    expect(errorsOf(map)).toEqual([
      'moves[1]: "to" (src/lib/dice.ts) overlaps the "from" of moves[0] (src/lib/dice.ts); a second run would move it again',
    ]);
  });

  it("accepts a chain in which a later move takes an earlier destination further", () => {
    const map = [
      { from: "src/lib/dice.ts", to: "src/modules/dice.ts" },
      { from: "src/modules/dice.ts", to: "src/modules/playtest/dice.ts" },
    ];
    expect(errorsOf(map)).toEqual([]);
  });
});

describe("mapMovedPath", () => {
  const moves = [
    { from: "src/lib/combos", to: "src/modules/combos/domain" },
    { from: "src/lib/dice.ts", to: "src/modules/dice.ts" },
    { from: "src/modules/dice.ts", to: "src/modules/playtest/dice.ts" },
  ];

  it("maps a file inside a moved folder and leaves other paths alone", () => {
    expect(mapMovedPath(moves, "src/lib/combos/cache.ts")).toBe(
      "src/modules/combos/domain/cache.ts"
    );
    expect(mapMovedPath(moves, "src/lib/combos-legacy.ts")).toBe(
      "src/lib/combos-legacy.ts"
    );
  });

  it("follows a chain of moves to the final path", () => {
    expect(mapMovedPath(moves, "src/lib/dice.ts")).toBe(
      "src/modules/playtest/dice.ts"
    );
  });

  it("gives back the path a file had before every move", () => {
    expect(originalPathOf(moves, "src/modules/playtest/dice.ts")).toBe(
      "src/lib/dice.ts"
    );
    expect(originalPathOf(moves, "src/modules/combos/domain/cache.ts")).toBe(
      "src/lib/combos/cache.ts"
    );
    expect(originalPathOf(moves, "src/app/page.tsx")).toBe("src/app/page.tsx");
  });
});
