// @vitest-environment node
/**
 * Sociable tests of the move codemod over throwaway git repositories.
 *
 * Each test writes a small project into a temporary folder, commits it, runs
 * the planner and the applier (or the real command line through tsx), then
 * reads the files and the git index back. Fixture sources spell Vitest's
 * object as `${VI}`, so that this file holds no literal mock call: the
 * stale-mock guard (`src/test/vi-mock-paths.ts`) reads test sources as text.
 */
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { Move } from "./move-map";
import { applyPlan, planMoves, type MovePlan } from "./move-plan";

const VI = "vi";
const TSX = resolve(__dirname, "../../node_modules/.bin/tsx");
const CLI = resolve(__dirname, "apply-moves.ts");
const DICE_MOVE: Move = {
  from: "src/lib/dice.ts",
  to: "src/modules/playtest/domain/dice.ts",
};
const DICE = "export type Die = number;\nexport const roll = (): Die => 4;\n";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

function git(root: string, ...args: readonly string[]): string {
  return execFileSync(
    "git",
    [
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.com",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=/dev/null",
      "-c",
      "init.defaultBranch=main",
      ...args,
    ],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
}

function writeFile(root: string, path: string, content: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

/** A committed repository holding exactly `files`. */
function createRepo(files: Readonly<Record<string, string>>): string {
  const root = mkdtempSync(join(tmpdir(), "apply-moves-"));
  roots.push(root);
  for (const [path, content] of Object.entries(files))
    writeFile(root, path, content);
  git(root, "init", "--quiet");
  git(root, "add", "-A");
  git(root, "commit", "--quiet", "-m", "fixture");
  return root;
}

function read(root: string, path: string): string {
  return readFileSync(join(root, path), "utf8");
}

/** Plans the moves and applies them when nothing dangles, as the command line does. */
function runMoves(root: string, moves: readonly Move[]): MovePlan {
  const plan = planMoves(root, moves);
  if (plan.kind === "ready") applyPlan(root, plan);
  return plan;
}

/** Every file of the working tree, `.git` aside, with its content. */
function snapshot(root: string, folder = root): Record<string, string> {
  const files: Record<string, string> = {};
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.name === ".git") continue;
    if (entry.isDirectory()) Object.assign(files, snapshot(root, path));
    else files[relative(root, path)] = readFileSync(path, "utf8");
  }
  return files;
}

function runCli(root: string, ...args: readonly string[]) {
  return spawnSync(TSX, [CLI, ...args], { cwd: root, encoding: "utf8" });
}

describe("moving files", () => {
  it("moves a file with git mv, so git stages it as a rename", () => {
    const root = createRepo({ "src/lib/dice.ts": DICE });

    runMoves(root, [DICE_MOVE]);

    expect(git(root, "status", "--porcelain")).toBe(
      "R  src/lib/dice.ts -> src/modules/playtest/domain/dice.ts\n"
    );
    expect(read(root, DICE_MOVE.to)).toBe(DICE);
  });

  it("leaves the rewrites unstaged, so the pure rename can be committed on its own", () => {
    const root = createRepo({
      "src/lib/dice.ts":
        'import { pick } from "./random";\nexport const roll = pick;\n',
      "src/lib/random.ts": "export const pick = () => 4;\n",
    });

    runMoves(root, [DICE_MOVE]);

    expect(git(root, "status", "--porcelain")).toBe(
      "RM src/lib/dice.ts -> src/modules/playtest/domain/dice.ts\n"
    );
  });

  it("moves every file of a moved folder and removes the emptied folder", () => {
    const root = createRepo({
      "src/lib/combos/index.ts": 'export * from "./cache";\n',
      "src/lib/combos/cache.ts": "export const cache = new Map();\n",
    });
    writeFile(root, "src/lib/combos/draft.ts", "export const draft = 1;\n");

    runMoves(root, [
      { from: "src/lib/combos", to: "src/modules/combos/domain" },
    ]);

    expect(Object.keys(snapshot(root)).sort()).toEqual([
      "src/modules/combos/domain/cache.ts",
      "src/modules/combos/domain/draft.ts",
      "src/modules/combos/domain/index.ts",
    ]);
    expect(read(root, "src/modules/combos/domain/index.ts")).toBe(
      'export * from "./cache";\n'
    );
  });
});

describe("rewriting module specifiers", () => {
  it("rewrites every import form that names the moved module and keeps the @/ style", () => {
    const consumer = [
      'import { roll } from "@/lib/dice";',
      "import type { Die } from '@/lib/dice';",
      'export { roll as reroll } from "@/lib/dice";',
      'export * from "@/lib/dice";',
      'type DiceModule = typeof import("@/lib/dice");',
      'type DieAlias = import("@/lib/dice").Die;',
      'const lazy = () => import("@/lib/dice");',
      'const legacy = require("@/lib/dice");',
      'import React from "react";',
      "",
    ].join("\n");
    const root = createRepo({
      "src/lib/dice.ts": DICE,
      "src/components/Roller.tsx": consumer,
    });

    runMoves(root, [DICE_MOVE]);

    expect(read(root, "src/components/Roller.tsx")).toBe(
      consumer.replaceAll("@/lib/dice", "@/modules/playtest/domain/dice")
    );
  });

  it("rewrites every Vitest call that names a module, in the string and the typed import() forms", () => {
    const test = [
      `${VI}.mock("@/lib/dice");`,
      `${VI}.mock(import("@/lib/dice"), () => ({ roll: () => 2 }));`,
      `${VI}.doMock("@/lib/dice", () => ({}));`,
      `${VI}.unmock("@/lib/dice");`,
      `${VI}.doUnmock("@/lib/dice");`,
      `const actual = await ${VI}.importActual<typeof import("@/lib/dice")>("@/lib/dice");`,
      `const mocked = await ${VI}.importMock("@/lib/dice");`,
      `${VI}.mock("next/navigation");`,
      "",
    ].join("\n");
    const root = createRepo({
      "src/lib/dice.ts": DICE,
      "src/components/Roller.test.tsx": test,
    });

    runMoves(root, [DICE_MOVE]);

    expect(read(root, "src/components/Roller.test.tsx")).toBe(
      test.replaceAll("@/lib/dice", "@/modules/playtest/domain/dice")
    );
  });

  it("leaves a path that sits in a comment, a plain string or a template alone", () => {
    const source = [
      '// import { roll } from "@/lib/dice";',
      'const label = "@/lib/dice";',
      `const doc = \`${VI}.mock("@/lib/dice")\`;`,
      'readFileSync("src/lib/dice.ts");',
      "",
    ].join("\n");
    const root = createRepo({
      "src/lib/dice.ts": DICE,
      "src/lib/notes.ts": source,
    });

    const plan = runMoves(root, [DICE_MOVE]);

    expect(plan.fileEdits).toEqual([]);
    expect(read(root, "src/lib/notes.ts")).toBe(source);
  });

  it("keeps a relative specifier relative while the target stays in or below the importer's folder", () => {
    const root = createRepo({
      "src/lib/dice.ts": DICE,
      "src/lib/roller.ts": 'import { roll } from "./dice";\n',
    });

    runMoves(root, [
      { from: "src/lib/dice.ts", to: "src/lib/playtest/dice.ts" },
    ]);

    expect(read(root, "src/lib/roller.ts")).toBe(
      'import { roll } from "./playtest/dice";\n'
    );
  });

  it("turns a relative specifier that would climb out of its folder into @/ inside src", () => {
    const root = createRepo({
      "src/lib/dice.ts":
        'import { pick } from "./random";\nexport const roll = pick;\n',
      "src/lib/random.ts": "export const pick = () => 4;\n",
      "src/lib/roller.ts": 'import { roll } from "./dice";\n',
      "src/lib/roller.test.ts": `${VI}.mock("./dice");\n`,
    });

    runMoves(root, [DICE_MOVE]);

    expect(read(root, DICE_MOVE.to)).toBe(
      'import { pick } from "@/lib/random";\nexport const roll = pick;\n'
    );
    expect(read(root, "src/lib/roller.ts")).toBe(
      'import { roll } from "@/modules/playtest/domain/dice";\n'
    );
    expect(read(root, "src/lib/roller.test.ts")).toBe(
      `${VI}.mock("@/modules/playtest/domain/dice");\n`
    );
  });

  it("leaves specifiers between files moved together untouched", () => {
    const engine =
      'import { roll } from "./dice";\nexport const play = roll;\n';
    const test = `${VI}.mock("./dice");\nimport { play } from "./engine";\n`;
    const root = createRepo({
      "src/lib/playtest/dice.ts": DICE,
      "src/lib/playtest/engine.ts": engine,
      "src/lib/playtest/engine.test.ts": test,
    });

    runMoves(root, [
      { from: "src/lib/playtest", to: "src/modules/playtest/domain" },
    ]);

    expect(read(root, "src/modules/playtest/domain/engine.ts")).toBe(engine);
    expect(read(root, "src/modules/playtest/domain/engine.test.ts")).toBe(test);
  });

  it("points a folder import at the moved folder, without /index", () => {
    const root = createRepo({
      "src/lib/combos/index.ts": "export const combos = [];\n",
      "src/lib/finder.ts": 'import { combos } from "./combos";\n',
      "src/app/page.tsx": 'import { combos } from "@/lib/combos";\n',
    });

    runMoves(root, [{ from: "src/lib/combos", to: "src/modules/combos" }]);

    expect(read(root, "src/lib/finder.ts")).toBe(
      'import { combos } from "@/modules/combos";\n'
    );
    expect(read(root, "src/app/page.tsx")).toBe(
      'import { combos } from "@/modules/combos";\n'
    );
  });

  it("rewrites e2e and scripts sources, keeping a relative path where @/ was not used", () => {
    const root = createRepo({
      "src/lib/dice.ts": DICE,
      "e2e/roll.spec.ts": 'import { roll } from "@/lib/dice";\n',
      "scripts/roll.ts": 'import { roll } from "../src/lib/dice";\n',
    });

    runMoves(root, [DICE_MOVE]);

    expect(read(root, "e2e/roll.spec.ts")).toBe(
      'import { roll } from "@/modules/playtest/domain/dice";\n'
    );
    expect(read(root, "scripts/roll.ts")).toBe(
      'import { roll } from "../src/modules/playtest/domain/dice";\n'
    );
  });

  it("follows a chain of moves to the final path", () => {
    const root = createRepo({
      "src/lib/dice.ts": DICE,
      "src/app/page.tsx": 'import { roll } from "@/lib/dice";\n',
    });

    runMoves(root, [
      { from: "src/lib/dice.ts", to: "src/modules/dice.ts" },
      { from: "src/modules/dice.ts", to: "src/modules/playtest/dice.ts" },
    ]);

    expect(read(root, "src/app/page.tsx")).toBe(
      'import { roll } from "@/modules/playtest/dice";\n'
    );
    expect(git(root, "status", "--porcelain")).toContain(
      "src/lib/dice.ts -> src/modules/playtest/dice.ts"
    );
  });
});

describe("path-keyed files", () => {
  /** dependency-cruiser's own layout for `--baseline` output. */
  const baselineOf = (entries: readonly object[]): string =>
    `${JSON.stringify(entries, null, 2)}\n`;
  const TYPE_IMPORT = ["local", "type-only", "import"];
  const ALIASED = ["aliased", "aliased-tsconfig", "aliased-tsconfig-paths"];
  const LAYER_RULE = { severity: "error", name: "lib-not-outer-layers" };
  const CYCLE_RULE = { severity: "error", name: "no-circular" };
  const cycleOf = (...names: readonly string[]) =>
    names.map((name) => ({ name, dependencyTypes: TYPE_IMPORT }));

  it("keeps each dependency-cruiser baseline entry equal to what the gate will report after the move", () => {
    const before = [
      {
        type: "dependency",
        from: "src/lib/ai/plan.ts",
        to: "src/app/build/types.ts",
        unresolvedTo: "@/app/build/types",
        dependencyTypes: [...ALIASED, ...TYPE_IMPORT],
        rule: LAYER_RULE,
      },
      {
        type: "cycle",
        from: "src/lib/deck/turn-one.ts",
        to: "src/lib/deck/types.ts",
        unresolvedTo: "./types",
        dependencyTypes: TYPE_IMPORT,
        rule: CYCLE_RULE,
        cycle: cycleOf("src/lib/deck/types.ts", "src/lib/deck/turn-one.ts"),
      },
      {
        type: "cycle",
        from: "src/lib/deck/types.ts",
        to: "src/lib/deck/turn-one.ts",
        unresolvedTo: "./turn-one",
        dependencyTypes: TYPE_IMPORT,
        rule: CYCLE_RULE,
        cycle: cycleOf("src/lib/deck/turn-one.ts", "src/lib/deck/types.ts"),
      },
    ];
    const root = createRepo({
      "src/lib/ai/plan.ts":
        'import type { BuildRequest } from "@/app/build/types";\nexport type Plan = BuildRequest;\n',
      "src/app/build/types.ts":
        "export type BuildRequest = { colors: string };\n",
      "src/lib/deck/types.ts":
        'import type { TurnOne } from "./turn-one";\nexport type Deck = { turnOne: TurnOne };\n',
      "src/lib/deck/turn-one.ts":
        'import type { Deck } from "./types";\nexport type TurnOne = (deck: Deck) => boolean;\n',
      ".dependency-cruiser-known-violations.json": baselineOf(before),
    });

    runMoves(root, [
      {
        from: "src/lib/deck/turn-one.ts",
        to: "src/lib/deck/analysis/turn-one.ts",
      },
      { from: "src/app/build/types.ts", to: "src/modules/ai/build-types.ts" },
    ]);

    expect(read(root, ".dependency-cruiser-known-violations.json")).toBe(
      baselineOf([
        {
          ...before[0],
          to: "src/modules/ai/build-types.ts",
          unresolvedTo: "@/modules/ai/build-types",
        },
        {
          ...before[1],
          from: "src/lib/deck/analysis/turn-one.ts",
          // The move turned `./types` into `@/lib/deck/types`, and
          // dependency-cruiser types an aliased import differently.
          unresolvedTo: "@/lib/deck/types",
          dependencyTypes: [...ALIASED, ...TYPE_IMPORT],
          cycle: cycleOf(
            "src/lib/deck/types.ts",
            "src/lib/deck/analysis/turn-one.ts"
          ),
        },
        {
          ...before[2],
          to: "src/lib/deck/analysis/turn-one.ts",
          unresolvedTo: "./analysis/turn-one",
          cycle: cycleOf(
            "src/lib/deck/analysis/turn-one.ts",
            "src/lib/deck/types.ts"
          ),
        },
      ])
    );
  });

  it("renames moved files in the ESLint suppressions, keeping the file's layout", () => {
    const suppressions = `{
  "src/lib/dice.ts": {
    "max-lines": {
      "count": 1
    }
  }
}
`;
    const root = createRepo({
      "src/lib/dice.ts": DICE,
      "eslint-suppressions.json": suppressions,
    });

    runMoves(root, [DICE_MOVE]);

    expect(read(root, "eslint-suppressions.json")).toBe(
      suppressions.replaceAll("src/lib/dice.ts", DICE_MOVE.to)
    );
  });
});

describe("idempotency", () => {
  it("changes nothing when run a second time", () => {
    const root = createRepo({
      "src/lib/dice.ts":
        'import { pick } from "./random";\nexport const roll = pick;\n',
      "src/lib/random.ts": "export const pick = () => 4;\n",
      "src/lib/roller.ts": 'import { roll } from "./dice";\n',
      "src/lib/roller.test.ts": `${VI}.mock(import("./dice"));\n`,
      "eslint-suppressions.json": '{\n  "src/lib/dice.ts": {}\n}\n',
    });
    runMoves(root, [DICE_MOVE]);
    const afterFirstRun = snapshot(root);

    const second = runMoves(root, [DICE_MOVE]);

    expect(second).toMatchObject({
      kind: "ready",
      fileMoves: [],
      fileEdits: [],
      jsonEdits: [],
    });
    expect(second.moves).toEqual([{ move: DICE_MOVE, moved: 0, kept: 0 }]);
    expect(snapshot(root)).toEqual(afterFirstRun);
  });

  it("skips a move already applied and still rewrites a file that names the old path, as on a rebased branch", () => {
    const root = createRepo({
      [DICE_MOVE.to]: DICE,
      "src/components/Roller.tsx": 'import { roll } from "@/lib/dice";\n',
      "src/components/Roller.test.tsx": `${VI}.mock("@/lib/dice");\n`,
    });

    const plan = runMoves(root, [DICE_MOVE]);

    expect(plan.moves).toEqual([{ move: DICE_MOVE, moved: 0, kept: 0 }]);
    expect(read(root, "src/components/Roller.tsx")).toBe(
      'import { roll } from "@/modules/playtest/domain/dice";\n'
    );
    expect(read(root, "src/components/Roller.test.tsx")).toBe(
      `${VI}.mock("@/modules/playtest/domain/dice");\n`
    );
  });

  it("repairs the relative specifiers of a file moved by hand, reading them from its old folder", () => {
    const root = createRepo({
      [DICE_MOVE.to]:
        'import { pick } from "./random";\nexport const roll = pick;\n',
      "src/lib/random.ts": "export const pick = () => 4;\n",
    });

    runMoves(root, [DICE_MOVE]);

    expect(read(root, DICE_MOVE.to)).toBe(
      'import { pick } from "@/lib/random";\nexport const roll = pick;\n'
    );
  });

  it("keeps a file left at the old path, such as a re-export shim, and points references at the new path", () => {
    const shim = 'export * from "@/modules/playtest/domain/dice";\n';
    const root = createRepo({
      "src/lib/dice.ts": shim,
      [DICE_MOVE.to]: DICE,
      "src/app/page.tsx": 'import { roll } from "@/lib/dice";\n',
    });

    const plan = runMoves(root, [DICE_MOVE]);

    expect(plan.moves).toEqual([{ move: DICE_MOVE, moved: 0, kept: 1 }]);
    expect(read(root, "src/lib/dice.ts")).toBe(shim);
    expect(read(root, "src/app/page.tsx")).toBe(
      'import { roll } from "@/modules/playtest/domain/dice";\n'
    );
  });
});

describe("dangling references", () => {
  it("blocks the plan and lists each reference that resolves to no file", () => {
    const root = createRepo({
      "src/lib/dice.ts": DICE,
      "src/app/page.tsx":
        'import { roll } from "@/lib/dice";\nimport { gone } from "@/lib/gone";\n',
    });

    const plan = planMoves(root, [DICE_MOVE]);

    expect(plan.kind).toBe("blocked");
    expect(plan.kind === "blocked" && plan.dangling).toEqual([
      { file: "src/app/page.tsx", line: 2, specifier: "@/lib/gone" },
    ]);
  });

  it("refuses two moves that claim the same destination", () => {
    const root = createRepo({
      "src/lib/dice.ts": DICE,
      "src/lib/die.ts": DICE,
    });

    expect(() =>
      planMoves(root, [
        { from: "src/lib/dice.ts", to: "src/modules/dice.ts" },
        { from: "src/lib/die.ts", to: "src/modules/dice.ts" },
      ])
    ).toThrow("two moves claim src/modules/dice.ts");
  });
});

describe("command line", () => {
  it("prints the planned edits in a dry run and changes nothing", () => {
    const root = createRepo({
      "src/lib/dice.ts": DICE,
      "src/app/page.tsx": 'import { roll } from "@/lib/dice";\n',
      "scripts/refactor/moves.json": JSON.stringify([DICE_MOVE]),
    });

    const result = runCli(root, "--dry-run");

    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("dry run");
    expect(result.stdout).toContain(
      "src/lib/dice.ts -> src/modules/playtest/domain/dice.ts"
    );
    expect(result.stdout).toContain(
      'src/app/page.tsx:1 "@/lib/dice" -> "@/modules/playtest/domain/dice"'
    );
    expect(git(root, "status", "--porcelain")).toBe("");
  }, 30_000);

  it("exits non-zero on a dangling reference and moves nothing", () => {
    const root = createRepo({
      "src/lib/dice.ts": DICE,
      "src/app/page.tsx": 'import { gone } from "@/lib/gone";\n',
      "scripts/refactor/moves.json": JSON.stringify([DICE_MOVE]),
    });

    const result = runCli(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('src/app/page.tsx:1 "@/lib/gone"');
    expect(git(root, "status", "--porcelain")).toBe("");
  }, 30_000);

  it("exits with a usage error on an invalid move map", () => {
    const root = createRepo({
      "scripts/refactor/moves.json": JSON.stringify([
        { from: "/src/a.ts", to: "src/b.ts" },
      ]),
    });

    const result = runCli(root);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("moves[0]");
  }, 30_000);
});
