/**
 * Carries out a ready move plan on the working tree: moves the files, writes
 * the rewritten sources and path-keyed files, and removes the folders the
 * moves emptied.
 *
 * Each tracked file moves with `git mv` and the rewrites are written without
 * being staged, so the index holds pure renames that can be committed apart
 * from the rewrites. Git records no renames; it guesses them from content
 * similarity (50 % by default, git-diff(1) `-M`), so a byte-identical move is
 * always seen as one, and `git log --follow` and edits made on other branches
 * follow the file.
 *
 * @module refactor/apply-plan
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmdirSync,
  writeFileSync,
} from "node:fs";
import { join, posix } from "node:path";
import type { ReadyPlan } from "./move-plan";

/**
 * Applies a ready plan under `root`: `git mv` for each tracked file (its
 * folder created first), a plain rename for an untracked one, then the
 * source and path-keyed rewrites, then removes the folders the moves emptied.
 * A blocked plan is not accepted: its dangling references must be fixed first.
 *
 * @throws Error when `git mv` fails, for example on a file git does not know
 */
export function applyPlan(root: string, plan: ReadyPlan): void {
  for (const { from, to, tracked } of plan.fileMoves) {
    mkdirSync(join(root, posix.dirname(to)), { recursive: true });
    if (tracked) {
      execFileSync("git", ["mv", "--", from, to], { cwd: root, stdio: "pipe" });
    } else {
      renameSync(join(root, from), join(root, to));
    }
  }
  for (const { path, content } of [...plan.fileEdits, ...plan.jsonEdits]) {
    writeFileSync(join(root, path), content);
  }
  removeEmptiedFolders(
    root,
    plan.fileMoves.map(({ from }) => posix.dirname(from))
  );
}

/** Removes each folder that the moves left empty, and its parents while they are empty too. */
function removeEmptiedFolders(root: string, folders: readonly string[]): void {
  for (const start of new Set(folders)) {
    let folder = start;
    while (
      folder !== "." &&
      existsSync(join(root, folder)) &&
      readdirSync(join(root, folder)).length === 0
    ) {
      rmdirSync(join(root, folder));
      folder = posix.dirname(folder);
    }
  }
}
