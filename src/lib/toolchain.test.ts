import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Toolchain consistency guards.
 *
 * The e2e suite runs in `Dockerfile.playwright`, whose base image ships a fixed
 * set of browser binaries. Playwright resolves those binaries by a path that
 * embeds its own version, so an image tag that drifts from the installed
 * `@playwright/test` makes every browser test fail with
 * "Executable doesn't exist at /ms-playwright/chromium_headless_shell-<n>".
 *
 * That drift once cost a whole e2e run (18 tests never reached a browser),
 * so it is asserted here rather than discovered in CI.
 */

const ROOT = join(__dirname, "..", "..");

function readRepoFile(name: string): string {
  return readFileSync(join(ROOT, name), "utf8");
}

/** @returns the exact version pinned for `@playwright/test` in package.json */
function installedPlaywrightVersion(): string {
  const pkg = JSON.parse(readRepoFile("package.json")) as {
    devDependencies: Record<string, string>;
  };
  const range = pkg.devDependencies["@playwright/test"];
  expect(range, "@playwright/test must be a devDependency").toBeDefined();
  return range.replace(/^[\^~]/, "");
}

/** @returns the Playwright version embedded in the e2e image tag */
function dockerImagePlaywrightVersion(): string {
  const dockerfile = readRepoFile("Dockerfile.playwright");
  const match = /mcr\.microsoft\.com\/playwright:v([\d.]+)-/.exec(dockerfile);
  expect(match, "Dockerfile.playwright must pin an mcr playwright image").not.toBeNull();
  return match![1];
}

describe("e2e toolchain", () => {
  it("pins a Docker image whose Playwright version matches the installed one", () => {
    expect(dockerImagePlaywrightVersion()).toBe(installedPlaywrightVersion());
  });
});
