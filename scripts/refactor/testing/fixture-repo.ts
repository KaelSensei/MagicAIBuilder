/**
 * Throwaway git repositories for the move codemod's sociable tests.
 *
 * A test writes a small project into a temporary folder, commits it, runs the
 * planner and the applier (or the real command line through tsx), then reads
 * the files and the git index back. Each test file calls
 * {@link removeFixtureRepos} after each test.
 *
 * @module refactor/testing/fixture-repo
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
import { applyPlan } from "../apply-plan";
import type { Move } from "../move-map";
import { planMoves, type MovePlan } from "../move-plan";

const TSX = resolve(__dirname, "../../../node_modules/.bin/tsx");
const CLI = resolve(__dirname, "../apply-moves.ts");

const roots: string[] = [];

/** Deletes every repository created since the last call; pass it to `afterEach`. */
export function removeFixtureRepos(): void {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
}

/** Runs git in `root` with a fixed identity and no hooks, signing or user config. */
export function git(root: string, ...args: readonly string[]): string {
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

/** Writes `content` at `path` under `root`, creating its folders. */
export function writeFile(root: string, path: string, content: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

/** A committed repository holding exactly `files`. */
export function createRepo(files: Readonly<Record<string, string>>): string {
  const root = mkdtempSync(join(tmpdir(), "apply-moves-"));
  roots.push(root);
  for (const [path, content] of Object.entries(files))
    writeFile(root, path, content);
  git(root, "init", "--quiet");
  git(root, "add", "-A");
  git(root, "commit", "--quiet", "-m", "fixture");
  return root;
}

/** The content of `path` under `root`. */
export function read(root: string, path: string): string {
  return readFileSync(join(root, path), "utf8");
}

/** Plans the moves and applies them when nothing dangles, as the command line does. */
export function runMoves(root: string, moves: readonly Move[]): MovePlan {
  const plan = planMoves(root, moves);
  if (plan.kind === "ready") applyPlan(root, plan);
  return plan;
}

/** Every file of the working tree, `.git` aside, with its content. */
export function snapshot(root: string, folder = root): Record<string, string> {
  const files: Record<string, string> = {};
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.name === ".git") continue;
    if (entry.isDirectory()) Object.assign(files, snapshot(root, path));
    else files[relative(root, path)] = readFileSync(path, "utf8");
  }
  return files;
}

/** Runs `pnpm refactor:apply-moves` with `args` in `root`, through tsx as the package script does. */
export function runCli(root: string, ...args: readonly string[]) {
  return spawnSync(TSX, [CLI, ...args], { cwd: root, encoding: "utf8" });
}
