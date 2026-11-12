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
//
// Last comes the migration guard of the move codemod (scripts/refactor/README.md).
import { FlatCompat } from "@eslint/eslintrc";
import vitest from "@vitest/eslint-plugin";
import { migrationGuard } from "./scripts/refactor/migration-guard-rule.mjs";

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

/** A `vi.mock(…)` or `vi.doMock(…)` call, as an esquery selector. */
const VI_MOCK_CALL =
  "CallExpression[callee.object.name='vi'][callee.property.name=/^(mock|doMock)$/]";

/**
 * A module path of this repository: the `@/` alias or a relative path.
 * esquery regexes cannot contain a `/`, hence `\u002F`.
 */
const INTERNAL_PATH = "/^(@\\u002F|\\.)/";

/**
 * Mocked modules the internal-mock ban lets through, for now.
 *
 * Why: a route handler reaches the database through `@/lib/db/prisma` and the
 * session through Auth.js's `auth()` in `@/lib/auth/config`. Until a context
 * has a repository port and an injected session (phases 3 and later of the
 * migration, ADR 0001 and docs/engineering/architecture.md), its route
 * characterization tests can only replace those two modules with a mock.
 *
 * This exemption is transitional. Each context's move series removes it for
 * its own routes once its repository port lands: a config block for that
 * context's tests applies the ban without the exemption. The list is deleted
 * when the last context has moved. These mocks still take the typed form
 * (`prefer-import-in-mock`).
 */
const TRANSITIONAL_MOCK_SEAMS = ["@/lib/db/prisma", "@/lib/auth/config"];

/** esquery conditions that keep the transitional seams out of a selector on `field`. */
function exceptSeams(field) {
  return TRANSITIONAL_MOCK_SEAMS.map((seam) => `[${field}!='${seam}']`).join(
    ""
  );
}

const INTERNAL_MOCK_MESSAGE =
  "Do not mock a module of this repository (ADR 0005, rule 5): test through its public behaviour, with an in-memory fake behind a port or MSW for HTTP.";

/**
 * `no-restricted-syntax` entries for ADR 0005, rule 5: no new mock of an
 * internal module, in the string form or the typed `import()` form. Test the
 * behaviour through the module's public surface, with in-memory fakes behind
 * a port and MSW at the HTTP boundary. Packages (`next/navigation`) and the
 * transitional seams above may still be mocked. Existing internal mocks are
 * the baseline in `eslint-suppressions.json`; they go as their context
 * migrates.
 */
const INTERNAL_MOCK_BANS = [
  {
    selector: `${VI_MOCK_CALL}[arguments.0.type='Literal'][arguments.0.value=${INTERNAL_PATH}]${exceptSeams("arguments.0.value")}`,
    message: INTERNAL_MOCK_MESSAGE,
  },
  {
    selector: `${VI_MOCK_CALL}[arguments.0.type='ImportExpression'][arguments.0.source.value=${INTERNAL_PATH}]${exceptSeams("arguments.0.source.value")}`,
    message: INTERNAL_MOCK_MESSAGE,
  },
];

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
  applicationAdapters: {
    regex:
      "^(next|zod|@prisma/client)(/|$)|^@/lib/db(/|$)|^@/modules/[^/]+/(infrastructure|client|ui)(/|$)",
    message:
      "`application/` holds use cases that take a parsed command and call ports, so they run without Next.js, a database or the network (ADR 0001, ADR 0003). Declare a port in `application/`, implement it in `infrastructure/`, and wire both in `server.ts`.",
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

/**
 * The temporary re-export shims of the move series in progress (decision D8):
 * the `"shim": true` entries of scripts/refactor/moves.json, each with the
 * path its module moved to. Empty between series. The section between the
 * two marker comments is written by `pnpm refactor:apply-moves`.
 */
// <migration-guard> Generated by pnpm refactor:apply-moves from scripts/refactor/moves.json. Do not edit.
const MIGRATION_SHIMS = [];
// </migration-guard>

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
  // Layer bans for `src/modules/<context>/` (ADR 0001 to 0003). They were
  // armed before the first context moved in, so every module meets them from
  // its first commit. `index.ts` is the pure entry point and `client.ts` the
  // browser one (ADR 0002).
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
  {
    // A use case is not an adapter (docs/architecture/target-structure.md,
    // "Enforcement"); dependency-cruiser's `application-is-not-an-adapter`
    // checks the same edges on resolved paths. `fetch` is a global, which
    // only ESLint can see.
    files: ["src/modules/*/application/**/*.{ts,tsx}"],
    ignores: TEST_FILES,
    rules: {
      ...banImports(
        IMPORT_BANS.parentRelative,
        IMPORT_BANS.testSupport,
        IMPORT_BANS.applicationAdapters
      ),
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "A use case does not call the network: declare a port in `application/` and implement it with `fetch` in `infrastructure/` (ADR 0004).",
        },
      ],
    },
  },

  // Test hygiene (ADR 0005, rules 5 and 7). `@vitest/eslint-plugin` knows
  // Vitest's API, so its rules read `vi.mock` and `it.only` the way Vitest
  // does. The mocks that predate these rules are recorded in
  // `eslint-suppressions.json`, like the other ratchets. ESLint keeps only
  // the last block's options for a rule, so a later block may set
  // `no-restricted-syntax` for test files only to tighten the ban for one
  // context (see TRANSITIONAL_MOCK_SEAMS); `src/test/test-hygiene-lint.test.ts`
  // fails if the ban is lost.
  {
    files: VITEST_FILES,
    plugins: { vitest },
    rules: {
      // `vi.mock(import("@/x"))`: `tsc` checks the path and the factory
      // against the real module, so a moved module cannot leave a mock that
      // silently applies to nothing. Its autofix is off: lint-staged runs
      // `eslint --fix` on every staged file, and would rewrite a baselined
      // mock whose factory then fails `tsc`, and leave a stale suppression
      // that fails the commit. docs/engineering/quality-gate.md says how to
      // convert a file on purpose.
      "vitest/prefer-import-in-mock": ["error", { fixable: false }],
      "no-restricted-syntax": ["error", ...INTERNAL_MOCK_BANS],
      // A committed `.only` silently skips the rest of the file in CI, and
      // `.skip` disables a test; both are forbidden moves (ADR 0005, rule 7).
      // No autofix: the author sees the failure instead of a silent edit.
      "vitest/no-focused-tests": ["error", { fixable: false }],
      "vitest/no-disabled-tests": "error",
    },
  },

  // SonarCloud parity (docs/engineering/quality-gate.md, "Sonar parity
  // rules"). SonarCloud is advisory, so the findings it kept raising on new
  // pull requests get an ESLint twin here and fail `pnpm lint` before the
  // push. Both plugins come with `eslint-config-next`, whose block above
  // declares them; this block only sets the rules. Tests are included: Sonar
  // reports them too, and a test's JSX ships to nobody but still trains the
  // next copy-paste.
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // S6819: a `role` that a native element already carries hides that
      // element's keyboard and assistive-technology behaviour behind a
      // re-implementation. `<dialog>`, `<fieldset>`, `<output>`, `<img>`,
      // `<button>` and `<hr>` (a separator) replace the role; roles with no
      // element, such as `switch` or `tooltip`, stay allowed.
      "jsx-a11y/prefer-tag-over-role": "error",
      // S6478: a component declared inside another component's body gets a
      // new identity on every render, so React unmounts and remounts its
      // subtree and loses its state. Declare it at module level and pass what
      // it needs as props.
      "react/no-unstable-nested-components": "error",
    },
  },

  // Migration guard (decision D8). While a shim keeps an old path alive,
  // nothing may import or `vi.mock` that path: a mock of the shim does not
  // mock the moved module. The rule resolves `@/` and relative specifiers,
  // and names the module to use instead. It is its own rule so that it never
  // replaces the `no-restricted-imports` or `no-restricted-syntax` options of
  // the blocks above (ESLint keeps only the last options set for a rule).
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "migration-guard": migrationGuard },
    rules: {
      "migration-guard/no-shim-import": [
        "error",
        { root: import.meta.dirname, shims: MIGRATION_SHIMS },
      ],
    },
  },
];

export default eslintConfig;
