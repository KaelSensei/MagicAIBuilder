// @vitest-environment node
/**
 * Runs the real pre-push script against a throwaway repository, with a fake
 * `docker` first on PATH. The fake logs each call and makes `compose up`
 * last long enough for two runs to overlap if nothing stops them.
 */
import { execFileSync, spawn } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const SCRIPT = resolve(__dirname, "e2e-pre-push.sh");

const FAKE_DOCKER = `#!/usr/bin/env bash
echo "$(date +%s%N) start $*" >> "$FAKE_DOCKER_LOG"
if [[ "$1" == "compose" && " $* " == *" up "* ]]; then sleep "$FAKE_UP_SECONDS"; fi
if [[ "$1" == "run" ]]; then
  chmod -R u+w "$FAKE_ROOT/test-results" "$FAKE_ROOT/playwright-report" 2>/dev/null
  rm -rf "$FAKE_ROOT/test-results" "$FAKE_ROOT/playwright-report"
fi
echo "$(date +%s%N) end $*" >> "$FAKE_DOCKER_LOG"
`;

interface Workspace {
  readonly root: string;
  readonly log: string;
  readonly env: NodeJS.ProcessEnv;
}

interface Interval {
  readonly start: bigint;
  readonly end: bigint;
}

let workspace: Workspace;

function createWorkspace(): Workspace {
  const root = mkdtempSync(join(tmpdir(), "e2e-pre-push-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  mkdirSync(join(root, "scripts"));
  copyFileSync(SCRIPT, join(root, "scripts", "e2e-pre-push.sh"));
  const bin = join(root, "fake-bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "docker"), FAKE_DOCKER);
  chmodSync(join(bin, "docker"), 0o755);
  const log = join(root, "docker.log");
  writeFileSync(log, "");
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH ?? ""}`,
    CI: "",
    SKIP_E2E: "",
    E2E_LOCK_FILE: join(root, "e2e.lock"),
    FAKE_DOCKER_LOG: log,
    FAKE_ROOT: root,
    FAKE_UP_SECONDS: "0.6",
  };
  return { root, log, env };
}

function runScript(ws: Workspace): Promise<number> {
  return new Promise((done, fail) => {
    const child = spawn("bash", ["scripts/e2e-pre-push.sh"], {
      cwd: ws.root,
      env: ws.env,
      stdio: "ignore",
    });
    child.on("error", fail);
    child.on("close", (code) => done(code ?? -1));
  });
}

interface PushOutcome {
  readonly code: number;
  readonly output: string;
}

/**
 * Runs the script the way git's pre-push hook does: one line per pushed ref
 * on stdin, `<local ref> <local sha> <remote ref> <remote sha>`.
 */
function runPush(ws: Workspace, refLines: string): Promise<PushOutcome> {
  return new Promise((done, fail) => {
    const child = spawn("bash", ["scripts/e2e-pre-push.sh"], {
      cwd: ws.root,
      env: ws.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.on("error", fail);
    child.on("close", (code) => done({ code: code ?? -1, output }));
    child.stdin.end(refLines);
  });
}

const ZERO_SHA = "0".repeat(40);

function git(ws: Workspace, ...args: readonly string[]): string {
  return execFileSync(
    "git",
    ["-c", "user.name=Gate", "-c", "user.email=gate@example.com", ...args],
    { cwd: ws.root, encoding: "utf8" }
  ).trim();
}

/** Commits one file and records that commit as `origin/dev`, already pushed. */
function seedRemoteDev(ws: Workspace): string {
  writeFileSync(join(ws.root, "deck.txt"), "1 Sol Ring\n");
  git(ws, "add", "deck.txt");
  git(ws, "commit", "-q", "-m", "feat: a deck");
  const sha = git(ws, "rev-parse", "HEAD");
  git(ws, "update-ref", "refs/remotes/origin/dev", sha);
  return sha;
}

function commitEmpty(ws: Workspace, message: string): string {
  git(ws, "commit", "-q", "--allow-empty", "-m", message);
  return git(ws, "rev-parse", "HEAD");
}

function commitFileChange(ws: Workspace, line: string): string {
  writeFileSync(join(ws.root, "deck.txt"), line);
  git(ws, "commit", "-q", "-am", "feat: change the deck");
  return git(ws, "rev-parse", "HEAD");
}

function newBranchPush(localSha: string): string {
  return `refs/heads/claim ${localSha} refs/heads/claim ${ZERO_SHA}\n`;
}

/** Start and end times of every `compose up` the fake docker saw. */
function composeUpIntervals(log: string): readonly Interval[] {
  const starts: bigint[] = [];
  const intervals: Interval[] = [];
  for (const line of readFileSync(log, "utf8").split("\n")) {
    const match = /^(\d+) (start|end) compose .* up /.exec(`${line} `);
    if (!match) continue;
    const time = BigInt(match[1]);
    if (match[2] === "start") {
      starts.push(time);
    } else {
      const start = starts.shift();
      if (start !== undefined) intervals.push({ start, end: time });
    }
  }
  return intervals;
}

beforeEach(() => {
  workspace = createWorkspace();
});

afterEach(() => {
  execFileSync("chmod", ["-R", "u+w", workspace.root]);
  rmSync(workspace.root, { recursive: true, force: true });
});

describe("scripts/e2e-pre-push.sh", () => {
  it("makes a second run on the same machine wait instead of overlapping the first", async () => {
    const codes = await Promise.all([
      runScript(workspace),
      runScript(workspace),
    ]);

    expect(codes).toEqual([0, 0]);
    const [first, second] = [...composeUpIntervals(workspace.log)].sort(
      (a, b) => (a.start < b.start ? -1 : 1)
    );
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(second.start >= first.end).toBe(true);
  }, 20_000);

  it("clears report files it cannot delete itself instead of blocking the push", async () => {
    const locked = join(workspace.root, "test-results", "traces");
    mkdirSync(locked, { recursive: true });
    writeFileSync(join(locked, "recording.trace"), "left by a killed run");
    chmodSync(locked, 0o555);

    const code = await runScript(workspace);

    expect(code).toBe(0);
    expect(readFileSync(workspace.log, "utf8")).toMatch(/start run --rm/);
    expect(composeUpIntervals(workspace.log)).toHaveLength(1);
  }, 20_000);

  // I-74 §3.6: a run's claim is an empty commit, and it must cost no E2E run.
  describe("a push whose commits change no file", () => {
    it("skips the suite and says why when the only new commit is empty", async () => {
      seedRemoteDev(workspace);
      const claim = commitEmpty(workspace, "chore(claim): I-74/6");

      const { code, output } = await runPush(workspace, newBranchPush(claim));

      expect(code).toBe(0);
      expect(composeUpIntervals(workspace.log)).toHaveLength(0);
      expect(output).toMatch(/changes no file/);
    }, 20_000);

    it("skips the suite when the push only deletes a remote branch", async () => {
      const dev = seedRemoteDev(workspace);

      const { code } = await runPush(
        workspace,
        `(delete) ${ZERO_SHA} refs/heads/old-claim ${dev}\n`
      );

      expect(code).toBe(0);
      expect(composeUpIntervals(workspace.log)).toHaveLength(0);
    }, 20_000);
  });

  describe("a push with any file change", () => {
    it("runs the full suite when a pushed commit changes a file", async () => {
      seedRemoteDev(workspace);
      const change = commitFileChange(workspace, "1 Arcane Signet\n");

      const { code } = await runPush(workspace, newBranchPush(change));

      expect(code).toBe(0);
      expect(composeUpIntervals(workspace.log)).toHaveLength(1);
    }, 20_000);

    it("runs the full suite when an empty commit sits on a file change", async () => {
      seedRemoteDev(workspace);
      commitFileChange(workspace, "1 Arcane Signet\n");
      const claim = commitEmpty(workspace, "chore(claim): I-74/6");

      const { code } = await runPush(workspace, newBranchPush(claim));

      expect(code).toBe(0);
      expect(composeUpIntervals(workspace.log)).toHaveLength(1);
    }, 20_000);

    it("keeps the full suite when a pushed commit cannot be read", async () => {
      seedRemoteDev(workspace);

      const { code } = await runPush(workspace, newBranchPush("f".repeat(40)));

      expect(code).toBe(0);
      expect(composeUpIntervals(workspace.log)).toHaveLength(1);
    }, 20_000);

    it("runs the full suite when an existing branch gains a file change", async () => {
      const dev = seedRemoteDev(workspace);
      const change = commitFileChange(workspace, "1 Arcane Signet\n");

      const { code } = await runPush(
        workspace,
        `refs/heads/dev ${change} refs/heads/dev ${dev}\n`
      );

      expect(code).toBe(0);
      expect(composeUpIntervals(workspace.log)).toHaveLength(1);
    }, 20_000);
  });
});
