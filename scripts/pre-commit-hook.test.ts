// @vitest-environment node
/**
 * Pins the `.husky/pre-commit` hook's lint-staged invocation.
 *
 * Several agents commit concurrently from worktrees that share one git
 * stash stack. lint-staged's default "backup stash" (`git stash create` +
 * `git stash store`) makes every commit push and drop an entry on that
 * shared stack, so one hook can drop another worktree's entry. The hook
 * must therefore run without the backup, while keeping lint-staged's
 * patch-file protection of partially staged files, which does not use
 * the stash (lint-staged 16.4.0, lib/gitWorkflow.js).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const HOOK = resolve(__dirname, "..", ".husky", "pre-commit");

/** The hook's command lines, without comments and blank lines. */
function hookCommands(): readonly string[] {
  return readFileSync(HOOK, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

describe(".husky/pre-commit", () => {
  it("runs lint-staged without the backup stash, so the shared stash stack is never touched", () => {
    const lintStaged = hookCommands().find((line) =>
      line.includes("lint-staged")
    );

    expect(lintStaged).toBeDefined();
    expect(lintStaged).toMatch(/\s--no-stash(\s|$)/);
  });

  it("keeps hiding the unstaged hunks of partially staged files", () => {
    const lintStaged = hookCommands().find((line) =>
      line.includes("lint-staged")
    );

    expect(lintStaged).not.toMatch(/--no-hide-partially-staged/);
  });
});
