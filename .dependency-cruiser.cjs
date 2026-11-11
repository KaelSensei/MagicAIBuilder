// dependency-cruiser configuration for the full import graph, type-only imports
// included: the first half of `pnpm arch` and the source of `pnpm arch:graph`
// (ADR 0007, stage 3). `.dependency-cruiser.runtime.cjs` is the second half: it
// checks the graph that ships, where type-only imports are erased.
//
// What this half checks, on `src/` without its tests:
// - cycles, runtime or type-only;
// - today's layer rules, the same ones ESLint `no-restricted-imports` checks
//   import by import in `eslint.config.mjs` (phase 1, P0-14), so the graph and
//   the linter agree;
// - the rules of the target `src/modules/<context>/` layout (ADR 0001 and
//   ADR 0002). No module exists yet, so they match nothing until the first
//   context moves in, and every context meets them from its first commit;
// - orphans, as information only.
//
// Known violations live in `.dependency-cruiser-known-violations.json`, which
// `pnpm arch` reads with `--ignore-known`. The baseline may only shrink, and a
// fixed violation left in it fails the run (`staleEntriesSeverity` below).
// After fixing one, prune it with
//   pnpm exec depcruise src --config .dependency-cruiser.cjs --baseline --baseline-mode shrink-only
// A pull request that adds an entry says why in its description
// (docs/engineering/quality-gate.md, "Architecture gate").
//
// Rules reference: https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md

/** Test files are not part of the shipped graph; ESLint covers their imports. */
const TEST_FILE = "\\.(test|spec)\\.tsx?$";

/**
 * Matches an npm package by its resolved path. pnpm resolves a package to
 * `node_modules/.pnpm/<name>@<version>/node_modules/<name>/…`, so the pattern
 * anchors on the last `node_modules/<name>/` segment.
 */
function npmPackage(namesPattern) {
  return `(^|/)node_modules/(${namesPattern})/`;
}

/**
 * The layers of a context folder (ADR 0001) and its entry points (ADR 0002).
 * A context is `src/modules/<context>/`.
 */
const MODULES = {
  domainSide: "^src/modules/[^/]+/(domain/|index\\.ts$)",
  browserSide: "^src/modules/[^/]+/(client/|ui/|client\\.ts$)",
  serverSide: "^src/modules/[^/]+/(application/|infrastructure/|server\\.ts$)",
  outerLayers: "^src/modules/[^/]+/(application|infrastructure|client|ui)/",
  entryPoints: "^src/modules/[^/]+/(index|server|client)\\.ts$",
  components: "^src/modules/[^/]+/ui/",
};

/** Prisma, as the generated client package and as the shared instance. */
const PRISMA = [
  "^src/lib/db/prisma\\.ts$",
  npmPackage("@prisma/client|\\.prisma"),
];

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      comment:
        "This import closes a cycle. A cycle makes its modules impossible to understand, test or move one at a " +
        "time. Break it: move the shared type or function into a module both sides can import, or invert the " +
        "dependency (ADR 0007). Type-only cycles count too; the three that existed in 2026-11 are in the baseline.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "lib-not-outer-layers",
      comment:
        "`src/lib` sits below components, hooks and routes. Move the shared type or function down into " +
        "`src/lib`, or let the caller pass it in (eslint.config.mjs, libIntoOuterLayers).",
      severity: "error",
      from: { path: "^src/lib/" },
      to: { path: "^src/(components|hooks|app)/" },
    },
    {
      name: "ui-not-routes",
      comment:
        "Components and hooks must not import from `src/app` (routes and route handlers). Move the shared type " +
        "down into `src/lib` (eslint.config.mjs, uiIntoRoutes).",
      severity: "error",
      from: { path: "^src/(components|hooks)/" },
      to: { path: "^src/app/" },
    },
    {
      name: "ui-not-database",
      comment:
        "Components and hooks run in the browser: they reach data through an API route and its typed client, " +
        "never through Prisma (eslint.config.mjs, uiIntoDatabase).",
      severity: "error",
      from: { path: "^src/(components|hooks)/" },
      to: { path: PRISMA },
    },
    {
      name: "domain-is-pure",
      comment:
        "`domain/` and `index.ts` hold readonly data and pure functions (ADR 0003): no framework, store, " +
        "database or outer layer. Declare a port in `domain/` and let an outer layer implement it.",
      severity: "error",
      from: { path: MODULES.domainSide },
      to: {
        path: [
          MODULES.outerLayers,
          "^src/modules/[^/]+/(server|client)\\.ts$",
          "^src/lib/db/",
          npmPackage(
            "react|react-dom|next|next-intl|next-auth|zustand|@tanstack/[^/]+|@prisma/client|\\.prisma|server-only"
          ),
        ],
      },
    },
    {
      name: "browser-layers-not-server",
      comment:
        "`client/`, `ui/` and `client.ts` ship to the browser (ADR 0002): no Prisma, no server-only module, no " +
        "`server.ts`, `application/` or `infrastructure/`. Go through the context's API client.",
      severity: "error",
      from: { path: MODULES.browserSide },
      to: { path: [MODULES.serverSide, ...PRISMA, npmPackage("server-only")] },
    },
    {
      name: "public-api-only",
      comment:
        "Another context is reached only through its `index.ts`, `server.ts` or `client.ts`, or a component " +
        "path under `ui/` (ADR 0002). Export what you need from the right entry point instead of importing an " +
        "internal file.",
      severity: "error",
      // `$1` is the context captured by `from`: a context may import its own files.
      from: { path: "^src/modules/([^/]+)/" },
      to: {
        path: "^src/modules/[^/]+/",
        pathNot: ["^src/modules/$1/", MODULES.entryPoints, MODULES.components],
      },
    },
    {
      name: "no-orphans",
      comment:
        "This module imports nothing and nothing imports it, so it is probably dead. Advisory only: deleting a " +
        "feature is an owner decision (decision D8 of the clean-code programme).",
      severity: "info",
      from: {
        orphan: true,
        pathNot: [
          "\\.d\\.ts$",
          // Test support and fixtures are imported by tests, which are not cruised.
          "^src/test/",
          "/fixtures/",
          // Loaded by next.config.ts, outside src/.
          "^src/lib/security-headers\\.ts$",
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: ["node_modules"] },
    exclude: { path: [TEST_FILE] },
    // Keep type-only imports in the graph: the cycle rule must see them, and
    // the layer rules mirror ESLint, which bans `import type` as well.
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs"],
      mainFields: ["main", "types", "typings"],
    },
    skipAnalysisNotInRules: true,
    // A violation fixed but still listed in the baseline fails the run, so the
    // baseline shrinks in the same pull request as the fix.
    baseline: { staleEntriesSeverity: "error" },
    // Readable node names keep the generated graph's diffs reviewable.
    reporterOptions: { mermaid: { minify: false } },
  },
};
