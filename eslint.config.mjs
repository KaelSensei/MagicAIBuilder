// ESLint 9 flat config: the single lint configuration for the repository, run
// by `pnpm lint` and by lint-staged on commit. `next build` does not lint (see
// `eslint.ignoreDuringBuilds` in next.config.ts); CI runs `pnpm lint` instead.
//
// It replaces `next lint` and the legacy `.eslintrc.json` (`next lint` is
// deprecated in Next.js 15.5 and removed in 16) with the same rule set:
// - `eslint-config-next@15.5.x` still ships only eslintrc-style presets, so
//   FlatCompat from `@eslint/eslintrc` loads them, as the Next.js 15 docs show:
//   https://nextjs.org/docs/15/app/api-reference/config/eslint (2025-06-16).
// - Moving to the native flat presets of `eslint-config-next@16` changes the
//   rule set (new React Hooks rules), so it waits for the Next.js 16 upgrade.
//
// On top of the presets it carries the lint ratchets of stage 4 of
// docs/adr/0007-architecture-enforcement-in-stages.md. Every ratchet rule is
// an `error`; the breaches that existed when a rule arrived are recorded in
// `eslint-suppressions.json` (ESLint bulk suppressions, ESLint >= 9.24:
// https://eslint.org/docs/latest/use/suppressions). A new breach, or one more
// breach of a rule in a file that already has some, fails `pnpm lint`.
// docs/engineering/quality-gate.md ("Lint ratchet") says how to shrink the file.
import { FlatCompat } from "@eslint/eslintrc";
import vitest from "@vitest/eslint-plugin";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/**
 * Test code and test data. The ratchets target shipped code: tests keep the
 * preset rules, because a test file is long by nature (one case per rule it
 * pins) and casts recorded wire shapes on purpose.
 */
const TEST_FILES = [
  "**/*.test.{ts,tsx}",
  "src/test/**",
  "**/testing/**",
  "**/fixtures/**",
];

/**
 * The test files Vitest runs (`include` in vitest.config.ts). Playwright specs
 * under `e2e/` are named `*.spec.ts`, so they are not matched.
 */
const VITEST_FILES = ["**/*.test.{ts,tsx}"];

/** Every TypeScript module under `src/`; combine with `ignores: TEST_FILES`. */
const SOURCE_FILES = ["src/**/*.{ts,tsx}"];

/**
 * Line limits count code only. The comment standard
 * (docs/adr/0006-comment-and-documentation-standard.md) asks for module
 * headers, TSDoc on exports and "why" comments; they must never push a module
 * over a limit.
 */
const CODE_LINES_ONLY = { skipComments: true, skipBlankLines: true };

/**
 * Import bans for the boundary rules, phase 1 (ADR 0007, and ADR 0002 for
 * the browser and server split). Each value is one entry of the
 * `patterns` option of `no-restricted-imports`, which matches the specifier as
 * written. That is enough because cross-folder imports use the `@/` alias;
 * the `parentRelative` ban closes the one way around it. dependency-cruiser
 * (ADR 0007 stage 3) adds the transitive view.
 */
const IMPORT_BANS = {
  parentRelative: {
    regex: "^\\.\\./",
    message:
      "Import through the `@/` alias, not `../`: the boundary rules match specifiers, and a parent-relative path slips past them.",
  },
  testSupport: {
    regex: "^@/test(/|$)|(^|/)testing(/|$)",
    message:
      "`src/test` and `testing/` folders hold test support: only tests may import them.",
  },
  libIntoOuterLayers: {
    regex: "^@/(components|hooks|app)(/|$)",
    message:
      "`src/lib` sits below components, hooks and routes. Move the shared type or function down into `src/lib`, or let the caller pass it in.",
  },
  uiIntoRoutes: {
    regex: "^@/app(/|$)",
    message:
      "Components and hooks must not import from `src/app` (routes and route handlers). Move the shared type down into `src/lib`.",
  },
  uiIntoDatabase: {
    regex: "^(@/lib/db/prisma|@prisma/client)(/|$)",
    message:
      "Components and hooks run in the browser: they reach data through an API route and its typed client, never through Prisma.",
  },
  domainImpurity: {
    regex:
      "^(react|react-dom|next|next-intl|next-auth|zustand|@tanstack/[^/]+|@prisma/client|server-only)(/|$)|^@/lib/db(/|$)|^@/modules/[^/]+/(application|infrastructure|client|ui)(/|$)",
    message:
      "`domain/` holds readonly data and pure functions (ADR 0003): no framework, store, database or outer layer. Declare a port in `domain/` and let an outer layer implement it.",
  },
  browserIntoServer: {
    regex:
      "^(@prisma/client|server-only)(/|$)|^@/lib/db/prisma$|^@/modules/[^/]+/(server|application|infrastructure)(/|$)",
    message:
      "`client/` and `ui/` ship to the browser (ADR 0002): no Prisma, no server-only module, no `server.ts`, `application/` or `infrastructure/`. Go through the context's API client.",
  },
};

/**
 * The `no-restricted-imports` setting for one group of files. ESLint keeps
 * only the options of the last config object that sets a rule for a file, so
 * every block passes all the bans that apply to its files, not just its own.
 */
function banImports(...bans) {
  return {
    "no-restricted-imports": [
      "error",
      { patterns: bans.map((ban) => ({ ...ban, caseSensitive: true })) },
    ],
  };
}

const eslintConfig = [
  // Prisma client output, regenerated by `prisma generate`.
  { ignores: ["src/generated/**"] },
  // Flat config warns on unused `eslint-disable` comments by default; `next
  // lint` did not. Keep it off so this migration adds no finding.
  { linterOptions: { reportUnusedDisableDirectives: "off" } },
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    rules: {
      // An underscore marks a binding that is unused on purpose.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  }),

  // Size and complexity ratchet (ADR 0007, stage 4). The limits are the
  // ones the clean-code and typescript-craftsmanship skills already state:
  // a component module holds at most 200 lines and any other module 300, a
  // function stays readable on one screen, nesting stops at 3 and complexity
  // at 15 (SonarCloud's default threshold). They were prose only until this
  // rule; the modules and functions that had outgrown them by then are the
  // entries for these five rules in `eslint-suppressions.json`.
  {
    files: ["src/**/*.ts"],
    ignores: TEST_FILES,
    rules: { "max-lines": ["error", { max: 300, ...CODE_LINES_ONLY }] },
  },
  {
    // A `.tsx` module holds one component and its small helpers; a container
    // composes small presentational components, and logic lives in a hook or
    // in pure domain functions (ADR 0001, the `ui/` layer).
    files: ["src/**/*.tsx"],
    ignores: TEST_FILES,
    rules: { "max-lines": ["error", { max: 200, ...CODE_LINES_ONLY }] },
  },
  {
    files: SOURCE_FILES,
    ignores: TEST_FILES,
    rules: {
      "max-lines-per-function": ["error", { max: 80, ...CODE_LINES_ONLY }],
      // Cyclomatic complexity: the number of independent paths a test list
      // has to cover.
      complexity: ["error", 15],
      // Deep nesting hides the main path; guard clauses keep it flat.
      "max-depth": ["error", 3],
      // A fourth positional argument is a parameter object waiting to be
      // named. The typescript-eslint variant ignores a `this: void` parameter.
      "@typescript-eslint/max-params": ["error", { max: 3 }],
    },
  },

  // Type-escape ratchet (ADR 0007, stage 4). Strict TypeScript is only
  // as strong as its escape hatches: a cast (`x as T`, `<T>x`) or a non-null
  // assertion (`x!`) tells the compiler to stop checking, and the
  // typescript-craftsmanship skill forbids both. Narrow instead: a type
  // guard, a Zod parse at the boundary (ADR 0003, "parse once"), `satisfies`,
  // or an explicit `undefined` check. `as const` widens nothing and stays
  // allowed.
  {
    files: SOURCE_FILES,
    ignores: TEST_FILES,
    rules: {
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
    },
  },

  // Import boundaries, phase 1 (ADR 0007). The blocks run from general to
  // specific, and each repeats the general bans (see `banImports`). The
  // parent-relative ban covers tests too, so every cross-folder import under
  // `src/` has the one `@/` form that readers and the move codemod rely on.
  { files: SOURCE_FILES, rules: banImports(IMPORT_BANS.parentRelative) },
  {
    files: SOURCE_FILES,
    ignores: TEST_FILES,
    rules: banImports(IMPORT_BANS.parentRelative, IMPORT_BANS.testSupport),
  },
  {
    // The kernel and today's domain code must not depend on the layers built
    // on top of them; such an edge is how cycles and fat client bundles start.
    files: ["src/lib/**/*.{ts,tsx}"],
    ignores: TEST_FILES,
    rules: banImports(
      IMPORT_BANS.parentRelative,
      IMPORT_BANS.testSupport,
      IMPORT_BANS.libIntoOuterLayers
    ),
  },
  {
    files: ["src/components/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
    ignores: TEST_FILES,
    rules: banImports(
      IMPORT_BANS.parentRelative,
      IMPORT_BANS.testSupport,
      IMPORT_BANS.uiIntoRoutes,
      IMPORT_BANS.uiIntoDatabase
    ),
  },
  // Pre-armed layer bans for `src/modules/<context>/` (ADR 0001 to 0003). No
  // module exists yet, so they start with no breach, and every module that
  // moves in meets them from its first commit. `index.ts` is the pure entry
  // point and `client.ts` the browser one (ADR 0002).
  {
    files: ["src/modules/*/domain/**/*.{ts,tsx}", "src/modules/*/index.ts"],
    ignores: TEST_FILES,
    rules: banImports(
      IMPORT_BANS.parentRelative,
      IMPORT_BANS.testSupport,
      IMPORT_BANS.domainImpurity
    ),
  },
  {
    files: [
      "src/modules/*/client/**/*.{ts,tsx}",
      "src/modules/*/ui/**/*.{ts,tsx}",
      "src/modules/*/client.ts",
    ],
    ignores: TEST_FILES,
    rules: banImports(
      IMPORT_BANS.parentRelative,
      IMPORT_BANS.testSupport,
      IMPORT_BANS.browserIntoServer
    ),
  },

  // Test hygiene (ADR 0005). `@vitest/eslint-plugin` knows Vitest's API, so
  // its rules read `vi.mock` and `it.only` the way Vitest does. It is
  // registered for test files only; no rule of it is switched on yet.
  { files: VITEST_FILES, plugins: { vitest } },
];

export default eslintConfig;
