// @vitest-environment node
/**
 * Sociable tests of the move codemod's second pass over throwaway git
 * repositories (`testing/fixture-repo.ts`): the root configs that name
 * moved paths, the old-path report for docs, and the migration guard that
 * the codemod writes into `eslint.config.mjs`.
 */
import { afterEach, describe, expect, it } from "vitest";
import type { Move } from "./move-map";
import { planMoves } from "./move-plan";
import {
  createRepo,
  git,
  read,
  removeFixtureRepos,
  runCli,
  runMoves,
  snapshot,
} from "./testing/fixture-repo";

const DICE = "export const roll = () => 4;\n";
const DICE_MOVE: Move = {
  from: "src/lib/dice.ts",
  to: "src/modules/playtest/domain/dice.ts",
};
const COMBOS_MOVE: Move = {
  from: "src/lib/combos",
  to: "src/modules/combos/domain",
};
const TYPES_MOVE: Move = {
  from: "src/lib/deck/types.ts",
  to: "src/modules/deck-building/domain/types.ts",
};
const HEADERS_MOVE: Move = {
  from: "src/lib/security-headers.ts",
  to: "src/modules/site/infrastructure/security-headers.ts",
};
const ROW_MOVE: Move = {
  from: "src/components/deck/DeckRow.tsx",
  to: "src/modules/deck-building/ui/DeckRow.tsx",
};

/** The modules the moves above take, so that every move has a file to move. */
const MODULES: Readonly<Record<string, string>> = {
  "src/lib/dice.ts": DICE,
  "src/lib/combos/index.ts": "export const combos = [];\n",
  "src/lib/combos/fixtures/spellbook.json": "{}\n",
  "src/lib/deck/types.ts": "export type Deck = { name: string };\n",
  "src/lib/security-headers.ts": "export const headers = [];\n",
  "src/i18n/request.ts": "export default {};\n",
  "src/test/stubs/server-only.ts": "export {};\n",
  "src/components/deck/DeckRow.tsx": "export const DeckRow = () => null;\n",
};

const lines = (...text: readonly string[]): string => `${text.join("\n")}\n`;

afterEach(removeFixtureRepos);

describe("root configs", () => {
  it("rewrites the paths and globs of moved modules in vitest.config.ts", () => {
    const config = lines(
      'import { defineConfig } from "vitest/config";',
      'import { resolve } from "path";',
      "",
      "export default defineConfig({",
      "  test: {",
      '    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],',
      "    coverage: {",
      "      exclude: [",
      '        "src/generated/**",',
      '        "src/lib/deck/types.ts",',
      '        "src/lib/combos/**",',
      "      ],",
      "    },",
      "  },",
      "  resolve: {",
      '    alias: { "server-only": resolve(__dirname, "./src/test/stubs/server-only.ts") },',
      "  },",
      "});"
    );
    const root = createRepo({ ...MODULES, "vitest.config.ts": config });

    const plan = runMoves(root, [
      TYPES_MOVE,
      COMBOS_MOVE,
      { from: "src/test/stubs", to: "src/test/doubles" },
    ]);

    expect(read(root, "vitest.config.ts")).toBe(
      config
        .replace('"src/lib/deck/types.ts"', `"${TYPES_MOVE.to}"`)
        .replace('"src/lib/combos/**"', '"src/modules/combos/domain/**"')
        .replace(
          '"./src/test/stubs/server-only.ts"',
          '"./src/test/doubles/server-only.ts"'
        )
    );
    expect(plan.scopeChanges).toEqual([]);
  });

  it("rewrites both the import and the plain path string of next.config.ts", () => {
    const config = lines(
      'import createNextIntlPlugin from "next-intl/plugin";',
      'import { headers } from "./src/lib/security-headers";',
      "",
      'const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");',
      "export default withNextIntl({ headers });"
    );
    const root = createRepo({ ...MODULES, "next.config.ts": config });

    runMoves(root, [
      HEADERS_MOVE,
      { from: "src/i18n/request.ts", to: "src/modules/site/i18n/request.ts" },
    ]);

    expect(read(root, "next.config.ts")).toBe(
      config
        .replace(
          '"./src/lib/security-headers"',
          '"./src/modules/site/infrastructure/security-headers"'
        )
        .replace(
          '"./src/i18n/request.ts"',
          '"./src/modules/site/i18n/request.ts"'
        )
    );
  });

  it("rewrites the list items of sonar-project.properties that name a moved path", () => {
    const properties = lines(
      "# Recorded test data stays out of duplication detection.",
      "sonar.sources=src",
      "sonar.exclusions=**/*.test.ts, src/lib/combos/fixtures/**",
      "sonar.coverage.exclusions=src/app/**,src/lib/deck/types.ts,src/generated/**"
    );
    const root = createRepo({
      ...MODULES,
      "sonar-project.properties": properties,
    });

    runMoves(root, [COMBOS_MOVE, TYPES_MOVE]);

    expect(read(root, "sonar-project.properties")).toBe(
      properties
        .replace(
          "src/lib/combos/fixtures/**",
          "src/modules/combos/domain/fixtures/**"
        )
        .replace("src/lib/deck/types.ts", TYPES_MOVE.to)
    );
  });

  it("rewrites a dependency-cruiser pattern that names a moved file or folder, and no broader one", () => {
    const config = lines(
      "module.exports = {",
      "  forbidden: [",
      '    { from: { path: "^src/lib/" }, to: { path: "^src/lib/security-headers\\\\.ts$" } },',
      '    { from: { pathNot: ["^src/lib/combos/", "^src/lib/combos-legacy\\\\.ts$"] }, to: {} },',
      "  ],",
      "};"
    );
    const root = createRepo({ ...MODULES, ".dependency-cruiser.cjs": config });

    runMoves(root, [HEADERS_MOVE, COMBOS_MOVE]);

    expect(read(root, ".dependency-cruiser.cjs")).toBe(
      config
        .replace(
          "^src/lib/security-headers\\\\.ts$",
          "^src/modules/site/infrastructure/security-headers\\\\.ts$"
        )
        .replace('"^src/lib/combos/"', '"^src/modules/combos/domain/"')
    );
  });

  it("reports a moved file that leaves a coverage or test pattern no rewrite can follow", () => {
    const root = createRepo({
      ...MODULES,
      "sonar-project.properties": lines(
        "sonar.coverage.exclusions=src/app/**,src/components/**"
      ),
      "vitest.config.ts": lines(
        "export default {",
        '  test: { coverage: { exclude: ["src/generated/**", "src/components/**"] } },',
        "};"
      ),
    });

    const plan = planMoves(root, [ROW_MOVE]);

    expect(plan.scopeChanges).toEqual([
      {
        file: "sonar-project.properties",
        line: 1,
        list: "sonar.coverage.exclusions",
        from: ROW_MOVE.from,
        to: ROW_MOVE.to,
        change: "leaves",
      },
      {
        file: "vitest.config.ts",
        line: 2,
        list: "exclude",
        from: ROW_MOVE.from,
        to: ROW_MOVE.to,
        change: "leaves",
      },
    ]);
  });

  it("reports no scope change while another pattern of the same list still matches the moved file", () => {
    const root = createRepo({
      ...MODULES,
      "sonar-project.properties": lines(
        "sonar.coverage.exclusions=src/components/**,src/modules/*/ui/**"
      ),
    });

    const plan = planMoves(root, [ROW_MOVE]);

    expect(plan.scopeChanges).toEqual([]);
  });

  it("lists the old paths a config still names where no rewrite applies, such as a comment", () => {
    const root = createRepo({
      ...MODULES,
      "vitest.config.ts": lines(
        "// src/lib/deck/types.ts holds types only, so it is not measured.",
        'export default { test: { coverage: { exclude: ["src/lib/deck/types.ts"] } } };'
      ),
    });

    const plan = runMoves(root, [TYPES_MOVE]);

    expect(plan.configMentions).toEqual([
      {
        file: "vitest.config.ts",
        line: 1,
        mention: "src/lib/deck/types.ts",
        replacement: TYPES_MOVE.to,
      },
    ]);
  });
});

describe("old-path report for docs", () => {
  it("lists every written form of an old path in Markdown, with its replacement, and never rewrites prose", () => {
    const guide = lines(
      "The dice live in `src/lib/dice.ts` and are imported as `@/lib/dice`.",
      "See [the dice](../../src/lib/dice.ts) and lib/dice.",
      "Combos: `lib/combos/index.ts`. Not moved: `src/lib/dicey.ts`, `e2e/lib/dice.ts`."
    );
    const docs = {
      "docs/engineering/guide.md": guide,
      ".agents/rules/moves.mdc": lines("Mock `@/lib/combos` in tests."),
      "README.md": lines("- src/lib/dice.ts: the dice."),
      "CLAUDE.md": lines("No path here."),
    };
    const root = createRepo({ ...MODULES, ...docs });

    const plan = runMoves(root, [DICE_MOVE, COMBOS_MOVE]);

    expect(plan.docMentions).toEqual([
      {
        file: ".agents/rules/moves.mdc",
        line: 1,
        mention: "@/lib/combos",
        replacement: "@/modules/combos/domain",
      },
      {
        file: "README.md",
        line: 1,
        mention: "src/lib/dice.ts",
        replacement: DICE_MOVE.to,
      },
      {
        file: "docs/engineering/guide.md",
        line: 1,
        mention: "src/lib/dice.ts",
        replacement: DICE_MOVE.to,
      },
      {
        file: "docs/engineering/guide.md",
        line: 1,
        mention: "@/lib/dice",
        replacement: "@/modules/playtest/domain/dice",
      },
      {
        file: "docs/engineering/guide.md",
        line: 2,
        mention: "../../src/lib/dice.ts",
        replacement: "../../src/modules/playtest/domain/dice.ts",
      },
      {
        file: "docs/engineering/guide.md",
        line: 2,
        mention: "lib/dice",
        replacement: "modules/playtest/domain/dice",
      },
      {
        file: "docs/engineering/guide.md",
        line: 3,
        mention: "lib/combos/index.ts",
        replacement: "modules/combos/domain/index.ts",
      },
    ]);
    for (const [path, content] of Object.entries(docs))
      expect(read(root, path)).toBe(content);
  });

  it("leaves out the history docs, which record the paths of their day", () => {
    const root = createRepo({
      ...MODULES,
      "docs/project/changelog.md": lines("- Moved `src/lib/dice.ts`."),
      "docs/project/fix-history.md": lines("- Fixed `src/lib/dice.ts`."),
      "docs/product/roadmap.md": lines("- [ ] Split `src/lib/dice.ts`."),
    });

    const plan = planMoves(root, [DICE_MOVE]);

    expect(plan.docMentions).toEqual([]);
  });
});

describe("migration guard", () => {
  const ESLINT_CONFIG = lines(
    "const PRESETS = [];",
    "",
    "// <migration-guard> Written by pnpm refactor:apply-moves from the shim entries of moves.json.",
    "const MIGRATION_SHIMS = [];",
    "// </migration-guard>",
    "",
    'export default [...PRESETS, { rules: { "guard/no-shim": ["error", MIGRATION_SHIMS] } }];'
  );
  const SHIM_CHAIN: readonly Move[] = [
    { from: "src/lib/dice.ts", to: "src/modules/dice.ts", shim: true },
    { from: "src/modules/dice.ts", to: "src/modules/playtest/dice.ts" },
    COMBOS_MOVE,
  ];

  it("writes each shim entry of the move map into the generated section, with its final destination", () => {
    const root = createRepo({ ...MODULES, "eslint.config.mjs": ESLINT_CONFIG });

    runMoves(root, SHIM_CHAIN);

    expect(read(root, "eslint.config.mjs")).toBe(
      ESLINT_CONFIG.replace(
        "const MIGRATION_SHIMS = [];",
        [
          "const MIGRATION_SHIMS = [",
          "  {",
          '    from: "src/lib/dice.ts",',
          '    to: "src/modules/playtest/dice.ts",',
          "  },",
          "];",
        ].join("\n")
      )
    );
  });

  it("changes nothing on a second run, and leaves the old paths of the section out of the report", () => {
    const root = createRepo({ ...MODULES, "eslint.config.mjs": ESLINT_CONFIG });
    runMoves(root, SHIM_CHAIN);
    const afterFirstRun = snapshot(root);

    const second = runMoves(root, SHIM_CHAIN);

    expect(second).toMatchObject({ fileEdits: [], jsonEdits: [] });
    expect(second.configMentions).toEqual([]);
    expect(snapshot(root)).toEqual(afterFirstRun);
  });

  it("empties the section once the series removes the shim mark", () => {
    const root = createRepo({ ...MODULES, "eslint.config.mjs": ESLINT_CONFIG });
    runMoves(root, SHIM_CHAIN);

    runMoves(root, [{ ...SHIM_CHAIN[0], shim: false }, ...SHIM_CHAIN.slice(1)]);

    expect(read(root, "eslint.config.mjs")).toBe(ESLINT_CONFIG);
  });

  it("refuses a shim entry when eslint.config.mjs has no generated section to write it in", () => {
    const root = createRepo({
      ...MODULES,
      "eslint.config.mjs": lines("export default [];"),
    });

    expect(() => planMoves(root, [{ ...DICE_MOVE, shim: true }])).toThrow(
      "eslint.config.mjs has no <migration-guard> section"
    );
  });
});

describe("command line", () => {
  it("prints the config edits, the guard and the doc report in a dry run, and writes nothing", () => {
    const root = createRepo({
      ...MODULES,
      "vitest.config.ts": lines(
        'export default { test: { coverage: { exclude: ["src/lib/dice.ts"] } } };'
      ),
      "eslint.config.mjs": lines(
        "// <migration-guard>",
        "const MIGRATION_SHIMS = [];",
        "// </migration-guard>"
      ),
      "docs/guide.md": lines("Roll with `src/lib/dice.ts`."),
      "scripts/refactor/moves.json": JSON.stringify([
        { ...DICE_MOVE, shim: true },
      ]),
    });

    const result = runCli(root, "--dry-run");

    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      `vitest.config.ts:1 "src/lib/dice.ts" -> "${DICE_MOVE.to}"`
    );
    expect(result.stdout).toContain("eslint.config.mjs: 1 entry");
    expect(result.stdout).toContain(
      `docs/guide.md:1 "src/lib/dice.ts" -> "${DICE_MOVE.to}"`
    );
    expect(git(root, "status", "--porcelain")).toBe("");
  }, 30_000);
});
