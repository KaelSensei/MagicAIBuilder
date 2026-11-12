// @vitest-environment node
/**
 * Tests of the migration guard's ESLint rule, run through ESLint's own
 * `Linter` on virtual files, and of its wiring in the repository's
 * `eslint.config.mjs`. Fixture sources spell Vitest's object as `${VI}`, so
 * that this file holds no literal mock call for the stale-mock guard to read.
 */
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { ESLint, Linter } from "eslint";
import { describe, expect, it } from "vitest";
import { migrationGuard } from "./migration-guard-rule.mjs";

const VI = "vi";
const ROOT = "/repo";
const REPO_ROOT = resolve(__dirname, "../..");
const SHIMS = [
  { from: "src/lib/dice.ts", to: "src/modules/playtest/domain/dice.ts" },
  { from: "src/lib/combos", to: "src/modules/combos/domain" },
];

/**
 * typescript-eslint's parser, as `pnpm lint` loads it: through
 * eslint-config-next, which depends on it. The repository does not list it
 * itself, so it is resolved from there rather than added as a dependency.
 */
function typescriptParser(): Linter.Parser {
  const requireHere = createRequire(import.meta.url);
  const requireFromNext = createRequire(
    requireHere.resolve("eslint-config-next")
  );
  const parser: unknown = requireFromNext("@typescript-eslint/parser");
  if (!isParser(parser))
    throw new Error("@typescript-eslint/parser has no parseForESLint");
  return parser;
}

function isParser(value: unknown): value is Linter.Parser {
  return (
    typeof value === "object" &&
    value !== null &&
    "parseForESLint" in value &&
    typeof value.parseForESLint === "function"
  );
}

const PARSER = typescriptParser();

/** The guard's findings on `code` written at `path`, as `line: message`. */
function lint(path: string, code: string): readonly string[] {
  const linter = new Linter({ cwd: ROOT });
  return linter
    .verify(
      code,
      [
        {
          files: ["**/*.{ts,tsx}"],
          languageOptions: { parser: PARSER },
          plugins: { "migration-guard": migrationGuard },
          rules: {
            "migration-guard/no-shim-import": [
              "error",
              { root: ROOT, shims: SHIMS },
            ],
          },
        },
      ],
      { filename: `${ROOT}/${path}` }
    )
    .map(({ line, message }) => `${line}: ${message}`);
}

const linesOf = (findings: readonly string[]): readonly number[] =>
  findings.map((finding) => Number(finding.split(":")[0]));

describe("migration-guard/no-shim-import", () => {
  it("flags every way a source can name a shim", () => {
    const code = [
      'import { roll } from "@/lib/dice";',
      'import type { Die } from "@/lib/dice";',
      'export { roll as reroll } from "@/lib/dice";',
      'export * from "@/lib/combos";',
      'type DiceModule = typeof import("@/lib/dice");',
      'const lazy = () => import("@/lib/combos/cache");',
      'const legacy = require("@/lib/dice");',
      'import fs = require("@/lib/dice.ts");',
      `${VI}.mock("@/lib/dice");`,
      `${VI}.mock(import("@/lib/dice"), () => ({}));`,
      `const actual = ${VI}.importActual("@/lib/dice");`,
      "",
    ].join("\n");

    expect(linesOf(lint("src/app/page.test.tsx", code))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it("flags a relative specifier that resolves to a shim or into a shim folder", () => {
    const code = [
      'import { roll } from "./dice";',
      'import { cache } from "./combos/cache";',
      'import { pick } from "./random";',
      "",
    ].join("\n");

    expect(linesOf(lint("src/lib/roller.ts", code))).toEqual([1, 2]);
  });

  it("leaves alone the moved module, a look-alike path, packages and plain strings", () => {
    const code = [
      'import { roll } from "@/modules/playtest/domain/dice";',
      'import { dicey } from "@/lib/dicey";',
      'import { combosLegacy } from "@/lib/combos-legacy";',
      'import React from "react";',
      `${VI}.mock("next/navigation");`,
      'const label = "@/lib/dice";',
      "",
    ].join("\n");

    expect(lint("src/app/page.tsx", code)).toEqual([]);
  });

  it("lets the files of a shim folder name each other", () => {
    expect(
      lint("src/lib/combos/index.ts", 'export * from "./cache";\n')
    ).toEqual([]);
  });

  it("names the module to import instead", () => {
    const [dice, cache] = lint(
      "src/app/page.tsx",
      'import { roll } from "@/lib/dice";\nimport { cache } from "@/lib/combos/cache";\n'
    );

    expect(dice).toContain('"@/modules/playtest/domain/dice"');
    expect(cache).toContain('"@/modules/combos/domain/cache"');
  });
});

describe("eslint.config.mjs", () => {
  it.each(["src/lib/any.ts", "src/components/Any.tsx", "e2e/any.spec.ts"])(
    "runs the guard on %s with the generated shim list",
    async (path) => {
      const config: unknown = await new ESLint({
        cwd: REPO_ROOT,
      }).calculateConfigForFile(path);

      expect(config).toMatchObject({
        rules: {
          "migration-guard/no-shim-import": [
            2,
            { root: REPO_ROOT, shims: expect.any(Array) },
          ],
        },
      });
    },
    30_000
  );
});
