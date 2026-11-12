// @vitest-environment node
/**
 * Pins the test-hygiene lint rules of `eslint.config.mjs` (ADR 0005, rules 5
 * and 7) by linting small test sources with the repository's own config:
 *
 * - `vitest/prefer-import-in-mock`: a mock names its module through
 *   `import("…")`, so `tsc` checks the path and the factory;
 * - `no-restricted-syntax`: no new mock of an internal module (`@/…` or a
 *   relative path), in either form, except the two transitional seams
 *   (`@/lib/db/prisma`, `@/lib/auth/config`);
 * - `vitest/no-focused-tests` and `vitest/no-disabled-tests`: no committed
 *   `.only` and no `.skip`;
 * - `no-restricted-syntax`, tightened outside `src/test/`: no hand-rolled
 *   `NextIntlClientProvider` or `new QueryClient(…)` in a test, which render
 *   through the shared kit (`src/test/render.tsx`, master plan P1-26).
 *
 * ESLint keeps only the last config object that sets a rule for a file, so a
 * later block that sets `no-restricted-syntax` for test files would silently
 * drop the mock ban; this test fails then. The Node API ignores
 * `eslint-suppressions.json`, so the baseline does not hide anything here.
 */
import { ESLint } from "eslint";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

/** The repository root, two levels above this file (`src/test/`). */
const REPO_ROOT = join(__dirname, "..", "..");

/**
 * Sources spell `vi` through this constant: the stale-mock guard
 * (`vi-mock-paths.test.ts`) scans every test file for literal mock calls and
 * would report the fixtures below as mocks of missing modules.
 */
const VI = "vi";

/** A test file in `src/lib/`, where the rules apply. */
const TEST_FILE = join(REPO_ROOT, "src/lib/example.test.ts");

/** A test of the kit itself, in `src/test/`, where the provider ban does not apply. */
const KIT_TEST_FILE = join(REPO_ROOT, "src/test/example.test.ts");

let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint({ cwd: REPO_ROOT });
});

/** The rule ids ESLint reports for `source` linted as a test file, in order. */
async function rulesReportedFor(
  source: string,
  filePath = TEST_FILE
): Promise<readonly string[]> {
  const [result] = await eslint.lintText(source, { filePath });
  return (result?.messages ?? []).map((message) => message.ruleId ?? "fatal");
}

describe("mock rules", () => {
  it("asks for the typed form and flags the internal mock when a string names an @/ module", async () => {
    const source = `${VI}.mock("@/lib/logger");\n`;

    expect(await rulesReportedFor(source)).toEqual([
      "vitest/prefer-import-in-mock",
      "no-restricted-syntax",
    ]);
  });

  it("offers no autofix, so lint-staged's eslint --fix never rewrites a baselined mock behind the author's back", async () => {
    const source = `${VI}.mock("@/lib/db/prisma", () => ({ prisma: {} }));\n`;

    const [result] = await eslint.lintText(source, { filePath: TEST_FILE });

    expect(
      (result?.messages ?? []).map((message) => [
        message.ruleId,
        message.fix === undefined,
      ])
    ).toEqual([["vitest/prefer-import-in-mock", true]]);
  });

  it.each([
    ["an @/ module", "@/lib/logger"],
    ["a sibling module", "./store"],
  ])(
    "flags a typed mock of %s as a mock of an internal module",
    async (_kind, specifier) => {
      const source = `${VI}.mock(import("${specifier}"));\n${VI}.doMock(import("${specifier}"));\n`;

      expect(await rulesReportedFor(source)).toEqual([
        "no-restricted-syntax",
        "no-restricted-syntax",
      ]);
    }
  );

  it.each(["@/lib/db/prisma", "@/lib/auth/config"])(
    "accepts a mock of %s, a transitional seam with no port yet, and still asks for the typed form",
    async (specifier) => {
      const source = `${VI}.mock(import("${specifier}"));\n${VI}.mock("${specifier}");\n`;

      expect(await rulesReportedFor(source)).toEqual([
        "vitest/prefer-import-in-mock",
      ]);
    }
  );

  it.each([
    ["a module beside a seam", "@/lib/auth/helpers"],
    ["a path that only starts like a seam", "@/lib/db/prisma-cache"],
  ])("still flags a mock of %s", async (_kind, specifier) => {
    const source = `${VI}.mock(import("${specifier}"));\n`;

    expect(await rulesReportedFor(source)).toEqual(["no-restricted-syntax"]);
  });

  it("accepts a typed mock of a package, such as a framework module", async () => {
    const source = `${VI}.mock(import("next/navigation"), () => ({}));\n`;

    expect(await rulesReportedFor(source)).toEqual([]);
  });
});

describe("hand-rolled providers", () => {
  const OWN_PROVIDER =
    'import { NextIntlClientProvider } from "next-intl";\nexport const Provider = NextIntlClientProvider;\n';
  const OWN_CLIENT =
    'import { QueryClient } from "@tanstack/react-query";\nexport const client = new QueryClient();\n';

  it("rejects a test that imports NextIntlClientProvider, and names the kit helpers to use", async () => {
    const [result] = await eslint.lintText(OWN_PROVIDER, {
      filePath: TEST_FILE,
    });

    expect(
      (result?.messages ?? []).map((message) => [
        message.ruleId,
        message.message.includes("renderWithIntl"),
      ])
    ).toEqual([["no-restricted-syntax", true]]);
  });

  it("rejects a test that builds its own QueryClient, and names aTestQueryClient", async () => {
    const [result] = await eslint.lintText(OWN_CLIENT, {
      filePath: TEST_FILE,
    });

    expect(
      (result?.messages ?? []).map((message) => [
        message.ruleId,
        message.message.includes("aTestQueryClient"),
      ])
    ).toEqual([["no-restricted-syntax", true]]);
  });

  it("keeps the mock ban in the same file: the tightened block repeats it", async () => {
    const source = `${OWN_CLIENT}${VI}.mock(import("@/lib/logger"));\n`;

    expect(await rulesReportedFor(source)).toEqual([
      "no-restricted-syntax",
      "no-restricted-syntax",
    ]);
  });

  it("accepts both in a test under src/test/, where the kit's own tests exercise the providers", async () => {
    const source = `${OWN_PROVIDER}${OWN_CLIENT}`;

    expect(await rulesReportedFor(source, KIT_TEST_FILE)).toEqual([]);
  });
});

describe("focused and disabled tests", () => {
  it("rejects a committed .only", async () => {
    const source = 'it.only("runs alone", () => {});\n';

    expect(await rulesReportedFor(source)).toEqual(["vitest/no-focused-tests"]);
  });

  it("rejects a skipped test and a skipped suite", async () => {
    const source =
      'it.skip("is disabled", () => {});\ndescribe.skip("is disabled too", () => {});\n';

    expect(await rulesReportedFor(source)).toEqual([
      "vitest/no-disabled-tests",
      "vitest/no-disabled-tests",
    ]);
  });
});
