// @vitest-environment node
/**
 * Pins the `application/` import ban of `eslint.config.mjs`, the in-editor
 * half of dependency-cruiser's `application-is-not-an-adapter` rule
 * (docs/architecture/target-structure.md, "Enforcement").
 *
 * A use case receives a parsed command and calls ports, so it runs in Vitest
 * without Next.js, a database or the network (ADR 0001, ADR 0003). It may
 * import its own domain, other contexts' `index.ts` and `server.ts`, and the
 * server kernel; it may not import an adapter: `infrastructure/`, `client/`,
 * `ui/`, Prisma or anything else under `src/lib/db/`, Next.js or Zod, nor
 * call the global `fetch`.
 *
 * The sources are linted with the repository's own config as if they lived
 * in a context that does not exist, so no real module is needed. The Node
 * API ignores `eslint-suppressions.json`, so the baseline hides nothing here.
 */
import { ESLint } from "eslint";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

/** The repository root, two levels above this file (`src/test/`). */
const REPO_ROOT = join(__dirname, "..", "..");

/** A use case file of an example context, where the ban applies. */
const USE_CASE_FILE = join(
  REPO_ROOT,
  "src/modules/example/application/do-something.ts"
);

let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint({ cwd: REPO_ROOT });
});

/** The rule ids ESLint reports for `source` linted as a use case, in order. */
async function rulesReportedFor(source: string): Promise<readonly string[]> {
  const [result] = await eslint.lintText(source, { filePath: USE_CASE_FILE });
  return (result?.messages ?? []).map((message) => message.ruleId ?? "fatal");
}

/** A use case that imports `name` from `specifier` and uses it. */
function importing(specifier: string): string {
  return `import { name } from "${specifier}";\nexport const used = name;\n`;
}

describe("application/ imports", () => {
  it.each([
    [
      "its own context's adapter",
      "@/modules/example/infrastructure/repository",
    ],
    ["another context's adapter", "@/modules/other/infrastructure/client"],
    ["a browser API client", "@/modules/example/client/api"],
    ["a component", "@/modules/example/ui/Panel"],
    ["the shared Prisma client", "@/lib/db/prisma"],
    ["the generated Prisma package", "@prisma/client"],
    ["a Prisma helper of the shared kernel", "@/lib/db/create-once"],
    ["Next.js", "next/server"],
    ["Zod", "zod"],
  ])("rejects %s", async (_kind, specifier) => {
    expect(await rulesReportedFor(importing(specifier))).toEqual([
      "no-restricted-imports",
    ]);
  });

  it.each([
    ["its own domain", "@/modules/example/domain/rules"],
    ["its own ports", "@/modules/example/application/ports"],
    ["another context's pure entry point", "@/modules/other"],
    ["another context's server entry point", "@/modules/other/server"],
    ["the server logger", "@/lib/logger"],
  ])("accepts %s", async (_kind, specifier) => {
    expect(await rulesReportedFor(importing(specifier))).toEqual([]);
  });

  it("keeps the general bans: a parent-relative path is still rejected", async () => {
    expect(await rulesReportedFor(importing("../domain/rules"))).toEqual([
      "no-restricted-imports",
    ]);
  });
});

describe("application/ network calls", () => {
  it("rejects the global fetch: HTTP belongs to an infrastructure adapter", async () => {
    const source = 'export const load = () => fetch("https://example.com");\n';

    expect(await rulesReportedFor(source)).toEqual(["no-restricted-globals"]);
  });
});
