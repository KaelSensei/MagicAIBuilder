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
});
