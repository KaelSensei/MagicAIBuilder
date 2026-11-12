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

/**
 * @returns every environment variable name the e2e Compose stack sets. In
 * `docker-compose.e2e.yml` only `environment:` blocks use upper-case keys, so
 * an indented `UPPER_CASE:` key is an environment variable.
 */
function e2eComposeEnvironmentVariables(): readonly string[] {
  const compose = readRepoFile("docker-compose.e2e.yml");
  return Array.from(
    compose.matchAll(/^\s+([A-Z][A-Z0-9_]*):/gm),
    ([, name]) => name
  );
}

/** @returns the body of the "E2E environment" section of the quality gate */
function documentedE2eEnvironmentSection(): string {
  const doc = readRepoFile("docs/engineering/quality-gate.md");
  const heading = "### E2E environment";
  const start = doc.indexOf(heading);
  expect(
    start,
    `quality-gate.md must contain "${heading}"`
  ).toBeGreaterThanOrEqual(0);
  const body = doc.slice(start + heading.length);
  const nextHeading = body.search(/^#{2,3} /m);
  return nextHeading === -1 ? body : body.slice(0, nextHeading);
}

describe("e2e environment documentation", () => {
  it("documents every variable the e2e Compose stack sets", () => {
    const variables = e2eComposeEnvironmentVariables();
    expect(variables).toContain("DATABASE_URL");

    const section = documentedE2eEnvironmentSection();
    const undocumented = variables.filter(
      (name) => !section.includes(`| \`${name}\``)
    );
    expect(undocumented).toEqual([]);
  });
});
